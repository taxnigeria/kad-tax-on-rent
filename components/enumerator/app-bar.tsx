"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define main pages that should NOT show back button
const mainPages = [
  "/enumerator-dashboard",
  "/enumerator-dashboard/enumerate",
  "/enumerator-dashboard/leaderboard",
  "/enumerator-dashboard/profile",
]

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/enumerator-dashboard": "Home",
  "/enumerator-dashboard/enumerate": "Enumerate",
  "/enumerator-dashboard/leaderboard": "Leaderboard",
  "/enumerator-dashboard/profile": "Profile",
  "/enumerator-dashboard/enumerate/property": "Add Property",
  "/enumerator-dashboard/enumerate/taxpayer": "Add Taxpayer",
}

export function AppBar() {
  const pathname = usePathname()
  const router = useRouter()

  // Check if current page is a main page (no back button needed)
  const isMainPage = mainPages.includes(pathname)

  // Get page title
  const title = pageTitles[pathname] || "Back"

  // Don't show on desktop
  return (
    <header className="sticky top-0 z-40 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center h-14 px-4">
        {!isMainPage && (
          <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="font-semibold text-lg">{title}</h1>
      </div>
    </header>
  )
}
