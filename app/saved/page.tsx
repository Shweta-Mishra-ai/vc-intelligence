"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Plus } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  searchQuery: string;
  industryFilter: string;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [newSearchQuery, setNewSearchQuery] = useState("");
  const [newIndustryFilter, setNewIndustryFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("vc-saved-searches");
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved searches", e);
      }
    }
  }, []);

  const saveSearches = (searches: SavedSearch[]) => {
    localStorage.setItem("vc-saved-searches", JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const handleSaveSearch = () => {
    if (!newSearchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: newSearchName.trim(),
      searchQuery: newSearchQuery.trim(),
      industryFilter: newIndustryFilter,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    saveSearches(updated);
    setNewSearchName("");
    setNewSearchQuery("");
    setNewIndustryFilter("all");
    setIsCreating(false);
  };

  const handleDeleteSearch = (id: string) => {
    if (!confirm("Are you sure you want to delete this saved search?")) return;
    const updated = savedSearches.filter((s) => s.id !== id);
    saveSearches(updated);
  };

  const handleRunSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.searchQuery) {
      params.set("search", search.searchQuery);
    }
    if (search.industryFilter && search.industryFilter !== "all") {
      params.set("industry", search.industryFilter);
    }
    router.push(`/companies?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground mt-1">
            Save and quickly re-run your search filter combinations
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Save Current Search
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Save Search</CardTitle>
            <CardDescription>
              Give this search combination a name to save it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Name</label>
              <Input
                placeholder="e.g., AI Companies Series A"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Query</label>
              <Input
                placeholder="Search terms..."
                value={newSearchQuery}
                onChange={(e) => setNewSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry Filter</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newIndustryFilter}
                onChange={(e) => setNewIndustryFilter(e.target.value)}
              >
                <option value="all">All Industries</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Data Analytics">Data Analytics</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Financial Technology">Financial Technology</option>
                <option value="Clean Energy">Clean Energy</option>
                <option value="EdTech">EdTech</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Developer Tools">Developer Tools</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Social Media">Social Media</option>
                <option value="Automotive">Automotive</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Food Technology">Food Technology</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveSearch}>Save</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewSearchName("");
                  setNewSearchQuery("");
                  setNewIndustryFilter("all");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Search className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                No saved searches yet. Create one to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedSearches.map((search) => (
            <Card key={search.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{search.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(search.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSearch(search.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {search.searchQuery && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Query</p>
                    <p className="text-sm font-medium">{search.searchQuery}</p>
                  </div>
                )}
                {search.industryFilter !== "all" && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Industry</p>
                    <Badge variant="secondary">{search.industryFilter}</Badge>
                  </div>
                )}
                <Button
                  onClick={() => handleRunSearch(search)}
                  className="w-full"
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Run Search
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
