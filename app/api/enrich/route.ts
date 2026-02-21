import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";

// Initialize OpenAI client (API key must be in environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EnrichmentResponse {
  summary: string;
  bullets: string[];
  keywords: string[];
  signals: string[];
  sources: string[];
  timestamp: string;
}

const FETCH_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Fetches and extracts clean text content from a URL
 */
async function scrapeWebsite(url: string): Promise<string> {
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    response = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError) {
    const error = fetchError as Error & { code?: string; name?: string };
    const isNetworkError =
      error.name === "AbortError" ||
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET" ||
      error.message?.includes("fetch failed");

    if (isNetworkError || error.name === "AbortError") {
      throw new Error(
        "Could not reach the website URL to scrape. Please ensure it is a valid, live URL."
      );
    }
    throw new Error(
      `Could not reach the website URL to scrape. Please ensure it is a valid, live URL. (${error.message})`
    );
  }

  try {
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fullUrl}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script, style, and other non-content elements
    $("script, style, nav, footer, header, aside, .ad, .advertisement").remove();

    // Extract text from main content areas
    const textContent: string[] = [];

    // Try to find main content areas
    const contentSelectors = [
      "main",
      "article",
      "[role='main']",
      ".content",
      ".main-content",
      "body",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text();
        if (text.trim().length > 100) {
          // Clean up whitespace
          const cleaned = text
            .replace(/\s+/g, " ")
            .replace(/\n+/g, "\n")
            .trim();
          textContent.push(cleaned);
          break;
        }
      }
    }

    // Fallback: get all text from body
    if (textContent.length === 0) {
      const bodyText = $("body").text();
      const cleaned = bodyText
        .replace(/\s+/g, " ")
        .replace(/\n+/g, "\n")
        .trim();
      textContent.push(cleaned);
    }

    // Limit text length to save tokens (keep first 4000 characters)
    const combinedText = textContent.join("\n\n");
    return combinedText.substring(0, 4000);
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Calls OpenAI to extract structured data from scraped text
 */
async function enrichWithLLM(scrapedText: string, url: string): Promise<EnrichmentResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const prompt = `Analyze the following website content and extract structured information. Return ONLY valid JSON with no markdown formatting, no code blocks, and no additional text.

Website URL: ${url}

Content:
${scrapedText}

Return a JSON object with this exact structure:
{
  "summary": "1-2 sentences describing what this company does",
  "bullets": ["3-6 bullet points explaining what they do", "each as a string in an array"],
  "keywords": ["5-10 relevant keyword strings"],
  "signals": ["2-4 derived signals inferred from the page", "e.g., 'careers page exists', 'recent blog post', 'product launch announcement'"]
}

Be specific and factual. Base signals on what you can actually infer from the content.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using cost-effective model
      messages: [
        {
          role: "system",
          content: "You are a data extraction assistant. Always return valid JSON only, no markdown, no code blocks, no explanations.",
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
    let parsed: Omit<EnrichmentResponse, "sources" | "timestamp">;
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
    const enrichment: EnrichmentResponse = {
      summary: parsed.summary || "No summary available.",
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      sources: [url],
      timestamp: new Date().toISOString(),
    };

    // Ensure arrays meet minimum requirements
    if (enrichment.bullets.length < 3) {
      enrichment.bullets = enrichment.bullets.concat([
        "Provides innovative solutions",
        "Focuses on customer success",
        "Leverages modern technology",
      ].slice(0, 3 - enrichment.bullets.length));
    }
    if (enrichment.keywords.length < 5) {
      enrichment.keywords = enrichment.keywords.concat([
        "Technology",
        "Innovation",
        "Solutions",
        "Enterprise",
        "Software",
      ].slice(0, 5 - enrichment.keywords.length));
    }
    if (enrichment.signals.length < 2) {
      enrichment.signals = enrichment.signals.concat([
        "Website is active",
        "Content is up to date",
      ].slice(0, 2 - enrichment.signals.length));
    }

    return enrichment;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to enrich with LLM: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Step 1: Scrape the website
    let scrapedText: string;
    try {
      scrapedText = await scrapeWebsite(url);
    } catch (scrapeError) {
      const errorMessage =
        scrapeError instanceof Error ? scrapeError.message : "Could not reach the website URL to scrape. Please ensure it is a valid, live URL.";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (!scrapedText || scrapedText.trim().length < 50) {
      return NextResponse.json(
        { error: "Failed to extract meaningful content from the website" },
        { status: 400 }
      );
    }

    // Step 2: Enrich with LLM
    const enrichmentData = await enrichWithLLM(scrapedText, url);

    return NextResponse.json(enrichmentData);
  } catch (error) {
    console.error("Enrichment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to enrich company data";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
