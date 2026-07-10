import Exa from "exa-js";

export interface ExaCompanyResult {
  id: string;
  name: string;
  url: string;
  description: string;
  highlights?: string[];
}

/**
 * Perform semantic company search using the Exa API.
 * 
 * @param query The search query string
 * @returns Array of discovered company objects
 */
export async function searchCompanies(query: string): Promise<ExaCompanyResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn("Exa API: EXA_API_KEY is not configured. Returning empty results.");
    return [];
  }

  try {
    const exa = new Exa(apiKey);
    const response = await exa.searchAndContents(query, {
      type: "auto",
      numResults: 10,
      category: "company",
      highlights: true,
    });

    if (!response.results || !Array.isArray(response.results)) {
      return [];
    }

    return response.results.map((result) => {
      const url = result.url;
      let name = result.title || "";
      name = name.replace(/\s*[-|]\s*(Home|Official Website|Welcome|Company).*$/i, "").trim();
      
      if (!name) {
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace(/^www\./, "");
          const parts = domain.split(".");
          name = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : domain;
        } catch {
          name = "Unknown Company";
        }
      }

      const highlights = result.highlights || [];
      const description = highlights[0] || "No description available.";

      return {
        id: result.id,
        name,
        url,
        description,
        highlights,
      };
    });
  } catch (error) {
    console.error("Exa searchCompanies failed:", error);
    return [];
  }
}

/**
 * Finds similar companies (competitors) for a given website URL using Exa.
 * 
 * @param url The target company website URL
 * @returns Array of competitor results
 */
export async function findSimilar(url: string): Promise<ExaCompanyResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn("Exa API: EXA_API_KEY is not configured. Returning empty competitor results.");
    return [];
  }

  try {
    const exa = new Exa(apiKey);
    const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
    const response = await exa.findSimilarAndContents(cleanUrl, {
      numResults: 5,
      highlights: true,
    });

    if (!response.results || !Array.isArray(response.results)) {
      return [];
    }

    return response.results.map((result) => {
      const compUrl = result.url;
      let name = result.title || "";
      name = name.replace(/\s*[-|]\s*(Home|Official Website|Welcome|Company).*$/i, "").trim();

      if (!name) {
        try {
          const urlObj = new URL(compUrl);
          const domain = urlObj.hostname.replace(/^www\./, "");
          const parts = domain.split(".");
          name = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : compUrl;
        } catch {
          name = "Unknown Competitor";
        }
      }

      return {
        id: result.id,
        name,
        url: compUrl,
        description: result.highlights?.[0] || "No description available.",
        highlights: result.highlights || [],
      };
    });
  } catch (error) {
    console.error("Exa findSimilar failed:", error);
    return [];
  }
}
