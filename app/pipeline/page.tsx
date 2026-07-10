"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  ArrowRight, 
  Trash2, 
  FolderPlus, 
  ExternalLink,
  Kanban,
  Building
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCompanyById, type Company } from "@/lib/companies";

const PIPELINE_STAGES = [
  { key: "discovered", name: "Discovered", color: "border-slate-500 bg-slate-500/5 text-slate-400" },
  { key: "researching", name: "Researching", color: "border-violet-500 bg-violet-500/5 text-violet-400" },
  { key: "due_diligence", name: "Due Diligence", color: "border-indigo-500 bg-indigo-500/5 text-indigo-400" },
  { key: "decision", name: "Decision", color: "border-amber-500 bg-amber-500/5 text-amber-400" },
  { key: "invested", name: "Invested", color: "border-emerald-500 bg-emerald-500/5 text-emerald-400" },
  { key: "passed", name: "Passed", color: "border-rose-500 bg-rose-500/5 text-rose-400" }
];

interface PipelineItem {
  companyId: string;
  stage: string;
  addedAt: string;
}

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});

  useEffect(() => {
    // 1. Load pipeline from localStorage
    const saved = localStorage.getItem("vc-pipeline");
    let currentPipeline: PipelineItem[] = [];
    if (saved) {
      try {
        currentPipeline = JSON.parse(saved);
        setPipeline(currentPipeline);
      } catch (e) {
        console.error("Failed to parse pipeline", e);
      }
    } else {
      // Initialize with some default companies if empty
      const defaults: PipelineItem[] = [
        { companyId: "1", stage: "invested", addedAt: new Date().toISOString() },
        { companyId: "2", stage: "due_diligence", addedAt: new Date().toISOString() },
        { companyId: "3", stage: "researching", addedAt: new Date().toISOString() },
      ];
      localStorage.setItem("vc-pipeline", JSON.stringify(defaults));
      setPipeline(defaults);
      currentPipeline = defaults;
    }

    // 2. Load all associated companies
    const loadedCompanies: Record<string, Company> = {};
    currentPipeline.forEach((item) => {
      const comp = getCompanyById(item.companyId);
      if (comp) {
        loadedCompanies[item.companyId] = comp;
      }
    });
    setCompanies(loadedCompanies);
  }, []);

  const savePipeline = (newPipeline: PipelineItem[]) => {
    localStorage.setItem("vc-pipeline", JSON.stringify(newPipeline));
    setPipeline(newPipeline);
  };

  const moveStage = (companyId: string, nextStage: string) => {
    const updated = pipeline.map((item) => {
      if (item.companyId === companyId) {
        return { ...item, stage: nextStage };
      }
      return item;
    });
    savePipeline(updated);
  };

  const removeFromPipeline = (companyId: string) => {
    if (!confirm("Are you sure you want to remove this company from the pipeline?")) return;
    const updated = pipeline.filter((item) => item.companyId !== companyId);
    savePipeline(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Kanban className="h-7 w-7 text-primary" />
            Deals Pipeline
          </h1>
          <p className="text-slate-400 mt-1">
            Track and advance startup deal stages through due diligence and investment stages
          </p>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageItems = pipeline.filter((item) => item.stage === stage.key);

          return (
            <div key={stage.key} className="flex flex-col min-w-[220px] space-y-3">
              {/* Column Header */}
              <div className={`p-3 rounded-xl border flex items-center justify-between font-bold text-xs uppercase tracking-wider ${stage.color}`}>
                <span>{stage.name}</span>
                <Badge variant="secondary" className="bg-white/5 text-slate-300">
                  {stageItems.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="flex-1 min-h-[500px] p-2 rounded-2xl bg-white/[0.01] border border-dashed border-white/5 space-y-3">
                {stageItems.map((item) => {
                  const company = companies[item.companyId];
                  if (!company) return null;

                  return (
                    <div 
                      key={item.companyId}
                      className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all duration-200 space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/companies/${company.id}`} className="font-bold text-sm text-slate-200 hover:text-primary transition-colors truncate">
                          {company.name}
                        </Link>
                        <button 
                          onClick={() => removeFromPipeline(item.companyId)}
                          className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                        {company.shortDescription}
                      </p>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                        {/* Dropdown Select to move stages */}
                        <select
                          value={item.stage}
                          onChange={(e) => moveStage(item.companyId, e.target.value)}
                          className="bg-slate-900 border border-white/5 rounded-md text-[10px] py-1 px-1.5 outline-none text-slate-300"
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.name}
                            </option>
                          ))}
                        </select>

                        <Link href={`/companies/${company.id}`} className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                          View <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {stageItems.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <Building className="h-5 w-5 mb-1.5 opacity-30" />
                    <span className="opacity-40">No deals</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
