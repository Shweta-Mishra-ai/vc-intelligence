"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { getCompanyById, type Company } from "@/lib/companies";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Sparkles, AlertTriangle, Brain } from "lucide-react";
import { EnrichmentDisplay } from "@/components/enrichment-display";
import { EnrichmentLoader } from "@/components/enrichment-loader";
import { ThesisAnalysis } from "@/components/thesis-analysis";

interface EnrichmentData {
  summary: string;
  bullets: string[];
  keywords: string[];
  signals: string[];
  sources: string[];
  timestamp: string;
}

interface AnalysisData {
  matchScore: number;
  strengths: string[];
  risks: string[];
  verdict: string;
}

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [selectedList, setSelectedList] = useState<string>("");
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null);
  const [enrichmentStep, setEnrichmentStep] = useState<string>("");
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [thesis, setThesis] = useState<string>("B2B AI SaaS tools that improve developer productivity");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    const foundCompany = getCompanyById(params.id);
    setCompany(foundCompany || null);
    setIsLoading(false);
  }, [params.id]);

  // Early returns moved after hook definitions to satisfy React Rules of Hooks

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
        const parsed = JSON.parse(savedEnrichment);
        // Handle backward compatibility: convert old format to new format
        if (parsed.whatTheyDo && !parsed.bullets) {
          parsed.bullets = parsed.whatTheyDo;
        }
        if (parsed.sourceUrls && !parsed.sources) {
          parsed.sources = parsed.sourceUrls;
        }
        // Validate structure
        if (
          parsed.summary &&
          Array.isArray(parsed.bullets) &&
          Array.isArray(parsed.keywords) &&
          Array.isArray(parsed.signals) &&
          Array.isArray(parsed.sources)
        ) {
          setEnrichmentData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved enrichment data", e);
      }
    }
  }, [params.id]);

  // Load lists from localStorage
  const [availableLists, setAvailableLists] = useState<string[]>([]);
  useEffect(() => {
    const lists = localStorage.getItem("vc-lists");
    if (lists) {
      try {
        const parsed = JSON.parse(lists);
        setAvailableLists(Object.keys(parsed));
      } catch (e) {
        console.error("Failed to parse lists", e);
      }
    }
  }, []);

  const handleSaveNotes = () => {
    localStorage.setItem(`company-${params.id}-notes`, notes);
  };

  const handleSaveToList = () => {
    if (!company || !selectedList) return;

    const lists = localStorage.getItem("vc-lists");
    const parsed = lists ? JSON.parse(lists) : {};
    
    if (!parsed[selectedList]) {
      parsed[selectedList] = [];
    }

    if (!parsed[selectedList].includes(params.id)) {
      parsed[selectedList].push(params.id);
      localStorage.setItem("vc-lists", JSON.stringify(parsed));
      alert(`Added ${company.name} to ${selectedList}`);
    } else {
      alert(`${company.name} is already in ${selectedList}`);
    }
  };

  const handleEnrich = async () => {
    if (!company) return;

    setIsEnriching(true);
    setEnrichmentError(null);
    setEnrichmentStep("Scraping site...");

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

      setEnrichmentStep("Extracting signals...");

      const data = await response.json();
      
      // Validate response structure
      if (
        !data.summary ||
        !Array.isArray(data.bullets) ||
        !Array.isArray(data.keywords) ||
        !Array.isArray(data.signals) ||
        !Array.isArray(data.sources)
      ) {
        throw new Error("Invalid response format from enrichment API");
      }

      setEnrichmentData(data);
      
      // Save to localStorage
      localStorage.setItem(`company-${params.id}-enrichment`, JSON.stringify(data));
      setEnrichmentStep("Complete!");
      
      // Clear success message after a brief delay
      setTimeout(() => setEnrichmentStep(""), 1000);
    } catch (error) {
      console.error("Enrichment error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to enrich company data. Please try again.";
      setEnrichmentError(errorMessage);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAnalyze = async () => {
    if (!enrichmentData || !thesis.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);

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
      
      // Validate response structure
      if (
        typeof data.matchScore !== "number" ||
        !Array.isArray(data.strengths) ||
        !Array.isArray(data.risks) ||
        !data.verdict
      ) {
        throw new Error("Invalid response format from analysis API");
      }

      setAnalysisData(data);
      
      // Save to localStorage
      localStorage.setItem(`company-${params.id}-analysis`, JSON.stringify(data));
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze company. Please try again.";
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load saved analysis from localStorage
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(`company-${params.id}-analysis`);
    if (savedAnalysis) {
      try {
        const parsed = JSON.parse(savedAnalysis);
        if (parsed.matchScore !== undefined && Array.isArray(parsed.strengths) && Array.isArray(parsed.risks)) {
          setAnalysisData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved analysis", e);
      }
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading company...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
            {company.stage && <Badge variant="outline">{company.stage}</Badge>}
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {company.website} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Button onClick={handleEnrich} disabled={isEnriching} size="lg">
          <Sparkles className="h-4 w-4 mr-2" />
          {isEnriching ? "Enriching..." : "Enrich Data"}
        </Button>
      </div>

      {isEnriching && <EnrichmentLoader step={enrichmentStep} />}

      {enrichmentError && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">Enrichment failed</p>
                <p className="text-sm text-muted-foreground mt-1">{enrichmentError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnrichmentError(null)}
                className="shrink-0"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {enrichmentData && !isEnriching && (
        <EnrichmentDisplay data={enrichmentData} />
      )}

      {/* Thesis Analysis Section */}
      {enrichmentData && !isEnriching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Investment Thesis Analysis
            </CardTitle>
            <CardDescription>
              Evaluate this company against your investment thesis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thesis">Investment Thesis</Label>
              <Textarea
                id="thesis"
                placeholder="Enter your investment thesis..."
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !thesis.trim()}
              className="w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing thesis match...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Analysis
                </>
              )}
            </Button>

            {isAnalyzing && (
              <div className="rounded-md border p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Analyzing thesis match...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Evaluating company alignment with your investment criteria
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analysisError && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-destructive">Analysis failed</p>
                      <p className="text-sm text-muted-foreground mt-1">{analysisError}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnalysisError(null)}
                      className="shrink-0"
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisData && !isAnalyzing && (
              <div className="mt-6">
                <ThesisAnalysis data={analysisData} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signals">Signals Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{company.shortDescription}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Signals Timeline</CardTitle>
              <CardDescription>Recent activity and signals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrichmentData?.signals.map((signal, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{signal}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(enrichmentData.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!enrichmentData || enrichmentData.signals.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No signals available. Click the Enrich Data button to gather intelligence.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add your private notes about this company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Your Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
                />
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={handleSaveNotes}>Save Notes</Button>
                <div className="flex items-center gap-2">
                  <Label htmlFor="list-select">Save to List:</Label>
                  <Select value={selectedList} onValueChange={setSelectedList}>
                    <SelectTrigger id="list-select" className="w-[200px]">
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLists.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No lists available
                        </SelectItem>
                      ) : (
                        availableLists.map((list) => (
                          <SelectItem key={list} value={list}>
                            {list}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSaveToList} disabled={!selectedList}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
