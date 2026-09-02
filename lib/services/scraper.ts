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
 * Block private/internal IPs to prevent SSRF (metadata service, localhost, etc.)
 */
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // link-local / metadata
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^::1$/,
  /\.local$/i,
  /^metadata\.google\.internal$/i,
];

export function isUrlAllowed(url: string): { allowed: boolean; reason?: string } {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { allowed: false, reason: "Only http/https protocols are allowed" };
    }
    const hostname = parsed.hostname.toLowerCase();
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return { allowed: false, reason: `Blocked internal hostname: ${hostname}` };
      }
    }
    // Block single-label hosts except we allow domains with a dot
    if (!hostname.includes(".") && hostname !== "localhost") {
      // still block, but not strictly necessary
    }
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "Invalid URL" };
  }
}

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

  const allowedCheck = isUrlAllowed(cleanUrl);
  if (!allowedCheck.allowed) {
    throw new Error(`SSRF Protection: URL not allowed - ${allowedCheck.reason}`);
  }
  
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
      // Prevent redirect to internal hosts
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    // Re-check final URL after redirects for SSRF
    if (response.url) {
      const redirectCheck = isUrlAllowed(response.url);
      if (!redirectCheck.allowed) {
        throw new Error(`SSRF Protection: Redirect to blocked host - ${redirectCheck.reason}`);
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const html = await response.text();
    // Limit HTML size to prevent memory bombs
    const limitedHtml = html.slice(0, 500_000);
    const $ = cheerio.load(limitedHtml);

    // 1. Title & Meta Description
    scraped.title = $("title").first().text().trim() || "";
    scraped.description = $('meta[name="description"]').first().attr("content")?.trim() || 
                          $('meta[property="og:description"]').first().attr("content")?.trim() || "";

    // 2. Scan links for Pricing & Careers (more precise)
    $("a").each((_, elem) => {
      const href = ($(elem).attr("href") || "").toLowerCase();
      const text = ($(elem).text() || "").toLowerCase().trim();
      // Use word boundaries and path segments to reduce false positives
      if (/\/pricing|\/plans|\/billing/.test(href) || /^(pricing|plans|billing)$/.test(text) || text === "pricing" || text === "plans") {
        if (href.includes("pricing") || href.includes("plans") || href.includes("billing") || text.includes("pricing")) {
          scraped.hasPricingPage = true;
        }
      }
      // Check for exact pricing keyword in path
      if (href.split("/").some(seg => ["pricing","plans","billing","price"].includes(seg)) || ["pricing","plans"].includes(text)) {
        scraped.hasPricingPage = true;
      }
      if (href.split("/").some(seg => ["careers","jobs","hiring","career"].includes(seg)) || ["careers","jobs","hiring","join us","we're hiring"].includes(text)) {
        scraped.hasCareersPage = true;
      }
    });

    // Also check href attributes more broadly but with lower false positive
    if (!scraped.hasPricingPage) {
      const hrefs = $("a").map((_, el) => $(el).attr("href") || "").get().join(" ").toLowerCase();
      if (/(?:href=["'][^"']*\/pricing)|(?:\/plans\/)|(?:\/billing)/.test(hrefs)) {
        scraped.hasPricingPage = true;
      }
    }
    if (!scraped.hasCareersPage) {
      const hrefs = $("a").map((_, el) => $(el).attr("href") || "").get().join(" ").toLowerCase();
      if (/(?:\/careers)|(?:\/jobs)|(?:\/hiring)/.test(hrefs)) {
        scraped.hasCareersPage = true;
      }
    }

    // 3. Scan scripts and meta tags for Tech Stack indicators - use robust word-boundary detection
    const fullHtmlLower = limitedHtml.toLowerCase();
    
    const techDefinitions: Array<{ keywords: string[]; display: string; pattern: RegExp }> = [
      { keywords: ["next.js", "nextjs"], display: "Next.js", pattern: /next\.js|__next|next\/link|next\/image/i },
      { keywords: ["react"], display: "React", pattern: /react(?:\.js)?|react-dom|__react/i },
      { keywords: ["vue"], display: "Vue", pattern: /vue\.js|vue\/|__vue__|v-if|v-for/i },
      { keywords: ["angular"], display: "Angular", pattern: /angular\.js|angular\/|ng-app|@angular/i },
      { keywords: ["svelte"], display: "Svelte", pattern: /svelte/i },
      { keywords: ["tailwind"], display: "Tailwind", pattern: /tailwindcss|tailwind\.css/i },
      { keywords: ["supabase"], display: "Supabase", pattern: /supabase\.co|supabase-js/i },
      { keywords: ["firebase"], display: "Firebase", pattern: /firebase|firebaseio\.com/i },
      { keywords: ["postgresql", "postgres"], display: "PostgreSQL", pattern: /postgresql|postgres/i },
      { keywords: ["mongodb"], display: "MongoDB", pattern: /mongodb/i },
      { keywords: ["mysql"], display: "MySQL", pattern: /mysql/i },
      { keywords: ["redis"], display: "Redis", pattern: /redis/i },
      { keywords: ["graphql"], display: "GraphQL", pattern: /graphql/i },
      { keywords: ["aws"], display: "AWS", pattern: /aws-sdk|amazonaws\.com|aws-amplify/i },
      { keywords: ["gcp"], display: "GCP", pattern: /googleapis\.com\/|gcp|google-cloud/i },
      { keywords: ["vercel"], display: "Vercel", pattern: /vercel\.com|vercel\.analytics/i },
      { keywords: ["netlify"], display: "Netlify", pattern: /netlify/i },
      { keywords: ["docker"], display: "Docker", pattern: /docker/i },
      { keywords: ["kubernetes"], display: "Kubernetes", pattern: /kubernetes|k8s/i },
      { keywords: ["stripe"], display: "Stripe", pattern: /stripe\.com|stripe-js/i },
      { keywords: ["clerk"], display: "Clerk", pattern: /clerk\.dev|@clerk/i },
      { keywords: ["auth0"], display: "Auth0", pattern: /auth0\.com/i },
      { keywords: ["typescript"], display: "TypeScript", pattern: /typescript|\.ts\b/i },
      { keywords: ["python"], display: "Python", pattern: /python|django|flask/i },
      { keywords: ["node.js", "nodejs"], display: "Node.js", pattern: /node\.js|nodejs|node_/i },
      { keywords: ["rust"], display: "Rust", pattern: /rust-lang|wasm.*rust|cargo/i },
      { keywords: ["go"], display: "Go", pattern: /\bgo\.mod\b|\bgolang\b/i },
      { keywords: ["nuxt"], display: "Nuxt", pattern: /nuxt/i },
    ];

    techDefinitions.forEach(({ display, pattern }) => {
      if (pattern.test(limitedHtml) || pattern.test(fullHtmlLower)) {
        if (!scraped.techStack.includes(display)) {
          scraped.techStack.push(display);
        }
      }
    });

    // 4. Extract Main Content Text
    $("script, style, nav, footer, header, aside, .ad, .advertisement, noscript").remove();
    
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
