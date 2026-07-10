"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  className?: string;
}

export function ScoreGauge({ score, className }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate count up
    const duration = 1000; // 1s
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      const nextScore = Math.round(easeProgress * score);
      
      setAnimatedScore(nextScore);

      if (currentStep >= steps) {
        setAnimatedScore(score);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreInfo = (s: number) => {
    if (s >= 80) return { label: "Strong Invest", color: "text-emerald-500", stroke: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/20" };
    if (s >= 60) return { label: "Promising", color: "text-indigo-400", stroke: "#818cf8", bg: "bg-indigo-500/10 border-indigo-500/20" };
    if (s >= 40) return { label: "Moderate Watch", color: "text-amber-500", stroke: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/20" };
    if (s >= 20) return { label: "Weak Signal", color: "text-orange-500", stroke: "#f97316", bg: "bg-orange-500/10 border-orange-500/20" };
    return { label: "Pass / Avoid", color: "text-rose-500", stroke: "#f43f5e", bg: "bg-rose-500/10 border-rose-500/20" };
  };

  const info = getScoreInfo(score);
  
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative w-36 h-36">
        <svg className="transform -rotate-90 w-full h-full">
          {/* Base Background Circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="10"
            fill="none"
          />
          {/* Filled Progressive Score Circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={info.stroke}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        {/* Score display in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-extrabold tracking-tight", info.color)}>
            {animatedScore}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
            Score / 100
          </span>
        </div>
      </div>

      <div className={cn("px-4 py-1.5 rounded-full border text-xs font-bold shadow-md", info.bg, info.color)}>
        {info.label}
      </div>
    </div>
  );
}
