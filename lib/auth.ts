import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "./firebase"
import { createUserInDatabase } from "@/app/actions/auth"
import { getFirebaseErrorMessage } from "./firebase-errors"

export async function signIn(email: string, password: string, rememberMe = false) {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: getFirebaseErrorMessage(error) }
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: getFirebaseErrorMessage(error) }
  }
}

export { signOut as logout }

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error: any) {
    return { error: getFirebaseErrorMessage(error) }
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

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
    const user = userCredential.user

    console.log("[v0] Auth user created:", user.uid)

    // Update Firebase profile with display name
    await updateProfile(user, {
      displayName: `${data.firstName} ${data.lastName}`,
    })

    const result = await createUserInDatabase({
      firebaseUid: user.uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      role: data.role || "taxpayer",
      emailVerified: user.emailVerified,
    })

    if (!result.success) {
      console.error("[v0] Insert error:", result.error)
      throw new Error(result.error)
    }

    console.log("[v0] User successfully synced to database")
    return { user, error: null }
  } catch (error: any) {
    console.error("[v0] Signup error:", error.message)
    return { user: null, error: getFirebaseErrorMessage(error) }
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: getFirebaseErrorMessage(error) }
  }
}
