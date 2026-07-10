"use client";

import { CheckCircle2, AlertOctagon, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerdictCardProps {
  verdict: 'STRONG_INVEST' | 'PROMISING' | 'MODERATE' | 'WEAK' | 'PASS';
  verdictText: string;
  overallScore: number;
  strengths: string[];
  risks: string[];
}

export function VerdictCard({
  verdict,
  verdictText,
  overallScore,
  strengths,
  risks,
}: VerdictCardProps) {
  const getVerdictConfig = (v: string) => {
    switch (v) {
      case "STRONG_INVEST":
        return {
          label: "Strong Invest",
          color: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
          glow: "glow-emerald",
          iconColor: "text-emerald-400",
        };
      case "PROMISING":
        return {
          label: "Promising Match",
          color: "text-indigo-400",
          bg: "bg-indigo-500/10 border-indigo-500/20",
          glow: "glow-violet",
          iconColor: "text-indigo-400",
        };
      case "MODERATE":
        return {
          label: "Moderate Watch",
          color: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/20",
          glow: "glow-amber",
          iconColor: "text-amber-400",
        };
      case "WEAK":
        return {
          label: "Weak Match",
          color: "text-orange-400",
          bg: "bg-orange-500/10 border-orange-500/20",
          glow: "glow-orange",
          iconColor: "text-orange-400",
        };
      default:
        return {
          label: "Pass / Avoid",
          color: "text-rose-400",
          bg: "bg-rose-500/10 border-rose-500/20",
          glow: "glow-rose",
          iconColor: "text-rose-400",
        };
    }
  };

  const config = getVerdictConfig(verdict);

  return (
    <div className="space-y-6">
      {/* Glowing AI Verdict Card */}
      <div className={cn("p-6 rounded-2xl border backdrop-blur-xl shadow-lg transition-all duration-300", config.bg, config.glow)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5">
              <Sparkles className={cn("h-6 w-6 animate-pulse", config.color)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                AI Investment Recommendation
              </span>
              <h2 className={cn("text-2xl font-black tracking-tight", config.color)}>
                {config.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-slate-400">Match score:</span>
            <span className="text-sm font-extrabold text-slate-200">{overallScore}%</span>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed font-medium">
          {verdictText}
        </p>
      </div>

      {/* Strengths & Risks Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.01]">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4" />
            Core Strengths
          </h3>
          <ul className="space-y-3">
            {strengths.length > 0 ? (
              strengths.map((str, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-300 text-xs leading-normal">{str}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">No specific strengths mapped.</li>
            )}
          </ul>
        </div>

        {/* Risks */}
        <div className="p-5 rounded-2xl border border-rose-500/10 bg-rose-500/[0.01]">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-4">
            <AlertOctagon className="h-4 w-4" />
            Investment Risks
          </h3>
          <ul className="space-y-3">
            {risks.length > 0 ? (
              risks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-slate-300 text-xs leading-normal">{risk}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">No major risk factors flagged.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
