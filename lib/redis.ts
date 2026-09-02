import { Redis } from "@upstash/redis";

let redisClientInstance: Redis | null = null;

/**
 * Returns a singleton instance of the Upstash Redis client.
 * Returns null if environment variables are not configured.
 */
export function getRedisClient(): Redis | null {
  if (redisClientInstance) {
    return redisClientInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[Upstash Redis] Missing credentials (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN). Background queue fallback enabled."
      );
    }
    return null;
  }

  try {
    redisClientInstance = new Redis({
      url,
      token,
    });
    return redisClientInstance;
  } catch (error) {
    console.error("[Upstash Redis] Initialization failed:", error);
    return null;
  }
}
