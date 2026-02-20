"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCompanies, getCompanyById, type Company } from "@/lib/companies";
import { Trash2, Download, Plus, X } from "lucide-react";

interface ListData {
  [listName: string]: string[];
}

export default function ListsPage() {
  const [lists, setLists] = useState<ListData>({});
  const [selectedList, setSelectedList] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const savedLists = localStorage.getItem("vc-lists");
    if (savedLists) {
      try {
        setLists(JSON.parse(savedLists));
      } catch (e) {
        console.error("Failed to parse lists", e);
      }
    }
  }, []);

  const saveLists = (updatedLists: ListData) => {
    localStorage.setItem("vc-lists", JSON.stringify(updatedLists));
    setLists(updatedLists);
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    const listKey = newListName.trim();
    if (lists[listKey]) {
      alert("A list with this name already exists");
      return;
    }

    const updated = { ...lists, [listKey]: [] };
    saveLists(updated);
    setNewListName("");
    setIsCreating(false);
    setSelectedList(listKey);
  };

  const handleDeleteList = (listName: string) => {
    if (!confirm(`Are you sure you want to delete "${listName}"?`)) return;

    const updated = { ...lists };
    delete updated[listName];
    saveLists(updated);
    if (selectedList === listName) {
      setSelectedList("");
    }
  };

  const handleRemoveCompany = (listName: string, companyId: string) => {
    const updated = { ...lists };
    updated[listName] = updated[listName].filter((id) => id !== companyId);
    saveLists(updated);
  };

  const handleExportCSV = (listName: string) => {
    const companyIds = lists[listName] || [];
    const companies = companyIds
      .map((id) => getCompanyById(id))
      .filter((c): c is Company => c !== undefined);

    const headers = ["Name", "Website", "Industry", "Stage", "Description"];
    const rows = companies.map((c) => [
      c.name,
      c.website,
      c.industry,
      c.stage,
      c.shortDescription,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listName.replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedCompanies =
    selectedList && lists[selectedList]
      ? lists[selectedList]
          .map((id) => getCompanyById(id))
          .filter((c): c is Company => c !== undefined)
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lists</h1>
          <p className="text-muted-foreground mt-1">
            Manage your custom company lists
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create List
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateList();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewListName("");
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleCreateList}>Create</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewListName("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Lists</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(lists).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No lists yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.keys(lists).map((listName) => (
                    <div
                      key={listName}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        selectedList === listName
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedList(listName)}
                    >
                      <span className="text-sm font-medium">{listName}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {lists[listName].length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(listName);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {selectedList ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedList}</CardTitle>
                    <CardDescription>
                      {selectedCompanies.length} companies
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleExportCSV(selectedList)}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedCompanies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    This list is empty. Add companies from their detail pages.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCompanies.map((company) => (
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveCompany(selectedList, company.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Select a list to view its companies
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
