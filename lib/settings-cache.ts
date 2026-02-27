import { getRedis } from "./redis"
import { createAdminClient } from "@/lib/supabase/admin"

// Cache key and TTL
const SETTINGS_CACHE_KEY = "kad:settings:all"
const SETTINGS_TTL_SECONDS = 15 * 60 // 15 minutes

export interface CachedSetting {
    id: string
    category: string
    setting_key: string
    setting_value: any
    description: string | null
    is_active: boolean
}

/**
 * Get all system settings — with Redis cache.
 * 
 * Flow:
 * 1. Try Redis cache first
 * 2. On cache miss, query Supabase
 * 3. Store result in Redis with TTL
 * 4. If Redis is unavailable, fall through to Supabase directly
 */
export async function getCachedSettings(): Promise<CachedSetting[]> {
    const redis = getRedis()

    // Try cache first
    if (redis) {
        try {
            const cached = await redis.get<CachedSetting[]>(SETTINGS_CACHE_KEY)
            if (cached) {
                return cached
            }
        } catch (err) {
            console.warn("[SettingsCache] Redis read failed, falling back to DB:", err)
        }
    }

    // Cache miss or Redis unavailable — query DB
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from("system_settings")
        .select("id, category, setting_key, setting_value, description, is_active")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("setting_key", { ascending: true })

    if (error) {
        console.error("[SettingsCache] Supabase query failed:", JSON.stringify(error, null, 2))
        throw new Error(`Failed to fetch settings: ${error.message || 'Unknown network error'}`)
    }

    const settings = (data || []) as CachedSetting[]

    // Write to cache
    if (redis && settings.length > 0) {
        try {
            await redis.set(SETTINGS_CACHE_KEY, settings, { ex: SETTINGS_TTL_SECONDS })
        } catch (err) {
            console.warn("[SettingsCache] Redis write failed:", err)
        }
    }

    return settings
}

/**
 * Get a single setting value by category and key — uses the cached settings.
 */
export async function getCachedSettingValue(category: string, key: string): Promise<any> {
    const settings = await getCachedSettings()
    const found = settings.find(s => s.category === category && s.setting_key === key)
    return found?.setting_value ?? null
}

/**
 * Invalidate the settings cache.
 * Call this after any settings update so the next read fetches fresh data.
 */
export async function invalidateSettingsCache(): Promise<void> {
    const redis = getRedis()
    if (redis) {
        try {
            await redis.del(SETTINGS_CACHE_KEY)
        } catch (err) {
            console.warn("[SettingsCache] Redis invalidation failed:", err)
        }
    }
}
