import * as cheerio from "cheerio";

export interface ScrapedData {
  title: string;
  description: string;
  mainContent: string;
  hasPricingPage: boolean;
  hasCareersPage: boolean;
  techStack: string[];
}

const TIMEOUT_MS = 10000;

/**
 * Normalizes a URL, adding protocols if missing.
 */
function normalizeUrl(url: string): string {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }
  return cleanUrl;
}

/**
 * Scrapes a website URL and extracts structured page information.
 * 
 * @param url Target website URL
 * @returns ScrapedData object
 */
export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const cleanUrl = normalizeUrl(url);
  
  // Set up default values
  const scraped: ScrapedData = {
    title: "",
    description: "",
    mainContent: "",
    hasPricingPage: false,
    hasCareersPage: false,
    techStack: [],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Title & Meta Description
    scraped.title = $("title").first().text().trim() || "";
    scraped.description = $('meta[name="description"]').first().attr("content")?.trim() || 
                          $('meta[property="og:description"]').first().attr("content")?.trim() || "";

    // 2. Scan links for Pricing & Careers
    $("a").each((_, elem) => {
      const href = $(elem).attr("href")?.toLowerCase() || "";
      const text = $(elem).text().toLowerCase();

      if (href.includes("pricing") || href.includes("billing") || href.includes("plans") || text.includes("pricing") || text.includes("plans")) {
        scraped.hasPricingPage = true;
      }
      if (href.includes("careers") || href.includes("jobs") || href.includes("hiring") || text.includes("careers") || text.includes("jobs") || text.includes("hiring")) {
        scraped.hasCareersPage = true;
      }
    });

    // 3. Scan scripts and meta tags for Tech Stack indicators
    const fullHtmlLower = html.toLowerCase();
    const techStackKeywords = [
      "react", "next.js", "nextjs", "vue", "nuxt", "svelte", "angular", "tailwind",
      "supabase", "firebase", "postgresql", "postgres", "mongodb", "mysql", "redis",
      "graphql", "rest api", "aws", "gcp", "vercel", "netlify", "docker", "kubernetes",
      "stripe", "clerk", "auth0", "typescript", "python", "node.js", "nodejs", "rust", "go"
    ];

    techStackKeywords.forEach((tech) => {
      // Look for indicators in HTML structure or javascript includes
      if (fullHtmlLower.includes(tech)) {
        let displayTech = tech;
        if (tech === "nextjs") displayTech = "Next.js";
        if (tech === "nodejs") displayTech = "Node.js";
        // Capitalize names nicely
        if (tech === "aws") displayTech = "AWS";
        if (tech === "gcp") displayTech = "GCP";
        if (tech === "typescript") displayTech = "TypeScript";
        if (tech === "postgresql") displayTech = "PostgreSQL";
        if (tech === "mongodb") displayTech = "MongoDB";
        if (tech === "graphql") displayTech = "GraphQL";
        if (tech === "react") displayTech = "React";
        if (tech === "vue") displayTech = "Vue";
        if (tech === "stripe") displayTech = "Stripe";
        if (tech === "supabase") displayTech = "Supabase";

        displayTech = displayTech.charAt(0).toUpperCase() + displayTech.slice(1);
        if (!scraped.techStack.includes(displayTech)) {
          scraped.techStack.push(displayTech);
        }
      }
    });

    // 4. Extract Main Content Text
    $("script, style, nav, footer, header, aside, .ad, .advertisement").remove();
    
    const contentSelectors = ["main", "article", "[role='main']", ".content", ".main-content", "body"];
    let mainText = "";

    for (const selector of contentSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0) {
        const text = elem.text().trim();
        if (text.length > 100) {
          mainText = text;
          break;
        }
      }
    }

    if (!mainText) {
      mainText = $("body").text().trim();
    }

    // Clean up whitespace and limit length to 5000 chars to avoid model context bloat
    scraped.mainContent = mainText
      .replace(/\s+/g, " ")
      .substring(0, 5000);

  } catch (error) {
    console.error(`Scraper Service: Failed to scrape ${cleanUrl}:`, error);
    // Return empty results rather than crashing
    scraped.mainContent = "Scraping failed or website is protected.";
  }

  return scraped;
}
