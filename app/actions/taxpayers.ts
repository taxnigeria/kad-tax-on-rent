"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createUserAccount } from "@/lib/auth/create-user-account"
import { createUserProfile } from "@/lib/auth/create-user-profile"
import { logAudit } from "./audit"

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
    tin: string | null
    means_of_identification: string | null
    identification_number: string | null
    user_type: string
    profile_photo_url: string | null
    lga_id: string | null
    area_office_id: string | null
    address_line1: string | null
    rc_number: string | null
    industry_id: number | null
    business_registration_date: string | null
    management_license_number: string | null
    years_of_experience: number | null
    registration_source: string
    onboarded_by_id: string | null
  } | null
  property_count?: number
  invoice_count?: number
  total_tax_owed?: number
  total_paid?: number
  properties?: any[]
  invoices?: any[]
  payments?: any[]
}

export async function getTaxpayers(params?: {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  status?: string
  source?: string
  sortField?: string
  sortOrder?: "asc" | "desc"
}) {
  try {
    const adminSupabase = createAdminClient()
    const {
      page = 1,
      pageSize = 50,
      search,
      role,
      status,
      source,
      sortField = "created_at",
      sortOrder = "desc",
    } = params || {}

    let query = adminSupabase.from("users").select(
      `
        *,
        taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (*)
      `,
      { count: "exact" },
    )

    // Role filter
    if (role && role !== "all") {
      query = query.eq("role", role)
    } else {
      query = query.in("role", ["taxpayer", "property_manager"])
    }

    // Status filter
    if (status && status !== "all") {
      query = query.eq("is_active", status === "active")
    }

    // Registration Source filter (joined table)
    if (source && source !== "all") {
      query = query.filter("taxpayer_profiles.registration_source", "eq", source)
    }

    // Search
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Sorting
    if (sortField) {
      // If sorting by a joined field, Supabase syntax is slightly different but usually works if qualified
      // However, most fields are in 'users'. If it's a profile field, we'd need to handle it.
      if (sortField === "kadirs_id") {
        query = query.order("taxpayer_profiles(kadirs_id)", { ascending: sortOrder === "asc", nullsFirst: false })
      } else {
        query = query.order(sortField, { ascending: sortOrder === "asc" })
      }
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching taxpayers:", error)
      return { taxpayers: [], error: error.message, totalCount: 0 }
    }

    return { taxpayers: data as TaxpayerWithProfile[], error: null, totalCount: count || 0 }
  } catch (error) {
    console.error("Error in getTaxpayers:", error)
    return { taxpayers: [], error: "Failed to fetch taxpayers", totalCount: 0 }
  }
}

