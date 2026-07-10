import OpenAI from "openai";
import { EnrichmentData, AnalysisWeights } from "../types";
import { OrchestratedData } from "./data-orchestrator";

// Initialize OpenAI client dynamically based on which key is present.
// Fallback order: Gemini (via OpenAI compatibility endpoint) -> OpenAI
function getClientAndModel() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const apiKey = geminiKey || openaiKey || "dummy-key-for-build";
  
  const baseURL = geminiKey 
    ? "https://generativelanguage.googleapis.com/v1beta/openai/" 
    : undefined;
    
  const model = geminiKey ? "gemini-1.5-flash" : "gpt-4o-mini";

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  return { client, model };
}

const DEFAULT_WEIGHTS: AnalysisWeights = {
  market: 0.20,
  team: 0.18,
  product: 0.12,
  traction: 0.18,
  financial: 0.07,
  competitive: 0.10,
  timing: 0.05,
  momentum: 0.10,
};

/**
 * Invokes the AI model (Gemini or OpenAI) to perform a deep 8-dimension startup validation analysis.
 * 
 * @param orchestratedData Merged data from all data services
 * @param thesis Investment thesis to validate against
 * @param customWeights Optional custom weights for overall score calculation
 * @returns Complete EnrichmentData analysis record
 */
export async function analyzeCompany(
  orchestratedData: OrchestratedData,
  thesis: string,
  customWeights?: Partial<AnalysisWeights>
): Promise<EnrichmentData> {
  const { client, model } = getClientAndModel();
  
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  
  const systemPrompt = `You are a world-class venture capital investment partner.
Analyze the provided company metadata, scraped text, web search results, and repository metrics against the user's Investment Thesis.
You will evaluate the startup across 8 core dimensions and output a detailed investment evaluation in JSON format.

Your output must be a valid JSON object matching this structure EXACTLY:
{
  "summary": "1-2 sentence overall summary of the company description.",
  "bullets": ["3-5 core bullet points highlighting their product, offering, and target audience."],
  "keywords": ["5-10 tag keywords representing their tech/market domain."],
  "signals": ["3-5 derived growth or market signals inferred from web/code activity."],
  
  "marketScore": 0-100 integer,
  "teamScore": 0-100 integer,
  "productScore": 0-100 integer,
  "tractionScore": 0-100 integer,
  "financialScore": 0-100 integer,
  "competitiveScore": 0-100 integer,
  "timingScore": 0-100 integer,
  "momentumScore": 0-100 integer,
  
  "verdict": "STRONG_INVEST" | "PROMISING" | "MODERATE" | "WEAK" | "PASS",
  "verdictText": "2-3 sentences explaining the investment recommendation based on the thesis.",
  "tamEstimate": "Estimated total addressable market size (e.g. $12.5B, N/A if unknown).",
  "runwayConfidence": "High" | "Medium" | "Low",
  "failureRiskPct": 0-100 integer representing failure risk,
  
  "strengths": ["3 core strengths mapping to the thesis"],
  "risks": ["3 core risks or mismatch items"],
  "competitors": [{"name": "Competitor Name", "website": "URL", "overlapPct": 0-100, "description": "1 sentence description"}]
}

Ensure all scores are data-driven, honest, and critical. Evaluate strictly against the provided thesis.`;

  const userPrompt = `
Investment Thesis:
"${thesis}"

Company Profile:
Name: ${orchestratedData.company.name}
Website: ${orchestratedData.company.website}
Domain: ${orchestratedData.company.domain}
Short Description: ${orchestratedData.company.shortDescription}
Founded Year: ${orchestratedData.company.foundedYear || "Unknown"}
HQ Location: ${orchestratedData.company.hqLocation || "Unknown"}

GitHub Metrics:
${orchestratedData.githubMetrics ? JSON.stringify(orchestratedData.githubMetrics, null, 2) : "No open source repository metrics available."}

Merged Web & Scraped Content:
${orchestratedData.scrapedContent}

Competitors Discovered:
${JSON.stringify(orchestratedData.competitors, null, 2)}
  `;

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AI Engine: Empty response returned from the AI model.");
    }

    const parsed = JSON.parse(content);
    
    // Calculate the weighted overall score programmatically to ensure mathematical correctness
    const overallScore = Math.round(
      (parsed.marketScore || 50) * weights.market +
      (parsed.teamScore || 50) * weights.team +
      (parsed.productScore || 50) * weights.product +
      (parsed.tractionScore || 50) * weights.traction +
      (parsed.financialScore || 50) * weights.financial +
      (parsed.competitiveScore || 50) * weights.competitive +
      (parsed.timingScore || 50) * weights.timing +
      (parsed.momentumScore || 50) * weights.momentum
    );

    // Merge in programmatic data (sources and timestamps)
    const result: EnrichmentData = {
      summary: parsed.summary || orchestratedData.company.shortDescription,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      sources: orchestratedData.sources,
      timestamp: new Date().toISOString(),
      
      marketScore: parsed.marketScore || 50,
      teamScore: parsed.teamScore || 50,
      productScore: parsed.productScore || 50,
      tractionScore: parsed.tractionScore || 50,
      financialScore: parsed.financialScore || 50,
      competitiveScore: parsed.competitiveScore || 50,
      timingScore: parsed.timingScore || 50,
      momentumScore: parsed.momentumScore || 50,
      
      overallScore,
      verdict: parsed.verdict || "MODERATE",
      verdictText: parsed.verdictText || "Investment verdict incomplete.",
      
      tamEstimate: parsed.tamEstimate || undefined,
      runwayConfidence: parsed.runwayConfidence || "Medium",
      failureRiskPct: parsed.failureRiskPct || 50,
      
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : orchestratedData.competitors,
      rawData: {
        github: orchestratedData.githubMetrics,
        wiki: orchestratedData.wikiSummary,
        scrapedTitle: orchestratedData.scrapedTitle,
      },
    };

    return result;
  } catch (error) {
    console.error("AI Engine: Analysis call failed:", error);
    
    // Graceful fallback values in case of API failure (never throw or crash the app)
    return {
      summary: orchestratedData.company.shortDescription,
      bullets: ["Ingestion succeeded, but AI analysis engine is currently unavailable."],
      keywords: ["Ingested"],
      signals: ["Enrichment complete"],
      sources: orchestratedData.sources,
      timestamp: new Date().toISOString(),
      marketScore: 50,
      teamScore: 50,
      productScore: 50,
      tractionScore: 50,
      financialScore: 50,
      competitiveScore: 50,
      timingScore: 50,
      momentumScore: 50,
      overallScore: 50,
      verdict: "MODERATE",
      verdictText: "AI Engine was unable to complete the analysis. Please check your API keys.",
      strengths: ["Data successfully ingested"],
      risks: ["AI analysis failed"],
      competitors: orchestratedData.competitors,
    };
  }
}
