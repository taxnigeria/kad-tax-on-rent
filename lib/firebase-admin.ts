let adminApp: any = null
let adminAuth: any = null
let adminFirestore: any = null
let firebaseAdminAvailable = true
let initializationAttempted = false

async function getFirebaseAdmin() {
  if (adminApp && adminAuth && adminFirestore) {
    return { app: adminApp, auth: adminAuth, firestore: adminFirestore }
  }

  if (initializationAttempted && !firebaseAdminAvailable) {
    return { app: null, auth: null, firestore: null }
  }

  initializationAttempted = true

  if (typeof window !== "undefined") {
    console.warn("[Firebase Admin] Cannot run in browser environment")
    firebaseAdminAvailable = false
    return { app: null, auth: null, firestore: null }
  }

  // Check if we have the required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY

  console.log("[Firebase Admin] Environment check:", {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKeyRaw,
    projectIdType: typeof projectId,
    clientEmailType: typeof clientEmail,
    privateKeyType: typeof privateKeyRaw,
  })

  if (!projectId || typeof projectId !== "string") {
    console.warn("[Firebase Admin] Missing or invalid NEXT_PUBLIC_FIREBASE_PROJECT_ID")
    firebaseAdminAvailable = false
    return { app: null, auth: null, firestore: null }
  }

  if (!clientEmail || typeof clientEmail !== "string") {
    console.warn("[Firebase Admin] Missing or invalid FIREBASE_CLIENT_EMAIL")
    firebaseAdminAvailable = false
    return { app: null, auth: null, firestore: null }
  }

  if (!privateKeyRaw || typeof privateKeyRaw !== "string") {
    console.warn("[Firebase Admin] Missing or invalid FIREBASE_PRIVATE_KEY")
    firebaseAdminAvailable = false
    return { app: null, auth: null, firestore: null }
  }

  let privateKey = privateKeyRaw
  try {
    // If it looks like JSON, try to parse it
    if (privateKeyRaw.startsWith("{") || privateKeyRaw.startsWith('"')) {
      privateKey = JSON.parse(privateKeyRaw)
    }
    // Convert escaped newlines to actual newlines
    if (typeof privateKey === "string") {
      privateKey = privateKey.replace(/\\n/g, "\n")
    }
  } catch {
    // If JSON parsing fails, just use the raw value with newline replacement
    privateKey = privateKeyRaw.replace(/\\n/g, "\n")
  }

  if (typeof privateKey !== "string") {
    console.warn("[Firebase Admin] FIREBASE_PRIVATE_KEY is not a valid string")
    firebaseAdminAvailable = false
    return { app: null, auth: null, firestore: null }
  }

  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app")
    const { getAuth } = await import("firebase-admin/auth")
    const { getFirestore } = await import("firebase-admin/firestore")

    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: projectId.trim(),
          clientEmail: clientEmail.trim(),
          privateKey: privateKey.trim(),
        }),
      })
    } else {
      adminApp = getApps()[0]
    }
    adminAuth = getAuth(adminApp)
    adminFirestore = getFirestore(adminApp)
    return { app: adminApp, auth: adminAuth, firestore: adminFirestore }
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || "Unknown error"
    console.error("[Firebase Admin] Failed to initialize:", errorMessage)
    firebaseAdminAvailable = false
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
  const usersMap = new Map<string, FirestoreUserData>()

  if (!firebaseAdminAvailable) {
    return usersMap
  }

  const { firestore } = await getFirebaseAdmin()

  if (!firestore) {
    return usersMap
  }

  try {
    const usersSnapshot = await firestore.collection("users").get()
    usersSnapshot.forEach((doc: any) => {
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
  if (!firebaseAdminAvailable) {
    return { users: [], error: "Firebase Admin not available in this environment" }
  }

  const { auth } = await getFirebaseAdmin()

  if (!auth) {
    return { users: [], error: "Firebase Admin not configured" }
  }

  try {
    const listResult = await auth.listUsers(maxResults)
    return {
      users: listResult.users.map((user: any) => ({
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
      })),
      error: null,
    }
  } catch (error) {
    console.error("[Firebase Admin] Error listing users:", error)
    return { users: [], error: "Failed to list Firebase users" }
  }
}

export async function getFirebaseUser(uid: string) {
  if (!firebaseAdminAvailable) {
    return { user: null, error: "Firebase Admin not available in this environment" }
  }

  const { auth } = await getFirebaseAdmin()

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

export async function checkFirebaseUserExists(email?: string | null, phoneNumber?: string | null) {
  if (!firebaseAdminAvailable) {
    return { exists: false, error: "Firebase Admin not available" }
  }

  const { auth } = await getFirebaseAdmin()

  if (!auth) {
    return { exists: false, error: "Firebase Admin not configured" }
  }

  try {
    if (email) {
      try {
        await auth.getUserByEmail(email)
        return { exists: true, provider: "email" }
      } catch (error: any) {
        if (error.code !== "auth/user-not-found") throw error
      }
    }

    if (phoneNumber) {
      try {
        await auth.getUserByPhoneNumber(phoneNumber)
        return { exists: true, provider: "phone" }
      } catch (error: any) {
        if (error.code !== "auth/user-not-found") throw error
      }
    }

    return { exists: false }
  } catch (error: any) {
    console.error("[Firebase Admin] Error checking user existence:", error)
    return { exists: false, error: error.message }
  }
}

export async function updateFirebaseUser(uid: string, data: {
  emailVerified?: boolean
  phoneNumber?: string
  disabled?: boolean
  displayName?: string
}) {
  if (!firebaseAdminAvailable) {
    return { success: false, error: "Firebase Admin not available" }
  }

  const { auth } = await getFirebaseAdmin()

  if (!auth) {
    return { success: false, error: "Firebase Admin not configured" }
  }

  try {
    const userRecord = await auth.updateUser(uid, data)
    return { success: true, uid: userRecord.uid }
  } catch (error: any) {
    console.error("[Firebase Admin] Error updating user:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteFirebaseUser(uid: string) {
  if (!firebaseAdminAvailable) {
    return { success: false, error: "Firebase Admin not available in this environment" }
  }

  const { auth } = await getFirebaseAdmin()

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

export async function createFirebaseUser(email: string, password: string, displayName: string) {
  console.log("[v0] createFirebaseUser called with:", { email, displayName })

  if (!firebaseAdminAvailable) {
    console.error("[Firebase Admin] Not available - check environment variables")
    return { success: false, error: "Firebase Admin not available - check server logs", uid: null }
  }

  const { auth } = await getFirebaseAdmin()

  if (!auth) {
    console.error("[Firebase Admin] Not configured - environment variables may be missing")
    return { success: false, error: "Firebase Admin not configured - check environment variables", uid: null }
  }

  try {
    console.log("[v0] Attempting to create Firebase user...")
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    })

    console.log("[v0] Firebase user created successfully:", userRecord.uid)
    return { success: true, uid: userRecord.uid, error: null }
  } catch (error: any) {
    console.error("[Firebase Admin] Error creating user:", error)
    return { success: false, uid: null, error: error.message || "Failed to create Firebase user" }
  }
}

export async function sendPasswordResetEmail(email: string) {
  console.log("[v0] sendPasswordResetEmail called for:", email)

  if (!firebaseAdminAvailable) {
    console.error("[Firebase Admin] Not available - check environment variables")
    return { success: false, error: "Firebase Admin not available" }
  }

  const { auth } = await getFirebaseAdmin()

  if (!auth) {
    console.error("[Firebase Admin] Not configured")
    return { success: false, error: "Firebase Admin not configured" }
  }

  try {
    console.log("[v0] Generating password reset link...")
    const link = await auth.generatePasswordResetLink(email)
    console.log("[v0] Password reset link generated successfully")

    // TODO: Send this link via your email service (n8n webhook, Nodemailer, etc.)
    // For now, we'll return the link so it can be sent via n8n
    return { success: true, resetLink: link, error: null }
  } catch (error: any) {
    console.error("[Firebase Admin] Error generating password reset link:", error)
    return { success: false, error: error.message || "Failed to generate password reset link", resetLink: null }
  }
}