export async function getTaxpayerById(taxpayerId: string) {
  try {
    const adminSupabase = createAdminClient()

    // Get taxpayer with profile
    const { data: taxpayer, error: taxpayerError } = await adminSupabase
      .from("users")
      .select(
        `
        *,
        taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
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
    const { count: propertyCount } = await adminSupabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", taxpayerId)

    // Get properties list
    const { data: properties } = await adminSupabase
      .from("properties")
      .select("*")
      .eq("owner_id", taxpayerId)
      .order("created_at", { ascending: false })

    // Get invoices
    const { data: invoices, count: invoiceCount } = await adminSupabase
      .from("invoices")
      .select("*", { count: "exact" })
      .eq("taxpayer_id", taxpayerId)
      .order("created_at", { ascending: false })

    // Get payments
    const { data: payments } = await adminSupabase
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
  taxIdOrNin?: string
  gender?: string
  nationality?: string
  dateOfBirth?: string
  residentialAddress?: string
  isBusiness: boolean
  businessName?: string
  businessType?: string
  businessAddress?: string
  tin?: string
  meansOfIdentification?: string
  identificationNumber?: string
  userType?: string
  profilePhotoUrl?: string
  lgaId?: string
  areaOfficeId?: string
  addressLine1?: string
  rcNumber?: string
  industryId?: string
  businessRegistrationDate?: string
  managementLicenseNumber?: string
  yearsOfExperience?: string
}) {
  try {
    const accountResult = await createUserAccount({
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: data.role,
    })

    if (!accountResult.success) {
      return { success: false, error: accountResult.error }
    }

    const { userId, password } = accountResult.data!

    const profileResult = await createUserProfile("taxpayer", {
      userId,
      taxIdOrNin: data.taxIdOrNin,
      tin: data.tin,
      meansOfIdentification: data.meansOfIdentification,
      identificationNumber: data.identificationNumber,
      userType: data.userType,
      gender: data.gender,
      nationality: data.nationality,
      dateOfBirth: data.dateOfBirth,
      residentialAddress: data.residentialAddress,
      isBusiness: data.isBusiness,
      businessName: data.businessName,
      businessType: data.businessType,
      businessAddress: data.businessAddress,
      profilePhotoUrl: data.profilePhotoUrl,
      lgaId: data.lgaId,
      areaOfficeId: data.areaOfficeId,
      addressLine1: data.addressLine1,
      rcNumber: data.rcNumber,
      industryId: data.industryId,
      businessRegistrationDate: data.businessRegistrationDate,
      managementLicenseNumber: data.managementLicenseNumber,
      yearsOfExperience: data.yearsOfExperience,
      registrationSource: "admin",
    })

    if (!profileResult.success) {
      console.error("Error creating taxpayer profile:", profileResult.error)
      return { success: false, error: profileResult.error }
    }

    await triggerN8nPostCreationActions({
      userId,
      email: data.email,
      phoneNumber: accountResult.data!.phoneNumber,
      password,
      name: `${data.firstName} ${data.lastName}`,
      userType: "taxpayer",
    })

    // Log taxpayer creation
    await logAudit({
      action: "create",
      entityType: "taxpayer",
      entityId: profileResult.data.id,
      changeSummary: `Created taxpayer: ${data.firstName} ${data.lastName}${data.isBusiness ? ` (${data.businessName})` : ""}`
    })

    return {
      success: true,
      data: {
        user: { id: userId, email: data.email, role: data.role },
        profile: profileResult.data,
      },
    }
  } catch (error: any) {
    console.error("Error in createTaxpayer:", error)
    return { success: false, error: error.message || "Failed to create taxpayer" }
  }
}

/**
 * Triggers n8n webhook for post-creation notifications and actions
 * Handles WhatsApp alerts, emails, and other integrations
 * Non-blocking - failures don't break the main creation flow
 */
async function triggerN8nPostCreationActions(data: {
  userId: string
  email: string
  phoneNumber?: string
  password: string
  name: string
  userType: string
}) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    const authToken = process.env.N8N_WEBHOOK_AUTH_TOKEN

    if (!webhookUrl) {
      console.warn("[v0] N8N_WEBHOOK_URL not configured, skipping post-creation actions")
      return
    }

    // Build headers - only include auth if token is configured
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "user_created",
        userType: data.userType,
        userId: data.userId,
        email: data.email,
        phoneNumber: data.phoneNumber,
        name: data.name,
        password: data.password,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn("[v0] N8N webhook warning:", `Status ${response.status} - ${errorText}`)
      // Don't throw - this is a non-blocking operation
    }
  } catch (error: any) {
    console.warn("[v0] Warning triggering n8n webhook:", error.message)
    // Non-blocking - log but don't fail the main operation
  }
}

export async function updateTaxpayerStatus(taxpayerId: string, isActive: boolean) {
  try {
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.from("users").update({ is_active: isActive }).eq("id", taxpayerId)

    if (error) {
      console.error("Error updating taxpayer status:", error)
      return { success: false, error: error.message }
    }

    // Log status change
    await logAudit({
      action: "update",
      entityType: "users",
      entityId: taxpayerId,
      changeSummary: `Updated taxpayer status to ${isActive ? "Active" : "Inactive"}`
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateTaxpayerStatus:", error)
    return { success: false, error: error.message || "Failed to update taxpayer status" }
  }
}

export async function createTaxpayerByEnumerator(data: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  firebaseUid: string;
}) {
  try {
    const supabase = await createClient()

    // 1. Verify enumerator
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", data.firebaseUid)
      .single()

    if (userError || !userData || userData.role !== "enumerator") {
      return { success: false, error: "Unauthorized" }
    }

    // 2. Check if phone already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("phone_number", data.phoneNumber)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: "Phone number already registered" }
    }

    // 3. Create user account
    const { data: newUser, error: newUserError } = await supabase
      .from("users")
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || null,
        phone_number: data.phoneNumber,
        role: "taxpayer",
        is_active: true,
      })
      .select()
      .single()

    if (newUserError) return { success: false, error: "Failed to create user account" }

    // 4. Create profile
    const { data: profile, error: profileError } = await supabase
      .from("taxpayer_profiles")
      .insert({
        user_id: newUser.id,
        residential_address: data.address || null,
        onboarded_by_id: userData.id,
        registration_source: 'enumerator'
      })
      .select()
      .single()

    if (profileError) {
      await supabase.from("users").delete().eq("id", newUser.id)
      return { success: false, error: "Failed to create profile" }
    }

    // 5. Log audit
    await logAudit({
      userId: userData.id,
      action: "create",
      entityType: "taxpayer",
      entityId: profile.id,
      changeSummary: `Enumerator registered new taxpayer: ${data.firstName} ${data.lastName}`
    })

    return {
      success: true,
      taxpayer: {
        id: profile.id,
        user_id: newUser.id,
        user: {
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          phone_number: newUser.phone_number
        }
      }
    }
  } catch (error: any) {
    console.error("Error in createTaxpayerByEnumerator:", error)
    return { success: false, error: error.message || "Internal server error" }
  }
}

export async function searchTaxpayersByEnumerator(query: string, firebaseUid: string) {
  try {
    const supabase = await createClient()

    // 1. Verify enumerator
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !user || user.role !== "enumerator") {
      return { results: [], error: "Unauthorized" }
    }

    // 2. Search
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone_number,
        taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
          id,
          kadirs_id,
          is_business,
          business_name
        )
      `)
      .in("role", ["taxpayer", "property_manager"])
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("[Search] Supabase error:", error)
      return { results: [], error: error.message }
    }

    // Format results to match frontend interface
    const results = data.map((u: any) => {
      const profile = Array.isArray(u.taxpayer_profiles)
        ? u.taxpayer_profiles[0]
        : u.taxpayer_profiles

      return {
        id: profile?.id || "",
        user_id: u.id,
        kadirs_id: profile?.kadirs_id || null,
        user: {
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email || "",
          phone_number: u.phone_number || "",
        },
        business_name: profile?.business_name || null,
        is_business: profile?.is_business || false,
      }
    })

    return { results, error: null }
  } catch (error: any) {
    console.error("[Search] Critical error:", error)
    return { results: [], error: error.message }
  }
}
export async function createTaxpayerByManager(data: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  firebaseUid: string;
}) {
  try {
    const supabase = await createClient()

    // 1. Verify property manager
    const { data: managerData, error: managerError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", data.firebaseUid)
      .single()

    if (managerError || !managerData || managerData.role !== "property_manager") {
      return { success: false, error: "Unauthorized access" }
    }

    // 2. Use helper to create account (Activities: Check Dupes, Create Firebase User, Create DB User)
    const accountResult = await createUserAccount({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || `${data.phoneNumber || Math.random().toString(36).slice(-8)}@kadrent.placeholder.com`,
      phoneNumber: data.phoneNumber,
      role: "taxpayer",
    })

    if (!accountResult.success) {
      return { success: false, error: accountResult.error }
    }

    const newUser = accountResult.data!

    // 3. Create profile with verification tracking
    const adminSupabase = createAdminClient()

    const { data: profile, error: profileError } = await adminSupabase
      .from("taxpayer_profiles")
      .insert({
        user_id: newUser.userId,
        residential_address: data.address || null,
        verification_status: 'pending',
        onboarded_by_id: managerData.id,
        registration_source: 'agent'
      })
      .select()
      .single()

    if (profileError) {
      // Rollback user creation (delete from DB, maybe Firebase too but that's harder)
      await adminSupabase.from("users").delete().eq("id", newUser.userId)
      console.error("Profile creation error:", profileError)
      return { success: false, error: "Failed to create taxpayer profile" }
    }

    // 4. Log audit
    await logAudit({
      userId: managerData.id,
      action: "create",
      entityType: "taxpayer",
      entityId: profile.id,
      changeSummary: `Property Manager registered new Principal (Client): ${data.firstName} ${data.lastName}`
    })

    return {
      success: true,
      client: {
        id: profile.id,
        user_id: newUser.userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: newUser.email,
        phone_number: newUser.phoneNumber,
        verification_status: 'pending'
      }
    }
  } catch (error: any) {
    console.error("Error in createTaxpayerByManager:", error)
    return { success: false, error: error.message || "Internal server error" }
  }
}
