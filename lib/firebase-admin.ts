import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

let adminApp: App | null = null
let adminAuth: Auth | null = null

function getFirebaseAdmin() {
  if (adminApp && adminAuth) {
    return { app: adminApp, auth: adminAuth }
  }

  // Check if we have the required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[Firebase Admin] Missing credentials - some features will be unavailable")
    return { app: null, auth: null }
  }

  try {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } else {
      adminApp = getApps()[0]
    }
    adminAuth = getAuth(adminApp)
    return { app: adminApp, auth: adminAuth }
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error)
    return { app: null, auth: null }
  }
}

export async function listFirebaseUsers(maxResults = 1000) {
  const { auth } = getFirebaseAdmin()

  if (!auth) {
    return { users: [], error: "Firebase Admin not configured" }
  }

  try {
    const listResult = await auth.listUsers(maxResults)
    return {
      users: listResult.users.map((user) => ({
        uid: user.uid,
        email: user.email || null,
        emailVerified: user.emailVerified,
        displayName: user.displayName || null,
        phoneNumber: user.phoneNumber || null,
        photoURL: user.photoURL || null,
        disabled: user.disabled,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
        providerData: user.providerData,
      })),
      error: null,
    }
  } catch (error) {
    console.error("[Firebase Admin] Error listing users:", error)
    return { users: [], error: "Failed to list Firebase users" }
  }
}

export async function getFirebaseUser(uid: string) {
  const { auth } = getFirebaseAdmin()

  if (!auth) {
    return { user: null, error: "Firebase Admin not configured" }
  }

  try {
    const user = await auth.getUser(uid)
    return {
      user: {
        uid: user.uid,
        email: user.email || null,
        emailVerified: user.emailVerified,
        displayName: user.displayName || null,
        phoneNumber: user.phoneNumber || null,
        photoURL: user.photoURL || null,
        disabled: user.disabled,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      },
      error: null,
    }
  } catch (error) {
    console.error("[Firebase Admin] Error getting user:", error)
    return { user: null, error: "Failed to get Firebase user" }
  }
}

export async function deleteFirebaseUser(uid: string) {
  const { auth } = getFirebaseAdmin()

  if (!auth) {
    return { success: false, error: "Firebase Admin not configured" }
  }

  try {
    await auth.deleteUser(uid)
    return { success: true, error: null }
  } catch (error) {
    console.error("[Firebase Admin] Error deleting user:", error)
    return { success: false, error: "Failed to delete Firebase user" }
  }
}
