"use client";

import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DimensionBarProps {
  name: string;
  score: number;
  icon: LucideIcon;
  description?: string;
}

export function DimensionBar({ name, score, icon: Icon, description }: DimensionBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Triggers width animation after mount
    const timer = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getBarColor = (s: number) => {
    if (s >= 80) return "bg-gradient-to-r from-emerald-500 to-teal-400";
    if (s >= 60) return "bg-gradient-to-r from-violet-500 to-indigo-400";
    if (s >= 40) return "bg-gradient-to-r from-amber-500 to-orange-400";
    return "bg-gradient-to-r from-rose-500 to-red-400";
  };

  const getTextColor = (s: number) => {
    if (s >= 80) return "text-emerald-400";
    if (s >= 60) return "text-violet-400";
    if (s >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="space-y-2 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg bg-white/5", getTextColor(score))}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-200">{name}</span>
        </div>
        <span className={cn("text-sm font-bold", getTextColor(score))}>{score}%</span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", getBarColor(score))}
          style={{ width: `${width}%` }}
        />
      </div>

      {description && (
        <p className="text-[11px] text-slate-400 leading-normal line-clamp-1 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
