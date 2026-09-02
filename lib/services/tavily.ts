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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.slice(0, 400),
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Tavily Search API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as TavilySearchResponse;
    return data.results || [];
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      console.warn("Tavily Search API timed out");
    } else {
      console.error("Tavily Search API call failed:", error);
    }
    return [];
  }
}
