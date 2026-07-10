/**
 * Simple in-memory rate limiter with TTL cleanup.
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
