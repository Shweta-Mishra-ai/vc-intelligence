import companiesData from "@/data/companies.json";

export interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  stage: string;
  shortDescription: string;
}

export function getCompanies(): Company[] {
  return companiesData as Company[];
}

export function getCompanyById(id: string): Company | undefined {
  return companiesData.find((company) => company.id === id) as Company | undefined;
}
