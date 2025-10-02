"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getSystemSettings, type SystemSetting } from "@/app/actions/settings"

type SettingsContextType = {
  settings: Record<string, any>
  loading: boolean
  refreshSettings: () => Promise<void>
  getSetting: (category: string, key: string, defaultValue?: any) => any
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const loadSettings = async () => {
    try {
      const data = await getSystemSettings()

      // Convert array to nested object for easy access
      const settingsMap: Record<string, any> = {}
      data.forEach((setting: SystemSetting) => {
        if (!settingsMap[setting.category]) {
          settingsMap[setting.category] = {}
        }
        settingsMap[setting.category][setting.setting_key] = setting.setting_value
      })

      setSettings(settingsMap)
    } catch (error) {
      console.error("[v0] Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const getSetting = (category: string, key: string, defaultValue: any = null) => {
    return settings[category]?.[key] ?? defaultValue
  }

  const refreshSettings = async () => {
    setLoading(true)
    await loadSettings()
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, getSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
