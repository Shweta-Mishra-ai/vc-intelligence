import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";

export interface DiscoveredCompany {
  id: string;
  name: string;
  website: string;
  shortDescription: string;
}

/**
 * Generates a stable ID from a URL
 */
function generateIdFromUrl(url: string, index: number): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, "");
    const hash = domain.split("").reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);
    return `discovered-${Math.abs(hash)}-${index}`;
  } catch {
    return `discovered-${index}-${Date.now()}`;
  }
}

/**
 * Maps Exa search results to company format
 */
function mapExaResultsToCompanies(
  results: { url: string; title?: string | null; highlights?: string[] | null }[]
): DiscoveredCompany[] {
  return results.map((result, index) => {
    const website = result.url;
    const name =
      result.title?.replace(/\s*[-|]\s*(Home|Official Website|Welcome).*$/i, "").trim() ||
      (() => {
        try {
          const urlObj = new URL(website);
          const domain = urlObj.hostname.replace(/^www\./, "");
          const parts = domain.split(".");
          return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : domain;
        } catch {
          return "Unknown Company";
        }
      })();
    const shortDescription =
      result.highlights?.[0] ||
      (Array.isArray(result.highlights) ? result.highlights.join(" ") : null) ||
      "No description available.";
    return {
      id: generateIdFromUrl(website, index),
      name,
      website,
      shortDescription: shortDescription.substring(0, 200).trim(),
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid query parameter" },
        { status: 400 }
      );
    }

    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "EXA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const exa = new Exa(apiKey);

    const results = await exa.searchAndContents(query.trim(), {
      type: "auto",
      numResults: 10,
      category: "company",
      highlights: true,
    });

    if (!results.results || !Array.isArray(results.results)) {
      return NextResponse.json(
        { error: "Invalid response format from Exa API" },
        { status: 500 }
      );
    }

    const companies = mapExaResultsToCompanies(results.results);

    return NextResponse.json({
      companies,
      query: query.trim(),
      count: companies.length,
    });
  } catch (error) {
    console.error("Discovery error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to discover companies";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
