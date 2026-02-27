import { getCachedSettingValue } from "@/lib/settings-cache"
import type { PayKadunaConfig, PayKadunaMode } from "./types"

export const PAYKADUNA_TEST_BASE_URL = "https://testingapi.paykaduna.com"
export const PAYKADUNA_LIVE_BASE_URL = "https://api.paykaduna.com"

/**
 * Get the current PayKaduna configuration by reading the mode from cached system_settings.
 * Falls back to "test" mode if the setting is not found.
 */
export async function getPayKadunaConfig(): Promise<PayKadunaConfig> {
    let mode: PayKadunaMode = "test"

    try {
        const cachedMode = await getCachedSettingValue("system", "paykaduna_mode")
        if (cachedMode === "live" || cachedMode === "test") {
            mode = cachedMode as PayKadunaMode
        }
    } catch (error) {
        console.warn("[PayKaduna] Could not read paykaduna_mode from settings cache, defaulting to 'test':", error)
    }

    const isLive = mode === "live"

    const apiKey = isLive
        ? process.env.PAYKADUNA_LIVE_API_KEY
        : process.env.PAYKADUNA_TEST_API_KEY

    if (!apiKey) {
        throw new Error(`PayKaduna ${mode} API key is not configured. Set PAYKADUNA_${mode.toUpperCase()}_API_KEY in .env.local`)
    }

    const engineCode = process.env.PAYKADUNA_ENGINE_CODE
    if (!engineCode) {
        throw new Error("PAYKADUNA_ENGINE_CODE is not configured in .env.local")
    }

    const mdasId = process.env.PAYKADUNA_MDASID || "132"

    return {
        mode,
        baseUrl: isLive ? PAYKADUNA_LIVE_BASE_URL : PAYKADUNA_TEST_BASE_URL,
        apiKey,
        engineCode,
        mdasId,
    }
}
