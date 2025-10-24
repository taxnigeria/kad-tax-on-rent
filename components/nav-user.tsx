"use client"

import { IconCreditCard, IconDotsVertical, IconLogout, IconNotification, IconUserCircle } from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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
  const { isMobile } = useSidebar()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleOpenMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        left: isMobile ? rect.left : rect.right + 8,
      })
    }
    setShowUserMenu(true)
  }

  if (!isMounted || !user) {
    return null
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User"
  const userEmail = user.email || ""
  const userAvatar = user.photo_url || user.photoUrl || "https://cdn-icons-png.flaticon.com/512/2960/2960006.png"

  const userInitials = getUserInitials(user.email, user.displayName)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            ref={triggerRef}
            size="lg"
            onClick={handleOpenMenu}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              <AvatarImage src={userAvatar || "/placeholder.svg"} alt={displayName} />
              <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="text-muted-foreground truncate text-xs">{userEmail}</span>
            </div>
            <IconDotsVertical className="ml-auto size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={showUserMenu} onOpenChange={setShowUserMenu}>
        <DialogContent
          className="w-56 p-0 gap-0"
          style={{
            position: "fixed",
            top: `${menuPosition.top}px`,
            left: isMobile ? `${menuPosition.left}px` : "auto",
            right: isMobile ? "auto" : "16px",
            transform: "none",
            margin: 0,
          }}
          hideCloseButton
        >
          <div className="p-2">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userAvatar || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">{userEmail}</span>
              </div>
            </div>
          </div>
          <Separator />
          <div className="p-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 py-1.5 h-auto font-normal"
              onClick={() => setShowUserMenu(false)}
            >
              <IconUserCircle className="size-4" />
              Account
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 py-1.5 h-auto font-normal"
              onClick={() => setShowUserMenu(false)}
            >
              <IconCreditCard className="size-4" />
              Billing
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 py-1.5 h-auto font-normal"
              onClick={() => setShowUserMenu(false)}
            >
              <IconNotification className="size-4" />
              Notifications
            </Button>
          </div>
          <Separator />
          <div className="p-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 py-1.5 h-auto font-normal text-destructive hover:text-destructive"
              onClick={() => {
                setShowUserMenu(false)
                setShowLogoutDialog(true)
              }}
            >
              <IconLogout className="size-4" />
              Log out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page and will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
