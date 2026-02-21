"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";

interface EnrichmentData {
  summary: string;
  bullets: string[];
  keywords: string[];
  signals: string[];
  sources: string[];
  timestamp: string;
}

interface EnrichmentDisplayProps {
  data: EnrichmentData;
}

export function EnrichmentDisplay({ data }: EnrichmentDisplayProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enrichment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What They Do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.bullets.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Derived Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.signals.map((signal, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md border p-3"
              >
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">{signal}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Enriched on {format(new Date(data.timestamp), "PPpp")}
            </span>
          </div>
          <div className="space-y-1">
            {data.sources.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {url}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
