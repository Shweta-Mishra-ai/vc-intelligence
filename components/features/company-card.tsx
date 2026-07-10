"use client";

import Link from "next/link";
import { Building2, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DiscoveredCompany } from "@/lib/types";

interface CompanyCardProps {
  company: DiscoveredCompany;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <div className="glass-card-hover flex flex-col justify-between p-5 h-full relative group">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 text-primary group-hover:bg-primary/10 transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 group-hover:text-primary transition-colors text-base truncate max-w-[150px]">
                {company.name}
              </h3>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 mt-0.5"
              >
                {company.website.replace(/^https?:\/\/(www\.)?/, "")}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-[10px] py-0.5 px-2 bg-white/5 text-slate-300 border-none font-semibold">
            {company.source}
          </Badge>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">
          {company.shortDescription}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
        <Link href={`/companies/${company.id}`} className="w-full">
          <button className="w-full h-8 text-[11px] font-semibold text-slate-300 bg-white/5 hover:bg-primary/20 hover:text-primary hover:glow-violet border border-white/5 hover:border-primary/20 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Evaluate Intelligence
          </button>
        </Link>
      </div>
    </div>
  );
}
