"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { invalidateSettingsCache, getCachedSettings, getCachedSettingValue } from "@/lib/settings-cache"

export type SystemSetting = {
  id: string
  category: string
  setting_key: string
  setting_value: any
  description: string | null
  is_active: boolean
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type SettingsCategory = "general" | "ai_features" | "regional" | "branding" | "system" | "security"

/**
 * Get all system settings or filter by category
 */
export async function getSystemSettings(category?: SettingsCategory) {
  const data = await getCachedSettings()

  if (category) {
    return data.filter(s => s.category === category) as SystemSetting[]
  }

  return data as SystemSetting[]
}

/**
 * Get a specific setting value by category and key
 */
export async function getSettingValue(category: SettingsCategory, key: string) {
  return getCachedSettingValue(category, key)
}

/**
 * Update a system setting
 */
export async function updateSystemSetting(id: string, settingValue: any, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("system_settings")
    .update({
      setting_value: settingValue ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating system setting:", error)
    throw new Error(`Failed to update setting: ${error.message}`)
  }

  // Revalidate relevant paths
  revalidatePath("/admin/settings")
  revalidatePath("/dashboard")

  // Invalidate Redis cache so next read fetches fresh data
  await invalidateSettingsCache()

  return data as SystemSetting
}

/**
 * Bulk update multiple settings
 */
export async function bulkUpdateSettings(updates: Array<{ id: string; setting_value: any }>, userId: string) {
  const supabase = await createClient()

  const results = await Promise.all(
    updates.map((update) =>
      supabase
        .from("system_settings")
        .update({
          setting_value: update.setting_value ?? "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id)
        .select()
        .single(),
    ),
  )

  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    console.error("[v0] Errors updating settings:", errors.map(e => ({
      error: e.error,
      status: e.status,
      statusText: e.statusText
    })))
    throw new Error(`Failed to update ${errors.length} setting(s): ${errors.map(e => e.error?.message).join(', ')}`)
  }

  // Revalidate relevant paths
  revalidatePath("/admin/settings")
  revalidatePath("/dashboard")

  // Invalidate Redis cache so next read fetches fresh data
  await invalidateSettingsCache()

  return results.map((r) => r.data) as SystemSetting[]
}

/**
 * Ensures required settings exist in the database
 */
export async function ensureDefaultSettings(userId: string) {
  const supabase = createAdminClient()

  const defaults = [
    { category: "system", key: "maintenance_mode", value: false, desc: "Global maintenance mode toggle" },
    { category: "system", key: "test_mode", value: false, desc: "Enable test mode for payments and tagging" },
    { category: "system", key: "maintenance_message", value: "System is currently undergoing maintenance. Please check back later.", desc: "Message shown during maintenance" },
    { category: "security", key: "login_enabled_admin", value: true, desc: "Allow Admin role login" },
    { category: "security", key: "login_enabled_staff", value: true, desc: "Allow Staff role login" },
    { category: "security", key: "login_enabled_taxpayer", value: true, desc: "Allow Taxpayer role login" },
    { category: "branding", key: "primary_color", value: "#000000", desc: "Primary brand accent color" },
    { category: "regional", key: "state_name", value: "Kaduna", desc: "Name of the operating state" },
    { category: "regional", key: "tax_authority_name", value: "KADIRS", desc: "Name of the tax authority" },
    { category: "system", key: "paykaduna_mode", value: "test", desc: "PayKaduna API mode: 'live' or 'test'. Controls which API endpoint and keys are used." },
  ]

  for (const item of defaults) {
    // Check if exists
    const { data: existing } = await supabase
      .from("system_settings")
      .select("id")
      .eq("category", item.category)
      .eq("setting_key", item.key)
      .maybeSingle()

    if (!existing) {
      await supabase.from("system_settings").insert({
        category: item.category as SettingsCategory,
        setting_key: item.key,
        setting_value: item.value,
        description: item.desc,
      })
    }
  }

  // If any new settings were inserted, clean the cache
  await invalidateSettingsCache()
  revalidatePath("/admin/settings")
}

/**
 * Create a new system setting
 */
export async function createSystemSetting(
  category: SettingsCategory,
  settingKey: string,
  settingValue: any,
  description: string,
  userId: string,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("system_settings")
    .insert({
      category,
      setting_key: settingKey,
      setting_value: settingValue,
      description,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating system setting:", error)
    throw new Error(`Failed to create setting: ${error.message}`)
  }

  revalidatePath("/admin/settings")

  return data as SystemSetting
}
