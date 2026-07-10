"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";

interface AnalysisData {
  matchScore: number;
  strengths: string[];
  risks: string[];
  verdict: string;
}

interface ThesisAnalysisProps {
  data: AnalysisData;
}

export function ThesisAnalysis({ data }: ThesisAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return "bg-green-100 border-green-300";
    if (score >= 50) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Strong Match";
    if (score >= 50) return "Moderate Match";
    return "Weak Match";
  };

  // Calculate circular progress (0-100%)
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (data.matchScore / 100) * circumference;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Thesis Match Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className={`transition-all duration-500 ${getScoreColor(data.matchScore)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(data.matchScore)}`}>
                    {data.matchScore}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
            </div>

            {/* Score Badge */}
            <div className="flex-1">
              <Badge
                className={`text-base px-4 py-2 ${getScoreBgColor(data.matchScore)} ${getScoreColor(data.matchScore)} border-2`}
              >
                {getScoreLabel(data.matchScore)}
              </Badge>
              <p className="text-sm text-muted-foreground mt-3">
                How well this company aligns with your investment thesis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-green-900">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Risks */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Risks & Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.risks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-red-900">{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Verdict */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Investment Verdict</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{data.verdict}</p>
        </CardContent>
      </Card>
    </div>
  );
}
