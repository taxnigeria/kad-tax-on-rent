import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

let adminApp: App | null = null
let adminAuth: Auth | null = null
let adminFirestore: Firestore | null = null

function getFirebaseAdmin() {
  if (adminApp && adminAuth && adminFirestore) {
    return { app: adminApp, auth: adminAuth, firestore: adminFirestore }
  }

  // Check if we have the required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[Firebase Admin] Missing credentials - some features will be unavailable")
    return { app: null, auth: null, firestore: null }
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
    adminFirestore = getFirestore(adminApp)
    return { app: adminApp, auth: adminAuth, firestore: adminFirestore }
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error)
    return { app: null, auth: null, firestore: null }
  }
}

export interface FirestoreUserData {
  role: string | null
  displayName: string | null
  phone: string | null
  createdTime: string | null
}

export async function getFirestoreUserData(): Promise<Map<string, FirestoreUserData>> {
  const { firestore } = getFirebaseAdmin()
  const usersMap = new Map<string, FirestoreUserData>()

  if (!firestore) {
    return usersMap
  }

  try {
    const usersSnapshot = await firestore.collection("users").get()
    usersSnapshot.forEach((doc) => {
      const data = doc.data()

      // Display name: display_name OR firstname + lastname
      let displayName: string | null = null
      if (data.display_name) {
        displayName = data.display_name
      } else if (data.firstname || data.lastname) {
        displayName = [data.firstname, data.lastname].filter(Boolean).join(" ")
      }

      // Phone: phone_number OR phoneNumber OR phone
      const phone = data.phone_number || data.phoneNumber || data.phone || null

      // Created: created_time
      const createdTime = data.created_time || null

      usersMap.set(doc.id, {
        role: data.role || null,
        displayName,
        phone,
        createdTime,
      })
    })
    return usersMap
  } catch (error) {
    console.error("[Firebase Admin] Error fetching Firestore users:", error)
    return usersMap
  }
}

export async function getFirestoreUserRoles(): Promise<Map<string, string | null>> {
  const userData = await getFirestoreUserData()
  const rolesMap = new Map<string, string | null>()
  userData.forEach((data, uid) => {
    rolesMap.set(uid, data.role)
  })
  return rolesMap
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
        customClaims: user.customClaims || null,
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
        customClaims: user.customClaims || null,
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
