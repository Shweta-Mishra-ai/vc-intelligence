/**
 * Wikipedia REST API wrapper to fetch company profiles and metadata.
 */

export interface WikipediaCompanyInfo {
  extract: string;
  description: string;
  thumbnailUrl?: string;
  foundedYear?: number;
}

/**
 * Normalizes a company name for Wikipedia title query.
 * e.g., "Vercel Inc." -> "Vercel"
 */
function normalizeCompanyName(name: string): string {
  if (!name) return "";
  return name
    .replace(/\b(inc|corp|corporation|ltd|limited|co|company|gmbh|sa|plc)\b\.?/gi, "")
    .replace(/\s+/g, "_")
    .trim();
}

/**
 * Fetches company summary from Wikipedia REST API.
 * 
 * @param companyName Raw company name
 * @returns WikipediaCompanyInfo or null if not found
 */
export async function getCompanyInfo(companyName: string): Promise<WikipediaCompanyInfo | null> {
  if (!companyName) return null;
  const formattedTitle = encodeURIComponent(normalizeCompanyName(companyName));

  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formattedTitle}`, {
      headers: {
        "User-Agent": "VC-Intelligence-Platform (contact@vc-intelligence.dev)",
      },
    });

    if (!response.ok) {
      // Try again with the raw name if normalization was too aggressive
      if (response.status === 404) {
        const rawTitle = encodeURIComponent(companyName.replace(/\s+/g, "_").trim());
        const retryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${rawTitle}`, {
          headers: {
            "User-Agent": "VC-Intelligence-Platform (contact@vc-intelligence.dev)",
          },
        });
        if (!retryResponse.ok) return null;
        return parseWikiResponse(await retryResponse.json());
      }
      return null;
    }

    return parseWikiResponse(await response.json());
  } catch (error) {
    console.error("Wikipedia API: Request failed:", error);
    return null;
  }
}

function parseWikiResponse(data: any): WikipediaCompanyInfo | null {
  if (!data || !data.extract) return null;

  // Extract founded year using regex from the text - strict to avoid false positives
  let foundedYear: number | undefined;
  const textToSearch = `${data.description || ""} ${data.extract}`;
  
  // Only accept year when near founding keywords to avoid war dates etc.
  const foundedPatterns = [
    /(?:founded|established|started|incorporated|formed)\s+(?:in\s+)?(\b(?:19\d{2}|20[0-2]\d)\b)/i,
    /(?:founding|establishment|formation)\s+in\s+(\b(?:19\d{2}|20[0-2]\d)\b)/i,
  ];

  for (const pattern of foundedPatterns) {
    const match = textToSearch.match(pattern);
    if (match && match[1]) {
      const year = parseInt(match[1], 10);
      if (year >= 1900 && year <= new Date().getFullYear()) {
        foundedYear = year;
        break;
      }
    } else if (match && match[0]) {
      // For fallback patterns
      const year = parseInt(match[0], 10);
      if (year >= 1900 && year <= new Date().getFullYear()) {
        foundedYear = year;
        break;
      }
    }
  }

  return {
    extract: data.extract,
    description: data.description || "Company Profile",
    thumbnailUrl: data.thumbnail?.source || undefined,
    foundedYear,
  };
}
