"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createUserAccount } from "@/lib/auth/create-user-account"
import { createUserProfile } from "@/lib/auth/create-user-profile"

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
