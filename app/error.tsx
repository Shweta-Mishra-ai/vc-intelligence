"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-lg w-full border-rose-500/20 bg-rose-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            An unexpected error occurred. Your data is stored locally and is safe.
          </p>
          {process.env.NODE_ENV !== "production" && (
            <pre className="text-xs bg-black/30 p-3 rounded-lg overflow-auto max-h-32 text-rose-300">
              {error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
