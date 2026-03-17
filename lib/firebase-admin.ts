let adminApp: any = null
let adminAuth: any = null
let adminFirestore: any = null
let firebaseAdminAvailable = true
let initializationAttempted = false

// For legacy code that expects a 'db' or 'auth' object at the module level
export let db: any = null
export let auth: any = null

export async function getFirebaseAdmin() {
  if (adminApp && adminAuth && adminFirestore) {
    db = adminFirestore
    auth = adminAuth
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

  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.warn("[Firebase Admin] Missing required environment variables")
    firebaseAdminAvailable = false
    return { app: null, auth: null, firestore: null }
  }

  let privateKey = privateKeyRaw.replace(/\\n/g, "\n")

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
    
    // Set exported variables
    db = adminFirestore
    auth = adminAuth
    
    return { app: adminApp, auth: adminAuth, firestore: adminFirestore }
  } catch (error: any) {
    console.error("[Firebase Admin] Failed to initialize:", error?.message || error)
    firebaseAdminAvailable = false
    return { app: null, auth: null, firestore: null }
  }
}

// Helper to get initialize if needed and return firestore
export async function getDb() {
  const { firestore } = await getFirebaseAdmin()
  return firestore
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

export interface MergedFirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  disabled: boolean;
  kadirs_id: string | null;
  role: string | null;
  address: string | null;
  enumerator: string | null;
  properties: any[] | null;
  customClaims: { [key: string]: any } | null;
  creationTime: string;
  lastSignInTime: string;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

export async function listFirebaseUsers(
  maxResults = 20, 
  pageToken?: string, 
  searchQuery?: string,
  sortField: string = 'displayName',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  if (!firebaseAdminAvailable) {
    return { users: [], error: "Firebase Admin not available in this environment" }
  }

  const { auth, firestore } = await getFirebaseAdmin()

  if (!auth || !firestore) {
    return { users: [], error: "Firebase Admin not configured" }
  }

  try {
    let mergedUsers: MergedFirebaseUser[] = []
    let nextPageToken: string | undefined = undefined

    if (searchQuery) {
      // If searching, we search Firestore 'users' collection first as it supports prefix search better
      // than Auth listUsers (which doesn't support prefix search)
      const firestoreUsersSnapshot = await firestore.collection('users')
        .orderBy('display_name')
        .startAt(searchQuery)
        .endAt(searchQuery + "\uf8ff")
        .limit(maxResults)
        .get()

      const uids = firestoreUsersSnapshot.docs.map((doc: any) => doc.id)
      
      if (uids.length > 0) {
        // Fetch auth records for these UIDs
        const getUsersResult = await auth.getUsers(uids.map((uid: string) => ({ uid })))
        const authMap = new Map(getUsersResult.users.map((u: any) => [u.uid, u]))

        mergedUsers = firestoreUsersSnapshot.docs.map((doc: any) => {
          const dbUser = doc.data()
          const user = authMap.get(doc.id) || ({} as any)
          
          let displayName: string | null = user.displayName || dbUser.display_name || null
          if (!displayName && (dbUser.firstname || dbUser.lastname)) {
            displayName = [dbUser.firstname, dbUser.lastname].filter(Boolean).join(" ")
          }

          return {
            uid: doc.id,
            email: user.email || dbUser.email || null,
            emailVerified: user.emailVerified || false,
            displayName: displayName,
            phoneNumber: user.phoneNumber || dbUser.phoneNumber || dbUser.phone_number || dbUser.phone || null,
            photoURL: user.photoURL || dbUser.photoURL || null,
            disabled: user.disabled || false,
            kadirs_id: dbUser.kadirs_id || null,
            role: dbUser.role || null,
            address: dbUser.address || null,
            enumerator: dbUser.enumerator || null,
            properties: dbUser.properties || null,
            customClaims: user.customClaims || null,
            creationTime: user.metadata?.creationTime || dbUser.created_time || null,
            lastSignInTime: user.metadata?.lastSignInTime || null,
            metadata: {
              creationTime: user.metadata?.creationTime || dbUser.created_time || null,
              lastSignInTime: user.metadata?.lastSignInTime || null,
            },
          }
        })
      }
    } else {
      // If no search query, we can try to list primarily from Firestore to support sorting.
      // However, to ensure we get all Auth users, we'll check if we should list via Auth or Firestore.
      // For legacy data, usually the Firestore 'users' collection is the source of truth for display data.
      
      let uids: string[] = []
      let firestoreUsers: any[] = []
      
      // Map sortField to Firestore field
      const fsSortField = sortField === 'displayName' ? 'display_name' : 
                          sortField === 'creationTime' ? 'created_time' : 
                          sortField === 'kadirs_id' ? 'kadirs_id' : 
                          sortField === 'tin' ? 'tin' :
                          sortField === 'user_type' ? 'user_type' :
                          sortField === 'email' ? 'email' : sortField
      
      const firestoreQuery = firestore.collection('users')
        .orderBy(fsSortField, sortOrder)
        .limit(maxResults)
      
      // If we had a pageToken (for Firestore), we'd use it here, but Auth tokens aren't compatible.
      // For now, simple limit. If pagination is needed for large lists without search, we'll need a different token strategy.
      
      const firestoreUsersSnapshot = await firestoreQuery.get()
      firestoreUsers = firestoreUsersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      uids = firestoreUsers.map(u => u.id)
      
      // Fetch auth records for these UIDs to get email/phone status
      const authMap = new Map()
      if (uids.length > 0) {
        try {
          const getUsersResult = await auth.getUsers(uids.map(uid => ({ uid })))
          getUsersResult.users.forEach((u: any) => authMap.set(u.uid, u))
        } catch (e) {
          console.warn("Error fetching auth records for Firestore users:", e)
        }
      }

      mergedUsers = firestoreUsers.map((dbUser: any) => {
        const user = authMap.get(dbUser.id) || ({} as any)
        
        let displayName: string | null = dbUser.display_name || user.displayName || null
        if (!displayName && (dbUser.firstname || dbUser.lastname)) {
          displayName = [dbUser.firstname, dbUser.lastname].filter(Boolean).join(" ")
        }

        return {
          uid: dbUser.id,
          email: dbUser.email || user.email || null,
          emailVerified: user.emailVerified || false,
          displayName: displayName,
          phoneNumber: dbUser.phone_number || dbUser.phoneNumber || dbUser.phone || user.phoneNumber || null,
          photoURL: dbUser.photoURL || user.photoURL || null,
          disabled: user.disabled || false,
          kadirs_id: dbUser.kadirs_id || dbUser.kadirsId || null,
          role: dbUser.role || null,
          address: dbUser.address || null,
          enumerator: dbUser.enumerator || null,
          properties: dbUser.properties || null,
          tin: dbUser.tin || dbUser.taxpayer_id || null,
          user_type: dbUser.user_type || dbUser.userType || dbUser.category || null,
          customClaims: user.customClaims || null,
          creationTime: dbUser.created_time || user.metadata?.creationTime || null,
          lastSignInTime: user.metadata?.lastSignInTime || null,
          metadata: {
            creationTime: dbUser.created_time || user.metadata?.creationTime || null,
            lastSignInTime: user.metadata?.lastSignInTime || null,
          },
        }
      })
      
      // Only if we didn't get results from Firestore, fallback to Auth listUsers
      if (mergedUsers.length === 0) {
        const listUsersResult = await auth.listUsers(maxResults, pageToken)
        nextPageToken = listUsersResult.pageToken
        
        const listUids = listUsersResult.users.map((u: any) => u.uid)
        const fsData: Record<string, any> = {}
        if (listUids.length > 0) {
          const snapshot = await firestore.collection('users').where('__name__', 'in', listUids).get()
          snapshot.docs.forEach((doc: any) => fsData[doc.id] = doc.data())
        }

        mergedUsers = listUsersResult.users.map((user: any) => {
          const dbUser = fsData[user.uid] || {}
          let displayName = user.displayName || dbUser.display_name || null
          if (!displayName && (dbUser.firstname || dbUser.lastname)) {
            displayName = [dbUser.firstname, dbUser.lastname].filter(Boolean).join(" ")
          }

          return {
            uid: user.uid,
            email: user.email || dbUser.email || null,
            emailVerified: user.emailVerified,
            displayName: displayName,
            phoneNumber: user.phoneNumber || dbUser.phoneNumber || dbUser.phone_number || dbUser.phone || null,
            photoURL: user.photoURL || dbUser.photoURL || null,
            disabled: user.disabled,
            kadirs_id: dbUser.kadirs_id || dbUser.kadirsId || null,
            role: dbUser.role || null,
            address: dbUser.address || null,
            enumerator: dbUser.enumerator || null,
            properties: dbUser.properties || null,
            tin: dbUser.tin || dbUser.taxpayer_id || null,
            user_type: dbUser.user_type || dbUser.userType || dbUser.category || null,
            customClaims: user.customClaims || null,
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
            metadata: {
              creationTime: user.metadata.creationTime,
              lastSignInTime: user.metadata.lastSignInTime,
            },
          }
        })
      }
    }

    return { users: mergedUsers, nextPageToken, error: null }
  } catch (error) {
    console.error("[Firebase Admin] Error listing users:", error)
    return { users: [], error: "Failed to list Firebase users" }
  }
}

export async function getFirebaseUser(uid: string) {
  if (!firebaseAdminAvailable) {
    return { user: null, error: "Firebase Admin not available in this environment" }
  }

  const { auth, firestore } = await getFirebaseAdmin()

  if (!auth || !firestore) {
    return { user: null, error: "Firebase Admin not configured" }
  }

  try {
    const user = await auth.getUser(uid)
    const dbUserDoc = await firestore.collection('users').doc(uid).get()
    const dbUser = dbUserDoc.exists ? dbUserDoc.data() || {} : {}

    // Combine display name logic
    let displayName: string | null = user.displayName || null
    if (!displayName && (dbUser.display_name || dbUser.firstname || dbUser.lastname)) {
      if (dbUser.display_name) {
        displayName = dbUser.display_name
      } else if (dbUser.firstname || dbUser.lastname) {
        displayName = [dbUser.firstname, dbUser.lastname].filter(Boolean).join(" ")
      }
    }

    return {
      user: {
        uid: user.uid,
        email: user.email || dbUser.email || null,
        emailVerified: user.emailVerified,
        displayName: displayName,
        phoneNumber: user.phoneNumber || dbUser.phoneNumber || dbUser.phone_number || dbUser.phone || null,
        photoURL: user.photoURL || dbUser.photoURL || null,
        disabled: user.disabled,
        kadirs_id: dbUser.kadirs_id || null,
        role: dbUser.role || null,
        address: dbUser.address || null,
        enumerator: dbUser.enumerator || null,
        properties: dbUser.properties || null,
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

export async function getLegacyEnumerations(
  lastDocId?: string, 
  pageSize: number = 20, 
  sortField: string = 'date_created', 
  sortOrder: 'asc' | 'desc' = 'desc',
  filterField?: string,
  filterValue?: any,
  searchQuery?: string
) {
  if (!firebaseAdminAvailable) {
    return { enumerations: [], error: "Firebase Admin not available" }
  }

  const { firestore } = await getFirebaseAdmin()
  if (!firestore) {
    return { enumerations: [], error: "Firebase Admin not configured" }
  }

  try {
    let query: any = firestore.collection("enumerations")

    if (filterField && filterValue !== undefined) {
      query = query.where(filterField, "==", filterValue)
    }

    if (searchQuery) {
      // Prefix search requires ordering by the search field
      query = query.orderBy("registered_property_name")
        .startAt(searchQuery)
        .endAt(searchQuery + "\uf8ff")
    } else {
      query = query.orderBy(sortField, sortOrder)
    }

    if (lastDocId) {
      const lastDoc = await firestore.collection("enumerations").doc(lastDocId).get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      } else {
        console.warn(`[Firebase Admin] lastDocId '${lastDocId}' not found for enumerations. Fetching from start.`)
      }
    }

    const snapshot = await query.limit(pageSize).get()
    const enumerations = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))
    return { enumerations, error: null }
  } catch (error: any) {
    console.error("[Firebase Admin] Error fetching legacy enumerations:", error)
    return { enumerations: [], error: error.message }
  }
}

export async function getLegacyInvoices(
  lastDocId?: string, 
  pageSize: number = 20, 
  sortField: string = 'dateCreated', 
  sortOrder: 'asc' | 'desc' = 'desc',
  filterField?: string,
  filterValue?: any,
  searchQuery?: string
) {
  if (!firebaseAdminAvailable) {
    return { invoices: [], error: "Firebase Admin not available" }
  }

  const { firestore } = await getFirebaseAdmin()
  if (!firestore) {
    return { invoices: [], error: "Firebase Admin not configured" }
  }

  try {
    let query: any = firestore.collection("invoice_bills")

    if (filterField && filterValue !== undefined) {
      query = query.where(filterField, "==", filterValue)
    }

    if (searchQuery) {
      // Search by billReference prefix
      query = query.orderBy("billReference")
        .startAt(searchQuery)
        .endAt(searchQuery + "\uf8ff")
    } else {
      query = query.orderBy(sortField, sortOrder)
    }

    if (lastDocId) {
      const lastDoc = await firestore.collection("invoice_bills").doc(lastDocId).get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      } else {
        console.warn(`[Firebase Admin] lastDocId '${lastDocId}' not found for invoices. Fetching from start.`)
      }
    }

    const snapshot = await query.limit(pageSize).get()
    const invoices = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))
    return { invoices, error: null }
  } catch (error: any) {
    console.error("[Firebase Admin] Error fetching legacy invoices:", error)
    return { invoices: [], error: error.message }
  }
}
