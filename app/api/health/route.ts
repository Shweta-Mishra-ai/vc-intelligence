import { NextResponse } from "next/server";
import { hasAiKey } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, { status: "ok" | "warn" | "fail"; message?: string }> = {
    ai: hasAiKey() ? { status: "ok" } : { status: "warn", message: "No AI key configured — analysis will use fallback scores" },
    tavily: process.env.TAVILY_API_KEY ? { status: "ok" } : { status: "warn", message: "TAVILY_API_KEY not set — discovery uses Exa only" },
    exa: process.env.EXA_API_KEY ? { status: "ok" } : { status: "warn", message: "EXA_API_KEY not set — discovery limited" },
    github: process.env.GITHUB_TOKEN ? { status: "ok" } : { status: "warn", message: "GITHUB_TOKEN not set — rate limit 60/hr" },
  };

  const hasFail = Object.values(checks).some(c => c.status === "fail");
  const overall = hasFail ? "degraded" : Object.values(checks).some(c => c.status === "warn") ? "ok_with_warnings" : "ok";

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "0.1.0",
      env: process.env.NODE_ENV,
      latencyMs: Date.now() - startedAt,
      checks,
    },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  );
}
