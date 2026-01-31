"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
  const supabase = await createClient()

  let query = supabase
    .from("system_settings")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("setting_key", { ascending: true })

  if (category) {
    query = query.eq("category", category)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching system settings:", error)
    throw new Error(`Failed to fetch system settings: ${error.message}`)
  }

  return data as SystemSetting[]
}

/**
 * Get a specific setting value by category and key
 */
export async function getSettingValue(category: SettingsCategory, key: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("category", category)
    .eq("setting_key", key)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error(`[v0] Error fetching setting ${category}.${key}:`, error)
    return null
  }

  return data?.setting_value
}

/**
 * Update a system setting
 */
export async function updateSystemSetting(id: string, settingValue: any, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("system_settings")
    .update({
      setting_value: settingValue,
      updated_by: userId,
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
          setting_value: update.setting_value,
          updated_by: userId,
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

  return results.map((r) => r.data) as SystemSetting[]
}

/**
 * Ensures required settings exist in the database
 */
export async function ensureDefaultSettings(userId: string) {
  const supabase = await createClient()

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
        updated_by: userId,
      })
    }
  }

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
      updated_by: userId,
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
