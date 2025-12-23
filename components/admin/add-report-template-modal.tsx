"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, X, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { getMetricSuggestions } from "@/lib/reports/ai-assistant"

type AddReportTemplateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const REPORT_TYPES = [
  { value: "tax_summary", label: "Tax Collection Summary" },
  { value: "property_inventory", label: "Property Inventory" },
  { value: "payment_analytics", label: "Payment Analytics" },
  { value: "enumerator_performance", label: "Enumerator Performance" },
  { value: "custom", label: "Custom Report" },
]

export function AddReportTemplateModal({ open, onOpenChange, onSuccess }: AddReportTemplateModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("ai")

  const [aiDescription, setAiDescription] = useState("")
  const [aiGeneratedTemplate, setAiGeneratedTemplate] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    metrics: "",
  })

  async function handleGenerateFromAI(e: React.FormEvent) {
    e.preventDefault()

    if (!aiDescription.trim()) {
      toast.error("Please describe the report you need")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/reports/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate template")
      }

      const template = await response.json()
      setAiGeneratedTemplate(template)
      toast.success("Template generated! Review and save below.")
    } catch (error) {
      console.error("[v0] Error generating template:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate template")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveAITemplate() {
    if (!aiGeneratedTemplate) {
      toast.error("Generate a template first")
      return
    }

    setLoading(true)

    try {
      // TODO: Save to report_templates table
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Report template created from AI")
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error saving AI template:", error)
      toast.error("Failed to save template")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim() || !formData.type) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      // TODO: Implement save to report_templates table
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Report template created successfully")
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating report template:", error)
      toast.error("Failed to create report template")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setAiDescription("")
    setAiGeneratedTemplate(null)
    setFormData({
      name: "",
      description: "",
      type: "",
      metrics: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Create New Report Template</DialogTitle>
              <DialogDescription>Use AI or create manually</DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4 mt-4">
            {!aiGeneratedTemplate ? (
              <form onSubmit={handleGenerateFromAI} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Describe Your Report
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., 'I need a report showing total tax collected this month, broken down by property type, and compared to last month'"
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    disabled={loading}
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Describe what you want to see in the report. Be specific about metrics and groupings.
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Template with AI
                </Button>
              </form>
            ) : (
              <div className="space-y-4 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-2">
                  <h3 className="font-semibold">Generated Template Preview</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <Label className="text-xs font-medium">Name</Label>
                      <p>{aiGeneratedTemplate.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Type</Label>
                      <p className="capitalize">{aiGeneratedTemplate.type}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Description</Label>
                      <p>{aiGeneratedTemplate.description}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Metrics</Label>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {aiGeneratedTemplate.metrics?.map((m: any, i: number) => (
                          <li key={i}>{m.label}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAiGeneratedTemplate(null)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Regenerate
                  </Button>
                  <Button onClick={handleSaveAITemplate} disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Template
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Report Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Monthly Tax Revenue Report"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Report Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type" disabled={loading}>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this report shows"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={3}
                />
              </div>

              {formData.type && (
                <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <Label className="text-xs font-medium">Suggested Metrics</Label>
                  <div className="flex flex-wrap gap-2">
                    {getMetricSuggestions(formData.type).map((metric) => (
                      <button
                        key={metric}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            metrics: formData.metrics ? `${formData.metrics}\n${metric}` : metric,
                          })
                        }
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded hover:bg-blue-50 dark:hover:bg-blue-900 transition"
                      >
                        + {metric}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="metrics">Key Metrics (one per line)</Label>
                <Textarea
                  id="metrics"
                  placeholder="e.g., Total Collected&#10;Pending Amount&#10;Overdue Amount"
                  value={formData.metrics}
                  onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                  disabled={loading}
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Template
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
