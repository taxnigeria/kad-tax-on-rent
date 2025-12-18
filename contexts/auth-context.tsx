"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { onAuthStateChange, logout } from "@/lib/supabase-auth"
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

    const unsubscribe = onAuthStateChange(async (supabaseUser) => {
      if (!isMounted) return

      if (supabaseUser?.id === prevUserIdRef.current) {
        return
      }

      prevUserIdRef.current = supabaseUser?.id || null
      setUser(supabaseUser)

      // Fetch role only when user changes
      if (supabaseUser) {
        try {
          const role = await getUserRole(supabaseUser.id)
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
        if (isMounted) {
          setUserRole(null)
        }
      }

      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
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
