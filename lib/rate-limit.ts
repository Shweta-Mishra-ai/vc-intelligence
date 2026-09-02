/**
 * Simple in-memory rate limiter with TTL cleanup.
 * NOTE: For production at 5000+ users, replace with Redis (Upstash) for distributed consistency.
 * This in-memory version is per-instance and suitable for single-instance or dev usage.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimiters = new Map<string, RateLimitRecord>();

// Clean up expired entries every minute
if (typeof global !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimiters.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimiters.delete(key);
      }
    });
  }, 60000).unref?.();
}

/**
 * Extracts client IP securely, preferring Vercel/Next.js headers.
 * Falls back to x-forwarded-for first entry only if trusted.
 */
export function getClientIp(request: Request): string {
  // Next.js on Vercel provides x-real-ip and x-forwarded-for
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take first IP (original client), trim, validate format
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp && /^[\d.:a-fA-F]+$/.test(firstIp.replace(/ /g, "")) && firstIp.length < 45) {
      return firstIp;
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  // @ts-ignore - NextRequest has ip property on Vercel
  const vercelIp = (request as any).ip;
  if (vercelIp) return vercelIp;
  return "anonymous";
}

/**
 * Checks if a request exceeds the limit for a given key.
 * 
 * @param key Unique identifier (IP, user ID, route key)
 * @param limit Max number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns Object with success boolean and remaining request count
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimiters.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired record
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimiters.set(key, newRecord);
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}
