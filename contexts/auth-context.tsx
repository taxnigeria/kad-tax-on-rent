"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { onAuthStateChange, logout } from "@/lib/auth"
import { getUserRole } from "@/app/actions/get-user-role"

export interface PendingGoogleUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  userRole: string | null
  loading: boolean
  logout: () => Promise<void>
  pendingGoogleUser: PendingGoogleUser | null
  setPendingGoogleUser: (user: PendingGoogleUser | null) => void
  confirmGoogleRole: (role: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingGoogleUser, setPendingGoogleUser] = useState<PendingGoogleUser | null>(null)
  const prevUserIdRef = useRef<string | null>(null)

  const confirmGoogleRole = async (role: string) => {
    if (!pendingGoogleUser || !user) return

    try {
      const { createUserInDatabase } = await import("@/app/actions/auth")
      const { success, error } = await createUserInDatabase({
        authId: user.id,
        email: pendingGoogleUser.email,
        firstName: pendingGoogleUser.firstName,
        lastName: pendingGoogleUser.lastName,
        phoneNumber: "",
        role: role,
        emailVerified: pendingGoogleUser.emailVerified,
        profilePhotoUrl: pendingGoogleUser.avatarUrl,
      })

      if (success) {
        setUserRole(role)
        setPendingGoogleUser(null)
      }
    } catch (error) {
      console.error("[v0] Error confirming Google role:", error)
    }
  }

  useEffect(() => {
    let isMounted = true

    console.log("[v0] Auth provider mounting, setting up listener")

    const unsubscribe = onAuthStateChange(async (supabaseUser) => {
      console.log("[v0] Auth state changed, user:", supabaseUser?.id)

      if (!isMounted) {
        console.log("[v0] Component unmounted, ignoring auth state change")
        return
      }

      // Only process if user ID actually changed
      if (supabaseUser?.id === prevUserIdRef.current) {
        console.log("[v0] User ID unchanged, skipping")
        return
      }

      console.log("[v0] Processing user change from", prevUserIdRef.current, "to", supabaseUser?.id)
      prevUserIdRef.current = supabaseUser?.id || null
      setUser(supabaseUser)

      // Fetch role only when user changes
      if (supabaseUser?.id) {
        try {
          console.log("[v0] Fetching role for user:", supabaseUser.id)
          const role = await getUserRole(supabaseUser.id)
          console.log("[v0] Got role:", role)

          if (!role) {
            console.log("[v0] No role found - this is a new user, setting pendingGoogleUser")
            setPendingGoogleUser({
              id: supabaseUser.id,
              email: supabaseUser.email || "",
              firstName: supabaseUser.user_metadata?.first_name || supabaseUser.email?.split("@")[0] || "",
              lastName: supabaseUser.user_metadata?.last_name || "",
              avatarUrl: supabaseUser.user_metadata?.avatar_url,
              emailVerified: supabaseUser.email_confirmed_at ? true : false,
            })
          }

          if (isMounted) {
            setUserRole(role)
          }
        } catch (error) {
          console.error("[v0] Error fetching user role:", error)
          if (isMounted) {
            setUserRole(null)
          }
        }
      } else {
        console.log("[v0] No user, clearing role")
        if (isMounted) {
          setUserRole(null)
        }
      }

      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      console.log("[v0] Auth provider unmounting")
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        logout,
        pendingGoogleUser,
        setPendingGoogleUser,
        confirmGoogleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
