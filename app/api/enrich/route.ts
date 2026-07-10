import { NextRequest, NextResponse } from "next/server";
import { enrichRequestSchema } from "@/lib/validations/schemas";
import { enrichCompany } from "@/lib/services/data-orchestrator";
import { analyzeCompany } from "@/lib/services/ai-engine";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 1. Rate Limiting (10 enrichments per minute)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
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
    return NextResponse.json(
      { error: "Failed to enrich company data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
