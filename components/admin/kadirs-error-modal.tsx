"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info } from "lucide-react"

interface KadirsErrorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  error: {
    error_category?: string
    severity?: "low" | "medium" | "high" | "critical"
    human_friendly_error_message?: string
    recommended_actions?: Array<{
      step: string
      description: string
    }>
    developer_notes?: string
  } | null
}

const severityConfig = {
  low: { color: "bg-blue-50 border-blue-200 text-blue-900", icon: "text-blue-600" },
  medium: { color: "bg-yellow-50 border-yellow-200 text-yellow-900", icon: "text-yellow-600" },
  high: { color: "bg-orange-50 border-orange-200 text-orange-900", icon: "text-orange-600" },
  critical: { color: "bg-red-50 border-red-200 text-red-900", icon: "text-red-600" },
}

export function KadirsErrorModal({ open, onOpenChange, error }: KadirsErrorModalProps) {
  if (!error) return null

  const severity = error.severity || "high"
  const config = severityConfig[severity]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${config.icon}`} />
            <DialogTitle>KADIRS Generation Error</DialogTitle>
          </div>
          <DialogDescription>An error occurred while generating your KADIRS ID</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Main Error Message */}
          <div className={`rounded-lg border p-4 ${config.color}`}>
            <p className="font-medium mb-2">Error Details</p>
            <p className="text-sm">{error.human_friendly_error_message || "An unexpected error occurred"}</p>
            {error.error_category && <p className="text-xs mt-2 opacity-75">Category: {error.error_category}</p>}
          </div>

          {/* Recommended Actions */}
          {error.recommended_actions && error.recommended_actions.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium text-sm">Recommended Actions:</p>
              <ol className="space-y-2">
                {error.recommended_actions.map((action, index) => (
                  <li key={index} className="text-sm">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 font-medium text-gray-600 w-5">{index + 1}.</span>
                      <div>
                        <p className="font-medium text-gray-900">{action.step}</p>
                        <p className="text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Developer Notes */}
          {error.developer_notes && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-gray-600 flex items-center gap-2 hover:text-gray-900">
                <Info className="h-4 w-4" />
                Technical Details
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32 text-gray-700">
                {error.developer_notes}
              </pre>
            </details>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
