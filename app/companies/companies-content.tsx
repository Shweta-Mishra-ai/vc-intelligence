"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { Company } from "@/lib/companies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ArrowUpDown, ExternalLink, Search, Loader2 } from "lucide-react";

type SortField = "name" | "industry" | "stage" | null;
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export function CompaniesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync search query with URL params and trigger search if query exists
  useEffect(() => {
    const search = searchParams.get("search");
    if (search && search !== searchQuery) {
      setSearchQuery(search);
      handleDiscover(search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Store discovered companies in localStorage for detail page access
  useEffect(() => {
    if (companies.length > 0) {
      const companiesMap: Record<string, Company> = {};
      companies.forEach((company) => {
        companiesMap[company.id] = company;
      });
      localStorage.setItem("discovered-companies", JSON.stringify(companiesMap));
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

  const industries = useMemo(() => {
    const unique = Array.from(
      new Set(companies.map((c) => c.industry).filter(Boolean))
    ) as string[];
    return unique.sort();
  }, [companies]);

  const filteredAndSorted = useMemo(() => {
    let filtered = companies;

    // Industry filter
    if (industryFilter !== "all") {
      filtered = filtered.filter((company) => company.industry === industryFilter);
    }

    // Sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = (a[sortField] as string) || "";
        const bVal = (b[sortField] as string) || "";
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [companies, industryFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companies</h1>
        <p className="text-muted-foreground mt-1">
          Discover and analyze startup companies with live web search
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for companies (e.g., 'fast growing B2B SaaS startups in data science')..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4"
            disabled={isSearching}
          />
        </div>
        <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.length > 0 &&
              industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </form>

      {isSearching && (
        <div className="rounded-md border p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Searching the web...</p>
              <p className="text-xs text-muted-foreground">
                Discovering companies from across the internet
              </p>
            </div>
            <div className="w-full max-w-md space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </div>
      )}

      {searchError && (
        <div className="rounded-md border border-destructive bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">Search failed</p>
          <p className="text-sm text-muted-foreground mt-1">{searchError}</p>
        </div>
      )}

      {!isSearching && hasSearched && companies.length === 0 && !searchError && (
        <div className="rounded-md border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No companies found. Try a different search query.
          </p>
        </div>
      )}

      {!isSearching && companies.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="name">Name</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="industry">Industry</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="stage">Stage</SortButton>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Website</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No companies match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/companies/${company.id}`}
                          className="hover:underline"
                        >
                          {company.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {company.industry ? (
                          <Badge variant="secondary">{company.industry}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.stage ? (
                          <Badge variant="outline">{company.stage}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {company.shortDescription}
                        </p>
                      </TableCell>
                      <TableCell>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSorted.length)} of{" "}
                {filteredAndSorted.length} companies
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {!hasSearched && !isSearching && (
        <div className="rounded-md border p-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Start discovering companies</p>
          <p className="text-sm text-muted-foreground">
            Enter a search query above to find startups and companies from across the web
          </p>
        </div>
      )}
    </div>
  );
}
