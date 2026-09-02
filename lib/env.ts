import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  EXA_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
}).refine((data) => data.OPENAI_API_KEY || data.GEMINI_API_KEY || process.env.NEXT_PHASE === "phase-production-build", {
  message: "At least one of OPENAI_API_KEY or GEMINI_API_KEY must be set (unless building).",
  path: ["OPENAI_API_KEY"],
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // In production build, allow dummy keys but warn
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn("Env validation warnings during build:", parsed.error.flatten());
      cachedEnv = process.env as unknown as Env;
      return cachedEnv;
    }
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function hasAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
}
