"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { onAuthStateChange, logout } from "@/lib/auth"
import { getUserRole } from "@/app/actions/get-user-role"

interface AuthContextType {
  user: User | null
  userRole: string | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const prevUserIdRef = useRef<string | null>(null)

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

  return <AuthContext.Provider value={{ user, userRole, loading, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
