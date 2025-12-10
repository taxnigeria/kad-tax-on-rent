"use client"

import { Home, MapPin, Trophy, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/enumerator-dashboard", icon: Home, label: "Home" },
  { href: "/enumerator-dashboard/enumerate", icon: MapPin, label: "Enumerate" },
  { href: "/enumerator-dashboard/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/enumerator-dashboard/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/enumerator-dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("font-medium", isActive && "text-primary")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
