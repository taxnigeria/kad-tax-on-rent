"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2, Save, RefreshCw } from "lucide-react"
import { getSystemSettings, bulkUpdateSettings, type SystemSetting } from "@/app/actions/settings"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getSystemSettings()
      setSettings(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (id: string, newValue: any) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, setting_value: newValue } : s)))
  }

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update settings",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const updates = settings.map((s) => ({
        id: s.id,
        setting_value: s.setting_value,
      }))

      await bulkUpdateSettings(updates, user.id)

      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()

      // Update the logo URL setting
      const logoSetting = settings.find((s) => s.category === "general" && s.setting_key === "app_logo_url")
      if (logoSetting) {
        handleSettingChange(logoSetting.id, url)
      }

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const getSettingsByCategory = (category: string) => {
    return settings.filter((s) => s.category === category)
  }

  const renderSettingInput = (setting: SystemSetting) => {
    const value = setting.setting_value

    // Boolean settings
    if (typeof value === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{formatLabel(setting.setting_key)}</Label>
            {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
          </div>
          <Switch checked={value} onCheckedChange={(checked) => handleSettingChange(setting.id, checked)} />
        </div>
      )
    }

    // Logo upload
    if (setting.setting_key === "app_logo_url") {
      return (
        <div className="space-y-2">
          <Label>{formatLabel(setting.setting_key)}</Label>
          {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
          {value && (
            <div className="mb-2">
              <img src={value || "/placeholder.svg"} alt="Current logo" className="h-16 w-auto" />
            </div>
          )}
          <div className="flex gap-2">
            <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      )
    }

    // Color picker
    if (setting.setting_key.includes("color")) {
      return (
        <div className="space-y-2">
          <Label>{formatLabel(setting.setting_key)}</Label>
          {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
          <div className="flex gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>
      )
    }

    // Text input
    return (
      <div className="space-y-2">
        <Label>{formatLabel(setting.setting_key)}</Label>
        {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
        <Input type="text" value={value || ""} onChange={(e) => handleSettingChange(setting.id, e.target.value)} />
      </div>
    )
  }

  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-2">Configure application settings without code deployment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai_features">AI Features</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic application information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("general").map((setting) => (
                <div key={setting.id}>{renderSettingInput(setting)}</div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai_features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
              <CardDescription>Enable or disable AI-powered features in the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("ai_features").map((setting) => (
                <div key={setting.id}>{renderSettingInput(setting)}</div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Configure regional preferences like state, currency, and date formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("regional").map((setting) => (
                <div key={setting.id}>{renderSettingInput(setting)}</div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Customize the visual appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("branding").map((setting) => (
                <div key={setting.id}>{renderSettingInput(setting)}</div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
