import { NextRequest, NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/validations/schemas";
import { analyzeCompany } from "@/lib/services/ai-engine";
import { rateLimit } from "@/lib/rate-limit";
import { OrchestratedData } from "@/lib/services/data-orchestrator";

export async function POST(request: NextRequest) {
  // 1. Rate Limiting (20 analyses per minute)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limitCheck = rateLimit(`analyze:${ip}`, 20, 60000);
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    const body = await request.json();
    
    // 2. Schema Validation
    const validation = analyzeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { enrichedData, thesis, weights } = validation.data;

    // 3. Reconstruct OrchestratedData from enrichedData payload
    const rawEnriched = body.enrichedData;
    const company = rawEnriched.company || {
      id: rawEnriched.sources?.[0]?.replace(/[^a-zA-Z0-9]/g, "-") || "unknown",
      name: "Enriched Company",
      website: rawEnriched.sources?.[0] || "",
      shortDescription: rawEnriched.summary || "",
    };

    const orchestratedData: OrchestratedData = {
      company,
      scrapedContent: `
Summary: ${rawEnriched.summary}
What They Do:
${rawEnriched.bullets?.map((b: string) => `- ${b}`).join("\n")}
Signals: ${rawEnriched.signals?.join(", ")}
Keywords: ${rawEnriched.keywords?.join(", ")}
      `.trim(),
      techStack: rawEnriched.keywords || [],
      competitors: rawEnriched.competitors || [],
      githubMetrics: rawEnriched.rawData?.github,
      wikiSummary: rawEnriched.rawData?.wiki,
      scrapedTitle: rawEnriched.rawData?.scrapedTitle,
      sources: rawEnriched.sources || [],
    };

    // 4. Generate AI analysis against thesis with custom weights
    const analysisResult = await analyzeCompany(orchestratedData, thesis, weights);

    // Merge in company metadata
    const responseData = {
      ...analysisResult,
      company,
    };

    return NextResponse.json(
      responseData,
      { headers: { "X-RateLimit-Remaining": String(limitCheck.remaining) } }
    );

  } catch (error) {
    console.error("Analysis route error:", error);
    return NextResponse.json(
      { error: "Failed to analyze company", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
