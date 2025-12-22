"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

function getUserInitials(email: string | null, displayName: string | null): string {
  if (displayName) {
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return "U"
}

export function NavUser() {
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || !user) {
    return null
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User"
  const userEmail = user.email || ""
  const userAvatar = user.photo_url || user.photoUrl || "https://cdn-icons-png.flaticon.com/512/2960/2960006.png"
  const userInitials = getUserInitials(user.email, user.displayName)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={userAvatar || "/placeholder.svg"} alt={displayName} />
            <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="text-muted-foreground truncate text-xs">{userEmail}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
