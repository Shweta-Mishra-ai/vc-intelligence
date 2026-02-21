"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { getCompanyById, type Company } from "@/lib/companies";
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
import { ExternalLink, Sparkles, Calendar, FileText } from "lucide-react";
import { EnrichmentDisplay } from "@/components/enrichment-display";
import { EnrichmentLoader } from "@/components/enrichment-loader";

interface EnrichmentData {
  summary: string;
  bullets: string[];
  keywords: string[];
  signals: string[];
  sources: string[];
  timestamp: string;
}

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = getCompanyById(params.id);

  if (!company) {
    notFound();
  }

  const [notes, setNotes] = useState("");
  const [selectedList, setSelectedList] = useState<string>("");
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null);
  const [enrichmentStep, setEnrichmentStep] = useState<string>("");
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

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
        if (parsed.summary && Array.isArray(parsed.bullets) && Array.isArray(parsed.keywords) && Array.isArray(parsed.signals)) {
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
    if (!selectedList) return;

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
      if (!data.summary || !Array.isArray(data.bullets) || !Array.isArray(data.keywords) || !Array.isArray(data.signals)) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">{company.industry}</Badge>
            <Badge variant="outline">{company.stage}</Badge>
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
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <p className="text-sm font-medium">Enrichment failed: {enrichmentError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnrichmentError(null)}
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
