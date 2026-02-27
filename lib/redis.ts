import { Redis } from "@upstash/redis"

/**
 * Upstash Redis client singleton.
 * Uses REST-based SDK — works in Edge Runtime and Server Actions.
 * Fails gracefully if not configured.
 */
let redis: Redis | null = null

export function getRedis(): Redis | null {
    if (redis) return redis

    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
        console.warn("[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — caching disabled")
        return null
    }

    // Sanitize in case of quotes in .env
    const sanitizedUrl = url.replace(/^["']|["']$/g, "")
    const sanitizedToken = token.replace(/^["']|["']$/g, "")

    redis = new Redis({ url: sanitizedUrl, token: sanitizedToken })
    return redis
}
