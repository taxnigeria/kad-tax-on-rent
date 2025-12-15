"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type TaxpayerWithProfile = {
  id: string
  firebase_uid: string
  email: string
  first_name: string
  middle_name: string | null
  last_name: string
  phone_number: string | null
  role: string
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
  last_login: string | null
  taxpayer_profiles: {
    id: string
    kadirs_id: string | null
    tax_id_or_nin: string | null
    business_name: string | null
    business_type: string | null
    is_business: boolean
    gender: string | null
    nationality: string | null
    date_of_birth: string | null
    residential_address: string | null
    business_address: string | null
    lgas: {
      id: string
      name: string
    } | null
    area_offices: {
      id: string
      office_name: string
    } | null
  } | null
  property_count?: number
  invoice_count?: number
  total_tax_owed?: number
  total_paid?: number
  properties?: any[]
  invoices?: any[]
  payments?: any[]
}

export async function getTaxpayers() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        taxpayer_profiles (*)
      `,
      )
      .in("role", ["taxpayer", "property_manager"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching taxpayers:", error)
      return { taxpayers: [], error: error.message }
    }

    return { taxpayers: data as TaxpayerWithProfile[], error: null }
  } catch (error) {
    console.error("Error in getTaxpayers:", error)
    return { taxpayers: [], error: "Failed to fetch taxpayers" }
  }
}

export async function getTaxpayerById(taxpayerId: string) {
  try {
    const supabase = await createClient()

    // Get taxpayer with profile
    const { data: taxpayer, error: taxpayerError } = await supabase
      .from("users")
      .select(
        `
        *,
        taxpayer_profiles (
          *,
          lgas (id, name),
          area_offices (id, office_name)
        )
      `,
      )
      .eq("id", taxpayerId)
      .single()

    if (taxpayerError) {
      console.error("Error fetching taxpayer:", taxpayerError)
      return { taxpayer: null, error: taxpayerError.message }
    }

    // Get properties count
    const { count: propertyCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", taxpayerId)

    // Get properties list
    const { data: properties } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", taxpayerId)
      .order("created_at", { ascending: false })

    // Get invoices
    const { data: invoices, count: invoiceCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact" })
      .eq("taxpayer_id", taxpayerId)
      .order("created_at", { ascending: false })

    // Get payments
    const { data: payments } = await supabase
      .from("payments")
      .select(
        `
        *,
        invoices (
          invoice_number,
          taxpayer_id
        )
      `,
      )
      .eq("invoices.taxpayer_id", taxpayerId)
      .order("created_at", { ascending: false })

    // Calculate totals
    const totalTaxOwed = invoices?.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0) || 0
    const totalPaid = invoices?.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0) || 0

    return {
      taxpayer: {
        ...taxpayer,
        property_count: propertyCount || 0,
        invoice_count: invoiceCount || 0,
        total_tax_owed: totalTaxOwed,
        total_paid: totalPaid,
        properties: properties || [],
        invoices: invoices || [],
        payments: payments || [],
      } as TaxpayerWithProfile & {
        properties: any[]
        invoices: any[]
        payments: any[]
      },
      error: null,
    }
  } catch (error) {
    console.error("Error in getTaxpayerById:", error)
    return { taxpayer: null, error: "Failed to fetch taxpayer details" }
  }
}

export async function createTaxpayer(data: {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phoneNumber?: string
  role: string
  taxIdOrNin: string
  gender?: string
  nationality?: string
  dateOfBirth?: string
  residentialAddress?: string
  isBusiness: boolean
  businessName?: string
  businessType?: string
  businessAddress?: string
}) {
  try {
    const supabase = createAdminClient()

    // Generate a temporary Firebase UID (in production, you'd create this via Firebase Admin SDK)
    const tempFirebaseUid = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Create user in users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        firebase_uid: tempFirebaseUid,
        email: data.email,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        last_name: data.lastName,
        phone_number: data.phoneNumber || null,
        role: data.role,
        is_active: true,
        email_verified: false,
      })
      .select()
      .single()

    if (userError) {
      console.error("Error creating user:", userError)
      return { success: false, error: userError.message }
    }

    // Create taxpayer profile
    const { data: profile, error: profileError } = await supabase
      .from("taxpayer_profiles")
      .insert({
        user_id: user.id,
        tax_id_or_nin: data.taxIdOrNin,
        gender: data.gender || null,
        nationality: data.nationality || null,
        date_of_birth: data.dateOfBirth || null,
        residential_address: data.residentialAddress || null,
        is_business: data.isBusiness,
        business_name: data.businessName || null,
        business_type: data.businessType || null,
        business_address: data.businessAddress || null,
      })
      .select()
      .single()

    if (profileError) {
      console.error("Error creating taxpayer profile:", profileError)
      // Rollback user creation
      await supabase.from("users").delete().eq("id", user.id)
      return { success: false, error: profileError.message }
    }

    return { success: true, data: { user, profile } }
  } catch (error: any) {
    console.error("Error in createTaxpayer:", error)
    return { success: false, error: error.message || "Failed to create taxpayer" }
  }
}

export async function updateTaxpayerStatus(taxpayerId: string, isActive: boolean) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", taxpayerId)

    if (error) {
      console.error("Error updating taxpayer status:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateTaxpayerStatus:", error)
    return { success: false, error: error.message || "Failed to update taxpayer status" }
  }
}
