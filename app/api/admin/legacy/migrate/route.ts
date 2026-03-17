import { NextRequest, NextResponse } from "next/server"
import { db, getFirebaseAdmin } from "@/lib/firebase-admin"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(req: NextRequest) {
  try {
    const { type, ids } = await req.json()

    // Initialize Firebase Admin
    const { firestore } = await getFirebaseAdmin()
    if (!firestore) {
      return NextResponse.json({ error: "Firebase Admin failed to initialize" }, { status: 500 })
    }

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
    }

    let successCount = 0
    const errors: any[] = []

    if (type === "taxpayers") {
      try {
        // 1. Fetch all users from Firebase
        const userDocs = await Promise.all(ids.map((id) => db.collection("users").doc(id).get()))
        const firebaseUsers = userDocs.filter((doc: any) => doc.exists).map((doc: any) => ({ id: doc.id, ...doc.data() }))

        if (firebaseUsers.length === 0) {
          return NextResponse.json({ success: true, count: 0, message: "No valid users found for migration" })
        }

        // 2. Batch upsert to Supabase users table
        const usersToUpsert = firebaseUsers.map((userData: any) => ({
          email: userData.email,
          first_name: userData.firstname || userData.displayName?.split(" ")[0] || "N/A",
          last_name: userData.lastname || userData.displayName?.split(" ").slice(1).join(" ") || "N/A",
          phone_number: userData.phone_number || userData.phoneNumber || null,
          role: "taxpayer",
          firebase_uid: userData.id,
          is_active: true,
        }))

        const { data: sbUsers, error: usersError } = await supabase
          .from("users")
          .upsert(usersToUpsert, { onConflict: "firebase_uid" })
          .select("id, firebase_uid")

        if (usersError) {
          throw new Error(`Batch User Upsert Error: ${usersError.message}`)
        }

        // Create a mapping of firebase_uid to supabase_id
        const userMap = new Map(sbUsers.map((u) => [u.firebase_uid, u.id]))

        // 3. Batch upsert to taxpayer_profiles
        const profilesToUpsert = firebaseUsers
          .filter((u) => userMap.has(u.id))
          .map((userData: any) => ({
            user_id: userMap.get(userData.id),
            kadirs_id: userData.kadirs_id || userData.kadirsId || null,
            nationality: userData.nationality || "Nigerian",
            gender: userData.gender || null,
            registration_source: "legacy_migration",
          }))

        const { error: profilesError } = await supabase
          .from("taxpayer_profiles")
          .upsert(profilesToUpsert, { onConflict: "user_id" })

        if (profilesError) {
          console.error("Batch Profile Error:", profilesError)
        }

        // 4. Migrate related enumerations (properties) in chunks if necessary
        // Fetching enumerations for all users
        const allProperties: any[] = []
        for (const id of ids) {
          const enumerations = await db.collection("enumerations").where("owner_uid", "==", id).get()
          enumerations.docs.forEach((doc: any) => {
            const data = doc.data()
            allProperties.push({
              registered_property_name: data.registered_property_name || data.property_name || "N/A",
              property_type: (data.type_of_rent?.toLowerCase().includes("resid") ? "residential" : "commercial") as any,
              house_number: data.house_number || null,
              street_name: data.street_name || null,
              status: "submitted",
              verification_status: "pending",
              owner_id: userMap.get(id),
              kadirs_property_id: data.kadirs_id || null,
              property_reference: doc.id, // Use legacy Firestore ID as reference for idempotency
              registration_source: "legacy_migration",
            })
          })
        }

        if (allProperties.length > 0) {
          const { error: propError } = await supabase
            .from("properties")
            .upsert(allProperties, { onConflict: "property_reference" })
          if (propError) console.error("Batch Property Error:", propError)
        }

        // 5. Migrate related invoices
        const allInvoices: any[] = []
        for (const id of ids) {
          const invoices = await db.collection("invoice_bills").where("taxpayer_uid", "==", id).get()
          invoices.docs.forEach((doc: any) => {
            const data = doc.data()
            allInvoices.push({
              invoice_number: data.billReference || data.bill_reference || doc.id,
              taxpayer_id: userMap.get(id),
              total_amount: Number(data.amount || 0),
              payment_status: (data.payStatus?.toLowerCase() === "paid" ? "paid" : "unpaid") as any,
              issue_date: data.dateCreated
                ? new Date(data.dateCreated.seconds * 1000).toISOString()
                : new Date().toISOString(),
              due_date: new Date().toISOString(),
              tax_year: new Date().getFullYear(),
              registration_source: "legacy_migration",
            })
          })
        }

        if (allInvoices.length > 0) {
          const { error: invError } = await supabase
            .from("invoices")
            .upsert(allInvoices, { onConflict: "invoice_number" })
          if (invError) console.error("Batch Invoice Error:", invError)
        }

        successCount = firebaseUsers.length
      } catch (err: any) {
        errors.push({ id: "batch", error: err.message })
      }
    } else if (type === "enumerations") {
      try {
        // 1. Fetch all enumerations from Firebase
        const enumDocs = await Promise.all(ids.map((id) => db.collection("enumerations").doc(id).get()))
        const firebaseEnums = enumDocs.filter((doc) => doc.exists).map((doc) => ({ id: doc.id, ...doc.data() }))

        if (firebaseEnums.length === 0) {
          return NextResponse.json({ success: true, count: 0, message: "No valid enumerations found for migration" })
        }

        // 2. Map Firebase owner_uid to Supabase user_id
        const ownerUids = Array.from(new Set(firebaseEnums.map((e: any) => e.owner_uid).filter(Boolean)))
        let userMap = new Map()

        if (ownerUids.length > 0) {
          const { data: sbUsers } = await supabase
            .from("users")
            .select("id, firebase_uid")
            .in("firebase_uid", ownerUids)
          if (sbUsers) {
            userMap = new Map(sbUsers.map((u) => [u.firebase_uid, u.id]))
          }
        }

        // 3. Batch upsert to properties
        const propertiesToUpsert = firebaseEnums.map((data: any) => ({
          registered_property_name: data.registered_property_name || data.property_name || "N/A",
          property_type: (data.type_of_rent?.toLowerCase().includes("resid") ? "residential" : "commercial") as any,
          house_number: data.house_number || null,
          street_name: data.street_name || null,
          status: "submitted",
          verification_status: "pending",
          owner_id: userMap.get(data.owner_uid) || null,
          kadirs_property_id: data.kadirs_id || null,
          property_reference: data.id,
          registration_source: "legacy_migration",
        }))

        const { error: propError } = await supabase
          .from("properties")
          .upsert(propertiesToUpsert, { onConflict: "property_reference" })

        if (propError) {
          throw new Error(`Batch Property Upsert Error: ${propError.message}`)
        }

        successCount = firebaseEnums.length
      } catch (err: any) {
        errors.push({ id: "batch_enum", error: err.message })
      }
    } else if (type === "invoices") {
      try {
        // 1. Fetch all invoices from Firebase
        const invDocs = await Promise.all(ids.map((id) => db.collection("invoice_bills").doc(id).get()))
        const firebaseInvoices = invDocs.filter((doc) => doc.exists).map((doc) => ({ id: doc.id, ...doc.data() }))

        if (firebaseInvoices.length === 0) {
          return NextResponse.json({ success: true, count: 0, message: "No valid invoices found for migration" })
        }

        // 2. Map Firebase taxpayer_uid to Supabase user_id
        const taxpayerUids = Array.from(new Set(firebaseInvoices.map((i: any) => i.taxpayer_uid).filter(Boolean)))
        let userMap = new Map()

        if (taxpayerUids.length > 0) {
          const { data: sbUsers } = await supabase
            .from("users")
            .select("id, firebase_uid")
            .in("firebase_uid", taxpayerUids)
          if (sbUsers) {
            userMap = new Map(sbUsers.map((u) => [u.firebase_uid, u.id]))
          }
        }

        // 3. Batch upsert to invoices
        const invoicesToUpsert = firebaseInvoices.map((data: any) => ({
          invoice_number: data.billReference || data.bill_reference || data.id,
          taxpayer_id: userMap.get(data.taxpayer_uid) || null,
          total_amount: Number(data.amount || 0),
          payment_status: (data.payStatus?.toLowerCase() === "paid" ? "paid" : "unpaid") as any,
          issue_date: data.dateCreated
            ? new Date(data.dateCreated.seconds * 1000).toISOString()
            : new Date().toISOString(),
          due_date: new Date().toISOString(),
          tax_year: new Date().getFullYear(),
          registration_source: "legacy_migration",
        }))

        const { error: invError } = await supabase
          .from("invoices")
          .upsert(invoicesToUpsert, { onConflict: "invoice_number" })

        if (invError) {
          throw new Error(`Batch Invoice Upsert Error: ${invError.message}`)
        }

        successCount = firebaseInvoices.length
      } catch (err: any) {
        errors.push({ id: "batch_inv", error: err.message })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
