import { NextRequest, NextResponse } from "next/server";

// Mock enrichment data generator
function generateMockEnrichment(companyName: string, website: string) {
  const mockWhatTheyDo = [
    "Develop AI-powered solutions for enterprise automation",
    "Provide cloud-based infrastructure and services",
    "Offer data analytics and business intelligence tools",
    "Create developer-friendly APIs and integrations",
    "Build scalable SaaS platforms for businesses",
    "Deliver real-time collaboration features",
  ].slice(0, Math.floor(Math.random() * 4) + 3);

  const mockKeywords = [
    "Artificial Intelligence",
    "Machine Learning",
    "Cloud Computing",
    "SaaS",
    "Enterprise Software",
    "Data Analytics",
    "Automation",
    "API",
    "Scalability",
    "Innovation",
  ].slice(0, Math.floor(Math.random() * 6) + 5);

  const mockSignals = [
    "Careers page active with recent job postings",
    "Recent changelog update published",
    "New product feature announcement",
    "Partnership announcement with major enterprise",
  ].slice(0, Math.floor(Math.random() * 3) + 2);

  const sourceUrls = [
    website,
    `${website}/about`,
    `${website}/careers`,
    `${website}/blog`,
  ].slice(0, Math.floor(Math.random() * 3) + 2);

  return {
    summary: `${companyName} is a forward-thinking technology company that leverages cutting-edge solutions to address complex business challenges. They focus on delivering scalable, user-friendly platforms that drive innovation and efficiency for their enterprise clients.`,
    whatTheyDo: mockWhatTheyDo,
    keywords: mockKeywords,
    signals: mockSignals,
    sourceUrls,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, website, companyName } = body;

    if (!companyId || !website) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Simulate processing delay (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // TODO: Replace this mock with actual OpenAI/Cheerio implementation
    // Example structure:
    // const scrapedData = await scrapeWebsite(website);
    // const enrichedData = await callOpenAI(scrapedData);
    // return NextResponse.json(enrichedData);

    const enrichmentData = generateMockEnrichment(
      companyName || `Company ${companyId}`,
      website
    );

    return NextResponse.json(enrichmentData);
  } catch (error) {
    console.error("Enrichment error:", error);
    return NextResponse.json(
      { error: "Failed to enrich company data" },
      { status: 500 }
    );
  }
}
