"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X, Share, Plus } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(standalone)

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)

      // Check if user has dismissed before
      const dismissed = localStorage.getItem("pwa-prompt-dismissed")
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // Show iOS prompt if not dismissed
    if (ios && !standalone) {
      const dismissed = localStorage.getItem("pwa-prompt-dismissed")
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2000)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === "accepted") {
      setShowPrompt(false)
    }
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", "true")
    setShowPrompt(false)
  }

  // Don't show if already installed or dismissed
  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 md:hidden">
      <Card className="w-full max-w-md animate-in slide-in-from-bottom duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Install App</CardTitle>
                <CardDescription>Add to your home screen</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Install this app on your iPhone for quick access:</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                  <Share className="h-4 w-4" />
                </span>
                <span>Tap the Share button</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                  <Plus className="h-4 w-4" />
                </span>
                <span>Select "Add to Home Screen"</span>
              </div>
              <Button variant="outline" className="w-full mt-2 bg-transparent" onClick={handleDismiss}>
                Got it
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install the KADIRS Enumerator app for faster access and offline support.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDismiss}>
                  Not Now
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleInstall}>
                  <Download className="mr-2 h-4 w-4" />
                  Install
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
