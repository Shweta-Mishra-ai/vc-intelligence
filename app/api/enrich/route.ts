import { NextRequest, NextResponse } from "next/server";
import { enrichRequestSchema } from "@/lib/validations/schemas";
import { enrichCompany } from "@/lib/services/data-orchestrator";
import { analyzeCompany } from "@/lib/services/ai-engine";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isUrlAllowed } from "@/lib/services/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Enrich API is live. Use POST with {url}" },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

export async function POST(request: NextRequest) {
  // 1. Rate Limiting (10 enrichments per minute)
  const ip = getClientIp(request);
  const limitCheck = rateLimit(`enrich:${ip}`, 10, 60000);
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    const body = await request.json();
    
    // 2. Schema Validation
    const validation = enrichRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { url } = validation.data;

    // 2b. SSRF guard - block private IPs before orchestrating
    const normalizedForCheck = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    const allowed = isUrlAllowed(normalizedForCheck);
    if (!allowed.allowed) {
      return NextResponse.json(
        { error: "URL not allowed", details: allowed.reason },
        { status: 400 }
      );
    }

    // 3. Multi-source data orchestration
    const orchestratedData = await enrichCompany(url);

    // 4. Synthesize deep analysis using default thesis
    const defaultThesis = "B2B AI SaaS tools, developer productivity, or high-growth tech platforms with clear competitive differentiation.";
    const enrichmentData = await analyzeCompany(orchestratedData, defaultThesis);

    // Merge in company metadata so frontend gets full info
    const responseData = {
      ...enrichmentData,
      company: orchestratedData.company,
      techStack: orchestratedData.techStack,
    };

    return NextResponse.json(
      responseData,
      { headers: { "X-RateLimit-Remaining": String(limitCheck.remaining) } }
    );

  } catch (error) {
    console.error("Enrichment route error:", error);
    const isProd = process.env.NODE_ENV === "production";
    const message = error instanceof Error ? error.message : String(error);
    // Avoid leaking SSRF/internal details verbatim in prod
    const safeMessage = message.includes("SSRF") ? message : (isProd ? "Internal error. Please try again." : message);
    return NextResponse.json(
      { error: "Failed to enrich company data", details: safeMessage },
      { status: 500 }
    );
  }
}
