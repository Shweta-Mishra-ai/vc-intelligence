import companiesData from "@/data/companies.json";

export interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
  stage?: string;
  shortDescription: string;
}

export function getCompanyById(id: string): Company | undefined {
  // Fallback to static data so direct URL navigation still works.
  const staticCompany = (companiesData as Company[]).find((company) => company.id === id);
  if (staticCompany) {
    return staticCompany;
  }

  // Check discovered companies from localStorage (client-side only)
  if (typeof window !== "undefined") {
    try {
      const discoveredData = localStorage.getItem("discovered-companies");
      if (discoveredData) {
        const discoveredCompanies = JSON.parse(discoveredData) as Record<string, Company>;
        return discoveredCompanies[id];
      }
    } catch (e) {
      console.error("Failed to load discovered companies:", e);
    }
  }

  return undefined;
}
