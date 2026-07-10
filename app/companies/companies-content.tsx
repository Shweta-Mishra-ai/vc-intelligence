"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Company } from "@/lib/companies";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search as SearchIcon, Loader2, Sparkles, Building } from "lucide-react";
import { CompanyCard } from "@/components/features/company-card";
import { DiscoveredCompany } from "@/lib/types";
import staticCompaniesData from "@/data/companies.json";

const ITEMS_PER_PAGE = 8;

export function CompaniesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState<DiscoveredCompany[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Parse static companies as fallback/default list
  const staticCompanies: DiscoveredCompany[] = useMemo(() => {
    return (staticCompaniesData as Company[]).map((c) => ({
      id: c.id,
      name: c.name,
      website: c.website,
      shortDescription: c.shortDescription,
      source: "Curated Database",
      industry: c.industry,
      stage: c.stage,
    }));
  }, []);

  // Sync search query with URL params and trigger search if query exists
  useEffect(() => {
    const search = searchParams.get("search");
    if (search && search !== searchQuery) {
      setSearchQuery(search);
      handleDiscover(search);
    }
  }, [searchParams]);

  // Store discovered companies in localStorage for detail page access
  useEffect(() => {
    if (companies.length > 0) {
      try {
        const discoveredData = localStorage.getItem("discovered-companies");
        const existing = discoveredData ? JSON.parse(discoveredData) : {};
        
        companies.forEach((company) => {
          existing[company.id] = {
            id: company.id,
            name: company.name,
            website: company.website,
            shortDescription: company.shortDescription,
            industry: company.industry,
            stage: company.stage,
          };
        });
        
        localStorage.setItem("discovered-companies", JSON.stringify(existing));
      } catch (e) {
        console.error("Failed to save discovered companies", e);
      }
    }
  }, [companies]);

  const handleDiscover = async (query: string) => {
    if (!query.trim()) {
      setCompanies([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.companies && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Discovery error:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to discover companies");
      setCompanies([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/companies?search=${encodeURIComponent(searchQuery.trim())}`);
      handleDiscover(searchQuery.trim());
    }
  };

  // Determine current active list (search results or curated static database)
  const activeCompanies = hasSearched ? companies : staticCompanies;

  const industries = useMemo(() => {
    const unique = Array.from(
      new Set(activeCompanies.map((c) => c.industry).filter(Boolean))
    ) as string[];
    return unique.sort();
  }, [activeCompanies]);

  const filtered = useMemo(() => {
    let list = activeCompanies;

    // Industry filter
    if (industryFilter !== "all") {
      list = list.filter((company) => company.industry === industryFilter);
    }

    return list;
  }, [activeCompanies, industryFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in">
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Company Discovery
        </h1>
        <p className="text-slate-400 mt-1">
          Perform natural language web searches to discover, crawl, and ingest startup profiles globally
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search e.g. 'high growth developer productivity tools founded in 2023'..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) {
                setCompanies([]);
                setHasSearched(false);
              }
              setCurrentPage(1);
            }}
            className="pl-11 h-11 glass-input border-none rounded-xl text-slate-200 placeholder-slate-400"
            disabled={isSearching}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className="h-11 rounded-xl font-bold bg-primary hover:bg-primary/95 text-slate-100 shadow-md px-6 flex items-center gap-1.5"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingesting...
            </>
          ) : (
            <>
              <SearchIcon className="h-4 w-4" />
              Discover
            </>
          )}
        </Button>
        <Select 
          value={industryFilter} 
          onValueChange={(value) => {
            setIndustryFilter(value);
            setCurrentPage(1);
          }}
          disabled={isSearching}
        >
          <SelectTrigger className="w-[200px] h-11 glass-input border-none rounded-xl text-slate-200">
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/5 text-slate-200">
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </form>

      {/* Loading Skeletons */}
      {isSearching && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-white/5" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-white/5" />
                  <Skeleton className="h-3 w-16 bg-white/5" />
                </div>
              </div>
              <Skeleton className="h-16 w-full bg-white/5" />
              <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {searchError && (
        <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-5 text-center space-y-2">
          <p className="text-sm font-bold text-rose-400">Discovery search failed</p>
          <p className="text-xs text-slate-400">{searchError}</p>
        </div>
      )}

      {/* Empty Search Results */}
      {!isSearching && hasSearched && paginatedCompanies.length === 0 && !searchError && (
        <div className="rounded-2xl border border-white/5 p-12 text-center bg-white/[0.01]">
          <Building className="h-12 w-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 font-semibold">
            No matching companies discovered. Try a broader search criteria.
          </p>
        </div>
      )}

      {/* Grid of Results */}
      {!isSearching && paginatedCompanies.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <p className="text-xs text-slate-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} startups
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 border-none h-8 text-xs font-semibold px-3"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 border-none h-8 text-xs font-semibold px-3"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
