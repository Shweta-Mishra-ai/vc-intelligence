import { z } from "zod";

export const enrichRequestSchema = z.object({
  url: z.string().url("Please provide a valid company website URL"),
  forceRefresh: z.boolean().optional().default(false),
});

export const discoverRequestSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters").max(500, "Search query is too long"),
});

export const analyzeRequestSchema = z.object({
  enrichedData: z.object({
    summary: z.string(),
    bullets: z.array(z.string()),
    keywords: z.array(z.string()),
    signals: z.array(z.string()),
    sources: z.array(z.string()),
    timestamp: z.string(),
  }),
  thesis: z.string().min(5, "Investment thesis must be at least 5 characters"),
  weights: z.object({
    market: z.number().min(0).max(1),
    team: z.number().min(0).max(1),
    product: z.number().min(0).max(1),
    traction: z.number().min(0).max(1),
    financial: z.number().min(0).max(1),
    competitive: z.number().min(0).max(1),
    timing: z.number().min(0).max(1),
    momentum: z.number().min(0).max(1),
  }).optional(),
});

export const pipelineUpdateSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  stage: z.enum(['discovered', 'researching', 'due_diligence', 'decision', 'invested', 'passed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  notes: z.string().optional(),
});
