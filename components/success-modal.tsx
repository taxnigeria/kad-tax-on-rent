"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy, Check } from "lucide-react"
import { useState } from "react"

interface SuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  kadirsId?: string
}

export function SuccessModal({ open, onOpenChange, title, description, kadirsId }: SuccessModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (kadirsId) {
      await navigator.clipboard.writeText(kadirsId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        {kadirsId && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-2 text-center">Your KADIRS ID</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-center tracking-wide">{kadirsId}</p>
                <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Keep this ID safe. You'll need it for tax-related transactions.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
