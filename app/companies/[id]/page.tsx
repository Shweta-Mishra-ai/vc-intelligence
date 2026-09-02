"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { getCompanyById, type Company } from "@/lib/companies";
import { 
  Loader2, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle, 
  Brain,
  Globe,
  Calendar,
  Users,
  Building2,
  FolderPlus,
  Coins,
  Cpu,
  TrendingUp,
  Scale,
  Clock,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreGauge } from "@/components/charts/score-gauge";
import { DimensionBar } from "@/components/charts/dimension-bar";
import { VerdictCard } from "@/components/features/verdict-card";
import { EnrichmentData } from "@/lib/types";

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null);
  const [enrichmentStep, setEnrichmentStep] = useState<string>("");
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [thesis, setThesis] = useState<string>("High-growth B2B SaaS, developer tools, or AI infrastructure with a strong technological moat and clear user validation.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    const foundCompany = getCompanyById(params.id);
    setCompany(foundCompany || null);
    setIsLoading(false);
  }, [params.id]);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`company-${params.id}-notes`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [params.id]);

  // Load enrichment data from localStorage
  useEffect(() => {
    const savedEnrichment = localStorage.getItem(`company-${params.id}-enrichment`);
    if (savedEnrichment) {
      try {
        const parsed = JSON.parse(savedEnrichment) as EnrichmentData;
        setEnrichmentData(parsed);
      } catch (e) {
        console.error("Failed to parse saved enrichment data", e);
      }
    }
  }, [params.id]);

  const handleSaveNotes = () => {
    try {
      localStorage.setItem(`company-${params.id}-notes`, notes);
      // Lightweight inline feedback instead of blocking alert
      setEnrichmentStep("Notes saved ✓");
      setTimeout(() => setEnrichmentStep(""), 1500);
    } catch (e) {
      console.error("Failed to save notes", e);
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        setEnrichmentError("Storage full — please clear old enrichments.");
      }
    }
  };

  const handleSaveToPipeline = () => {
    if (!company) return;
    try {
      const saved = localStorage.getItem("vc-pipeline");
      const pipeline = saved ? JSON.parse(saved) : [];
      
      const exists = pipeline.some((item: any) => item.companyId === params.id);
      if (exists) {
        setEnrichmentError(`${company.name} is already in the deals pipeline.`);
        setTimeout(() => setEnrichmentError(null), 3000);
        return;
      }

      pipeline.push({
        companyId: params.id,
        stage: "discovered",
        addedAt: new Date().toISOString()
      });

      localStorage.setItem("vc-pipeline", JSON.stringify(pipeline));
      setEnrichmentStep(`Added ${company.name} to Pipeline ✓`);
      setTimeout(() => setEnrichmentStep(""), 2000);
    } catch (e) {
      console.error("Failed to save to pipeline", e);
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        setEnrichmentError("Storage full — please clear old data.");
      }
    }
  };

  const handleEnrich = async () => {
    if (!company) return;
    setIsEnriching(true);
    setEnrichmentError(null);
    setEnrichmentStep("Scraping website content...");

    try {
      const response = await fetch(`/api/enrich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          url: company.website
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Enrichment failed`);
      }

      setEnrichmentStep("Extracting signals & analyzing startup metrics...");

      const data = await response.json();
      
      setEnrichmentData(data);
      
      // Save to localStorage with quota handling
      try {
        localStorage.setItem(`company-${params.id}-enrichment`, JSON.stringify(data));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("LocalStorage quota exceeded — enrichment kept in memory only");
          setEnrichmentError("Enrichment succeeded but local storage is full. Clear old data to persist.");
        } else throw e;
      }
      setEnrichmentStep("Enrichment complete!");
      setTimeout(() => setEnrichmentStep(""), 1500);
    } catch (error) {
      console.error("Enrichment error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to enrich company data. Please check your API keys.";
      setEnrichmentError(errorMessage);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAnalyze = async () => {
    if (!enrichmentData || !thesis.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch(`/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enrichedData: enrichmentData,
          thesis: thesis.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Analysis failed`);
      }

      const data = await response.json();
      setEnrichmentData(data);
      
      // Save back to localStorage with quota handling
      try {
        localStorage.setItem(`company-${params.id}-enrichment`, JSON.stringify(data));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("LocalStorage quota exceeded — analysis kept in memory only");
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate AI analysis.";
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-slate-400">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-100">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {company.industry && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold">
                {company.industry}
              </Badge>
            )}
            {company.stage && (
              <Badge variant="outline" className="border-white/10 text-slate-400">
                {company.stage}
              </Badge>
            )}
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              {company.website.replace(/^https?:\/\/(www\.)?/, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleSaveToPipeline} 
            variant="outline" 
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 flex items-center gap-1.5 h-10 font-bold"
          >
            <FolderPlus className="h-4 w-4" />
            Add to Pipeline
          </Button>
          <Button 
            onClick={handleEnrich} 
            disabled={isEnriching} 
            className="h-10 font-bold flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            {isEnriching ? "Enriching Startup..." : "Ingest & Enrich"}
          </Button>
        </div>
      </div>

      {/* enrichment loading state */}
      {isEnriching && (
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-bold text-slate-200">Enriching data sources...</p>
              <p className="text-xs text-slate-400 mt-0.5">{enrichmentStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* enrichment error state */}
      {enrichmentError && (
        <div className="p-5 rounded-2xl border border-rose-500/10 bg-rose-500/5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-rose-400">Enrichment operation failed</p>
            <p className="text-xs text-slate-400 mt-1">{enrichmentError}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEnrichmentError(null)} className="shrink-0 text-slate-500 hover:text-slate-300">
            Dismiss
          </Button>
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!enrichmentData} className="rounded-lg text-xs font-semibold px-4 py-2">
            Deep Analysis
          </TabsTrigger>
          <TabsTrigger value="competitors" disabled={!enrichmentData} className="rounded-lg text-xs font-semibold px-4 py-2">
            Competitors Mapping
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg text-xs font-semibold px-4 py-2">Analyst Notes</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview Info */}
        <TabsContent value="overview" className="space-y-6 animate-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-card bg-white/[0.01]">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-200">Company Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {enrichmentData?.summary || company.shortDescription}
                  </p>
                </CardContent>
              </Card>

              {enrichmentData?.bullets && enrichmentData.bullets.length > 0 && (
                <Card className="glass-card bg-white/[0.01]">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-200">Key Offerings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {enrichmentData.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span className="text-slate-300 text-xs leading-normal">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* Profile Details Meta */}
              <Card className="glass-card bg-white/[0.01]">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-200">Quick Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Founded
                    </span>
                    <span>{company.foundedYear || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Est. Size
                    </span>
                    <span title={company.employeeCount ? "Estimated from GitHub contributors — not verified" : ""}>
                      {company.employeeCount ? `~${company.employeeCount} (est.)` : "N/A"}
                    </span>
                  </div>
                  {company.githubUrl && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        GitHub Repository
                      </span>
                      <a href={company.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                        Repository <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tag Keywords */}
              {enrichmentData?.keywords && enrichmentData.keywords.length > 0 && (
                <Card className="glass-card bg-white/[0.01]">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-200">Technology Focus</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {enrichmentData.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-white/5 text-slate-300 border-none">
                        {kw}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: 8-Dimension Evaluation & Verdict */}
        {enrichmentData && (
          <TabsContent value="analysis" className="space-y-8 animate-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Verdict column */}
              <div className="lg:col-span-2 space-y-6">
                <VerdictCard
                  verdict={enrichmentData.verdict}
                  verdictText={enrichmentData.verdictText}
                  overallScore={enrichmentData.overallScore}
                  strengths={enrichmentData.strengths}
                  risks={enrichmentData.risks}
                />

                {/* Custom Thesis Re-Analyzer */}
                <Card className="glass-card bg-white/[0.01]">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      <Brain className="h-4.5 w-4.5 text-primary" />
                      Re-evaluate Against Custom Investment Thesis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={thesis}
                      onChange={(e) => setThesis(e.target.value)}
                      placeholder="Specify your investment parameters..."
                      className="glass-input border-none text-xs text-slate-300 placeholder-slate-500 rounded-xl resize-none h-20"
                    />
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing || !thesis.trim()}
                      className="font-bold flex items-center gap-1.5 text-xs h-9 bg-primary hover:bg-primary/95 shadow-md px-5"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Re-analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Run Re-evaluation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Gauge & Dimension breakdown columns */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="glass-card bg-white/[0.01] p-6 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deal Match Score</span>
                  <ScoreGauge score={enrichmentData.overallScore} />
                </Card>

                {/* 8 dimensions checklist */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                    Evaluation Dimensions
                  </h3>
                  <DimensionBar name="Market (TAM)" score={enrichmentData.marketScore} icon={Coins} description="Addressable size & competitive volume" />
                  <DimensionBar name="Team Execution" score={enrichmentData.teamScore} icon={Users} description="Engineering & founding velocity" />
                  <DimensionBar name="Product Depth" score={enrichmentData.productScore} icon={Cpu} description="Core tech maturity & stack defensibility" />
                  <DimensionBar name="Traction Speed" score={enrichmentData.tractionScore} icon={TrendingUp} description="Web reach, git stars, and adoption rate" />
                  <DimensionBar name="Financial Health" score={enrichmentData.financialScore} icon={Scale} description="Burn rate estimation & pricing models" />
                  <DimensionBar name="Competitive Edge" score={enrichmentData.competitiveScore} icon={Target} description="Moats & positioning" />
                  <DimensionBar name="Timing" score={enrichmentData.timingScore} icon={Clock} description="Regulatory, market readiness, and shifts" />
                  <DimensionBar name="Momentum Index" score={enrichmentData.momentumScore} icon={Sparkles} description="Rolling growth velocity score" />
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Tab 3: Competitors Grid */}
        {enrichmentData && (
          <TabsContent value="competitors" className="animate-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichmentData.competitors && enrichmentData.competitors.length > 0 ? (
                enrichmentData.competitors.map((comp, idx) => (
                  <Card key={idx} className="glass-card bg-white/[0.01] flex flex-col justify-between p-5 hover:border-primary/20 transition-all duration-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-200">{comp.name}</h3>
                        <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border-none font-semibold text-[10px] py-0.5 px-2" title="Overlap is estimated and refined by AI during analysis">
                          ~{comp.overlapPct}% overlap (est.)
                        </Badge>
                      </div>
                      <a href={comp.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5 max-w-max">
                        {comp.website.replace(/^https?:\/\/(www\.)?/, "")} <ArrowUpRight className="h-2.5 w-2.5" />
                      </a>
                      <p className="text-slate-400 text-xs leading-relaxed mt-2 line-clamp-3">
                        {comp.description}
                      </p>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-white/5 p-12 text-center bg-white/[0.01] text-slate-500">
                  <ShieldAlert className="h-10 w-10 mx-auto opacity-35 mb-2" />
                  <p className="text-sm font-semibold">No direct competitor mappings discovered.</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Tab 4: Analyst Notes */}
        <TabsContent value="notes" className="animate-in">
          <Card className="glass-card bg-white/[0.01] max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-200 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Due Diligence Notes
              </CardTitle>
              <CardDescription className="text-slate-400">
                Write down internal commentary, Capital Call highlights, or meeting feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter analyst notes here..."
                rows={8}
                className="glass-input border-none text-slate-300 placeholder-slate-500 rounded-xl resize-none"
              />
              <Button onClick={handleSaveNotes} className="font-bold text-xs h-9 px-5">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
