"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  TrendingUp, 
  Activity, 
  Search, 
  Sparkles,
  ArrowRight,
  ClipboardList,
  Flame,
  CheckSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [stats, setStats] = useState({
    tracked: 15,
    enriched: 3,
    pipeline: 3,
    avgScore: 78,
  });

  useEffect(() => {
    // Dynamically calculate dashboard counts from localStorage
    try {
      const discovered = localStorage.getItem("discovered-companies");
      const lists = localStorage.getItem("vc-lists");
      const pipeline = localStorage.getItem("vc-pipeline");

      const discoveredCount = discovered ? Object.keys(JSON.parse(discovered)).length : 15;
      const pipelineCount = pipeline ? JSON.parse(pipeline).length : 3;

      let enrichedCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("company-") && key.endsWith("-enrichment")) {
          enrichedCount++;
        }
      }

      setStats({
        tracked: discoveredCount,
        enriched: enrichedCount || 3,
        pipeline: pipelineCount,
        avgScore: 78, // static default average score indicator
      });
    } catch (e) {
      console.error("Failed to calculate dashboard stats", e);
    }
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in">
      {/* Hero Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 border border-white/5 bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-transparent">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Building2 className="h-40 w-40" />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <Badge variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/5 px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
            ⚡ Enterprise Intelligence
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100">
            Venture Capital Intelligence Engine
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Real-time multi-source data ingestion, developer velocity harvesting, and deep 8-dimension AI analysis for investment due diligence.
          </p>
          <div className="flex gap-3 pt-2">
            <Link href="/companies">
              <Button size="sm" className="font-bold flex items-center gap-1.5 shadow-md">
                <Search className="h-4 w-4" />
                Discover Startups
              </Button>
            </Link>
            <Link href="/pipeline">
              <Button size="sm" variant="outline" className="font-bold bg-white/5 hover:bg-white/10 flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                View Deals Board
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="glass-card stat-card-violet">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Tracked Startups</span>
              <span className="text-3xl font-black text-slate-200">{stats.tracked}</span>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card stat-card-emerald">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">AI Enriched</span>
              <span className="text-3xl font-black text-slate-200">{stats.enriched}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card stat-card-amber">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Deals in Pipeline</span>
              <span className="text-3xl font-black text-slate-200">{stats.pipeline}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card stat-card-rose">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Match Score</span>
              <span className="text-3xl font-black text-slate-200">{stats.avgScore}%</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <Card className="glass-card lg:col-span-1 border border-white/5 bg-white/[0.01]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-200 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Quick Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/companies?search=highly%20scalable%20B2B%20SaaS" className="block">
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-primary/20 transition-all duration-200 flex items-center justify-between text-sm group">
                <span className="text-slate-300 font-medium group-hover:text-primary transition-colors">Find B2B SaaS Startups</span>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/companies?search=open%20source%20developer%20tools" className="block">
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-primary/20 transition-all duration-200 flex items-center justify-between text-sm group">
                <span className="text-slate-300 font-medium group-hover:text-primary transition-colors">Find OS DevTools</span>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <Link href="/companies?search=generative%20AI%20infrastructure" className="block">
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-primary/20 transition-all duration-200 flex items-center justify-between text-sm group">
                <span className="text-slate-300 font-medium group-hover:text-primary transition-colors">Find AI Infrastructure</span>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Core Methodology Highlights */}
        <Card className="glass-card lg:col-span-2 border border-white/5 bg-white/[0.01]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              Intelligence Methodology
            </CardTitle>
            <CardDescription className="text-slate-400">
              How the platform synthesizes real-world success predictions:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 h-9 w-9 shrink-0 flex items-center justify-center">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Parallel Data Orchestrator</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Simultaneously queries Wikipedia, Tavily Search, Exa Similar, GitHub REST, and direct web scraper endpoints to form a comprehensive, unhallucinated raw profile.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 h-9 w-9 shrink-0 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">8-Dimension Evaluation Weighting</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Applies distinct weights across Market (TAM), Team execution, Product depth, Traction speed, Financial burn, Moats, Timing, and Momentum to predict a final verdict.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Inline badge component for simple layout formatting
function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: "outline" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
