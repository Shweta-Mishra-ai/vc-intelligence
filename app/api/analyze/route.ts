import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

interface EnrichmentData {
  summary: string;
  bullets: string[];
  keywords: string[];
  signals: string[];
  sources: string[];
  timestamp: string;
}

interface AnalysisResponse {
  matchScore: number;
  strengths: string[];
  risks: string[];
  verdict: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrichedData, thesis } = body;

    if (!enrichedData || !thesis) {
      return NextResponse.json(
        { error: "Missing required fields: enrichedData and thesis" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const enrichment = enrichedData as EnrichmentData;

    // Validate enrichment data structure
    if (
      !enrichment.summary ||
      !Array.isArray(enrichment.bullets) ||
      !Array.isArray(enrichment.keywords) ||
      !Array.isArray(enrichment.signals)
    ) {
      return NextResponse.json(
        { error: "Invalid enrichment data structure" },
        { status: 400 }
      );
    }

    if (typeof thesis !== "string" || !thesis.trim()) {
      return NextResponse.json(
        { error: "Thesis must be a non-empty string" },
        { status: 400 }
      );
    }

    const prompt = `You are a Senior VC Partner evaluating a startup investment opportunity. Analyze the following company data against the provided investment thesis.

Investment Thesis: ${thesis.trim()}

Company Data:
Summary: ${enrichment.summary}

What They Do:
${enrichment.bullets.map((b) => `- ${b}`).join("\n")}

Keywords: ${enrichment.keywords.join(", ")}

Signals: ${enrichment.signals.join(", ")}

Evaluate this company against the investment thesis and provide a structured analysis. Return ONLY valid JSON with no markdown formatting, no code blocks, and no additional text.

Return a JSON object with this exact structure:
{
  "matchScore": <number from 0 to 100 representing how well the company matches the thesis>,
  "strengths": ["2-3 bullet points explaining why it's a good investment based on the thesis"],
  "risks": ["2-3 bullet points highlighting potential risks or mismatches"],
  "verdict": "<2-sentence final conclusion on whether to take a meeting with the founders>"
}

Be honest, critical, and specific. Base your analysis on the actual data provided.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a Senior VC Partner with 20+ years of experience evaluating startups. You provide honest, critical, and data-driven investment analysis. Always return valid JSON only, no markdown, no code blocks, no explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    let parsed: AnalysisResponse;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse JSON response");
      }
    }

    // Validate and ensure correct structure
    const analysis: AnalysisResponse = {
      matchScore: Math.max(0, Math.min(100, Number(parsed.matchScore) || 50)),
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.slice(0, 3)
        : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 3) : [],
      verdict: parsed.verdict || "Analysis incomplete.",
    };

    // Ensure minimum requirements
    if (analysis.strengths.length < 2) {
      analysis.strengths = analysis.strengths.concat([
        "Requires further evaluation",
      ].slice(0, 2 - analysis.strengths.length));
    }
    if (analysis.risks.length < 2) {
      analysis.risks = analysis.risks.concat([
        "Requires further evaluation",
      ].slice(0, 2 - analysis.risks.length));
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to analyze company";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
