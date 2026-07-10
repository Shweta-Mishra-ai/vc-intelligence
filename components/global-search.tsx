"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/companies?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search companies, tech, or metrics globally..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-11 pr-4 rounded-xl text-sm text-slate-200 outline-none glass-input placeholder-slate-400"
        />
      </div>
    </form>
  );
}
