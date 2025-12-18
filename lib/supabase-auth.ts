import type { Session, User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { createUserInDatabase } from "@/app/actions/auth"

// Get Supabase client
function getSupabase() {
  return createClient()
}

export async function signIn(email: string, password: string, rememberMe = false) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message || "Failed to sign in" }
  }
}

export async function logout() {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error: any) {
    return { error: error.message || "Failed to sign out" }
  }
}

export async function resetPassword(email: string) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error: any) {
    return { error: error.message || "Failed to reset password" }
  }
}

export async function signUp(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber: string
  role?: string
}) {
  try {
    console.log("[v0] Starting signup process...")

    const supabase = getSupabase()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      },
    })

    if (authError) {
      return { user: null, error: authError.message }
    }

    console.log("[v0] Auth user created:", authData.user?.id)

    // Create user in database
    if (authData.user) {
      const result = await createUserInDatabase({
        firebaseUid: authData.user.id, // Supabase UUID is used as firebaseUid
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role || "taxpayer",
        emailVerified: authData.user.email_confirmed_at ? true : false,
      })

      if (!result.success) {
        console.error("[v0] Insert error:", result.error)
        throw new Error(result.error)
      }

      console.log("[v0] User successfully synced to database")
    }

    return { user: authData.user, error: null }
  } catch (error: any) {
    console.error("[v0] Signup error:", error.message)
    return { user: null, error: error.message || "Failed to sign up" }
  }
}

export async function signInWithGoogle() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      },
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: null, error: null } // OAuth returns null user on initial call
  } catch (error: any) {
    return { user: null, error: error.message || "Failed to sign in with Google" }
  }
}

let currentSession: Session | null = null
let authStateListeners: ((user: User | null) => void)[] = []
let supabaseUnsubscribe: (() => void) | null = null

export function onAuthStateChange(callback: (user: User | null) => void) {
  // Add callback to listeners
  authStateListeners.push(callback)

  if (!supabaseUnsubscribe) {
    const supabase = getSupabase()

    // First, get the current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[v0] Initial session check:", session?.user?.id)
      if (session?.user?.id !== currentSession?.user?.id) {
        currentSession = session
        // Notify all current listeners with the existing session
        authStateListeners.forEach((listener) => {
          listener(session?.user || null)
        })
      }
    })

    // Then set up the real-time listener for future changes
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.id)
      if (session?.user?.id !== currentSession?.user?.id) {
        currentSession = session

        // Notify all listeners
        authStateListeners.forEach((listener) => {
          listener(session?.user || null)
        })
      }
    })

    supabaseUnsubscribe = subscription.data?.subscription?.unsubscribe || (() => {})
  }

  // Return unsubscribe function for this listener
  return () => {
    authStateListeners = authStateListeners.filter((listener) => listener !== callback)

    // Only unsubscribe from Supabase when no more listeners exist
    if (authStateListeners.length === 0 && typeof supabaseUnsubscribe === "function") {
      supabaseUnsubscribe()
      supabaseUnsubscribe = null
      currentSession = null
    }
  }
}
