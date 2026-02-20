"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCompanies, type Company } from "@/lib/companies";
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
import { ChevronLeft, ChevronRight, ArrowUpDown, ExternalLink } from "lucide-react";

type SortField = "name" | "industry" | "stage" | null;
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export function CompaniesContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Sync search query with URL params
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchQuery(search);
    }
    const industry = searchParams.get("industry");
    if (industry) {
      setIndustryFilter(industry);
    }
  }, [searchParams]);

  const companies = getCompanies();

  const industries = useMemo(() => {
    const unique = Array.from(new Set(companies.map((c) => c.industry)));
    return unique.sort();
  }, [companies]);

  const filteredAndSorted = useMemo(() => {
    let filtered = companies;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.shortDescription.toLowerCase().includes(query) ||
          company.industry.toLowerCase().includes(query)
      );
    }

    // Industry filter
    if (industryFilter !== "all") {
      filtered = filtered.filter((company) => company.industry === industryFilter);
    }

    // Sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [companies, searchQuery, industryFilter, sortField, sortDirection]);

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
          Discover and analyze startup companies
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1"
        />
        <Select value={industryFilter} onValueChange={(value) => {
          setIndustryFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                  No companies found
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
                    <Badge variant="secondary">{company.industry}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.stage}</Badge>
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
    </div>
  );
}
