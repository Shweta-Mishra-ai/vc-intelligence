export interface Company {
  id: string;
  name: string;
  website: string;
  domain?: string;
  industry?: string;
  stage?: string;
  shortDescription: string;
  logoUrl?: string;
  foundedYear?: number;
  employeeCount?: number;
  hqLocation?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface CompetitorInfo {
  name: string;
  website: string;
  overlapPct: number;
  description: string;
}

export interface EnrichmentData {
  summary: string;
  bullets: string[];
  keywords: string[];
  signals: string[];
  sources: string[];
  timestamp: string;
  
  // 8-Dimension Scores
  marketScore: number;
  teamScore: number;
  productScore: number;
  tractionScore: number;
  financialScore: number;
  competitiveScore: number;
  timingScore: number;
  momentumScore: number;
  
  // Overall Scoring & Verdict
  overallScore: number;
  verdict: 'STRONG_INVEST' | 'PROMISING' | 'MODERATE' | 'WEAK' | 'PASS';
  verdictText: string;
  
  // Predictions
  tamEstimate?: string;
  runwayConfidence?: 'High' | 'Medium' | 'Low';
  failureRiskPct?: number;
  
  strengths: string[];
  risks: string[];
  competitors: CompetitorInfo[];
  rawData?: any;
}

export interface DiscoveredCompany {
  id: string;
  name: string;
  website: string;
  shortDescription: string;
  source: string;
  industry?: string;
  stage?: string;
}

export interface PipelineEntry {
  id: string;
  companyId: string;
  stage: 'discovered' | 'researching' | 'due_diligence' | 'decision' | 'invested' | 'passed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  createdAt: string;
}

export interface AnalysisWeights {
  market: number;
  team: number;
  product: number;
  traction: number;
  financial: number;
  competitive: number;
  timing: number;
  momentum: number;
}

export interface ApiError {
  error: string;
  details?: string;
  statusCode?: number;
}
