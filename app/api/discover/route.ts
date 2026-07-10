import { NextRequest, NextResponse } from "next/server";
import { discoverRequestSchema } from "@/lib/validations/schemas";
import { searchCompany as searchTavily } from "@/lib/services/tavily";
import { searchCompanies as searchExa } from "@/lib/services/exa-service";
import { rateLimit } from "@/lib/rate-limit";
import { DiscoveredCompany } from "@/lib/types";

function getDomain(url: string): string {
  try {
    const cleanUrl = url.trim().toLowerCase();
    const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url.toLowerCase().replace(/^www\./, "");
  }
}

export async function POST(request: NextRequest) {
  // 1. Rate Limiting (30 requests per minute)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limitCheck = rateLimit(`discover:${ip}`, 30, 60000);
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    const body = await request.json();
    
    // 2. Schema Validation
    const validation = discoverRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { query } = validation.data;

    // 3. Invoke search engines in parallel
    const [tavilyResults, exaResults] = await Promise.all([
      searchTavily(`${query} startup company site:github.com OR site:linkedin.com OR site:crunchbase.com`),
      searchExa(query)
    ]);

    const companiesMap = new Map<string, DiscoveredCompany>();

    // Merge Exa Results (high quality semantic results)
    exaResults.forEach((comp, index) => {
      const domain = getDomain(comp.url);
      companiesMap.set(domain, {
        id: `exa-${domain.replace(/[^a-zA-Z0-9]/g, "-")}`,
        name: comp.name,
        website: comp.url,
        shortDescription: comp.description,
        source: "Exa AI Engine",
      });
    });

    // Merge Tavily Results (broad web results)
    tavilyResults.forEach((comp, index) => {
      const domain = getDomain(comp.url);
      // Skip if it's not a real website (like social links, directories, etc.)
      const isBlacklisted = [
        "github.com", "linkedin.com", "twitter.com", "reddit.com", "youtube.com", 
        "wikipedia.org", "facebook.com", "crunchbase.com", "medium.com", "news.ycombinator.com"
      ].some(b => domain.includes(b));
      
      if (isBlacklisted) return;

      if (!companiesMap.has(domain)) {
        let name = comp.title;
        name = name.replace(/\s*[-|]\s*(Home|Official Website|Welcome|Company|Inc|Corp|Ltd).*$/i, "").trim() || domain.split(".")[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);

        companiesMap.set(domain, {
          id: `tavily-${domain.replace(/[^a-zA-Z0-9]/g, "-")}`,
          name,
          website: comp.url,
          shortDescription: comp.content.substring(0, 200).trim() + "...",
          source: "Tavily Search Engine",
        });
      }
    });

    const companies = Array.from(companiesMap.values());

    return NextResponse.json(
      { companies, query, count: companies.length },
      { headers: { "X-RateLimit-Remaining": String(limitCheck.remaining) } }
    );

  } catch (error) {
    console.error("Discovery route error:", error);
    return NextResponse.json(
      { error: "Failed to discover companies", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
