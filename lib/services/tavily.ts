/**
 * Tavily Web Search API client.
 * Fetches relevant web results structured for AI consumption.
 */

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  results: TavilyResult[];
}

/**
 * Searches the web using the Tavily Search API.
 * 
 * @param query The search query string
 * @returns A list of Tavily search results or an empty array if failed/key is missing.
 */
export async function searchCompany(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("Tavily Search API: TAVILY_API_KEY is not configured. Returning empty results.");
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 5,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily Search API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as TavilySearchResponse;
    return data.results || [];
  } catch (error) {
    console.error("Tavily Search API call failed:", error);
    return [];
  }
}
