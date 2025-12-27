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
  taxpayer_profiles: Array<{
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
  }>
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
    const supabase = createAdminClient()

    const { data: existingEmail } = await supabase.from("users").select("id").eq("email", data.email).single()

    if (existingEmail) {
      return { success: false, error: "Email already in use" }
    }

    if (data.phoneNumber) {
      let normalizedPhone = data.phoneNumber.trim()
      if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = normalizedPhone.startsWith("0") ? `+234${normalizedPhone.slice(1)}` : `+234${normalizedPhone}`
      }

      const { data: existingPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", normalizedPhone)
        .single()

      if (existingPhone) {
        return { success: false, error: "Phone number already in use" }
      }
    }

    let password = ""
    if (data.phoneNumber) {
      let phoneDigits = data.phoneNumber.replace(/\D/g, "")
      // Remove +234 prefix if present
      if (phoneDigits.startsWith("234")) {
        phoneDigits = "0" + phoneDigits.slice(3)
      }
      // Add leading 0 if not present
      if (!phoneDigits.startsWith("0") && phoneDigits.length === 10) {
        phoneDigits = "0" + phoneDigits
      }
      password = phoneDigits.slice(0, 11)
    } else {
      password = Math.random().toString(36).slice(-10)
    }

    const displayName = `${data.firstName} ${data.lastName}`

    const firebaseResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/admin/create-firebase-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password,
        displayName,
        phoneNumber: data.phoneNumber,
      }),
    })

    if (!firebaseResponse.ok) {
      const errorData = await firebaseResponse.json()
      return { success: false, error: `Failed to create Firebase account: ${errorData.error}` }
    }

    const { uid: firebaseUid } = await firebaseResponse.json()

    let normalizedPhone = data.phoneNumber || null
    if (normalizedPhone) {
      normalizedPhone = normalizedPhone.trim()
      if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = normalizedPhone.startsWith("0") ? `+234${normalizedPhone.slice(1)}` : `+234${normalizedPhone}`
      }
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        firebase_uid: firebaseUid,
        email: data.email,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        last_name: data.lastName,
        phone_number: normalizedPhone,
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

    const { data: profile, error: profileError } = await supabase
      .from("taxpayer_profiles")
      .insert({
        user_id: user.id,
        tax_id_or_nin: data.taxIdOrNin || null,
        tin: data.tin || null,
        means_of_identification: data.meansOfIdentification || null,
        identification_number: data.identificationNumber || null,
        user_type: data.userType || "Individual",
        gender: data.gender || null,
        nationality: data.nationality || null,
        date_of_birth: data.dateOfBirth || null,
        residential_address: data.residentialAddress || null,
        is_business: data.isBusiness,
        business_name: data.businessName || null,
        business_type: data.businessType || null,
        business_address: data.businessAddress || null,
        profile_photo_url: data.profilePhotoUrl || null,
        lga_id: data.lgaId || null,
        area_office_id: data.areaOfficeId || null,
        address_line1: data.addressLine1 || null,
        rc_number: data.rcNumber || null,
        industry_id: data.industryId ? Number.parseInt(data.industryId) : null,
        business_registration_date: data.businessRegistrationDate || null,
        management_license_number: data.managementLicenseNumber || null,
        years_of_experience: data.yearsOfExperience ? Number.parseInt(data.yearsOfExperience) : null,
      })
      .select()
      .single()

    if (profileError) {
      console.error("Error creating taxpayer profile:", profileError)
      await supabase.from("users").delete().eq("id", user.id)
      return { success: false, error: profileError.message }
    }

    if (normalizedPhone) {
      await sendWhatsAppRegistrationAlert({
        phoneNumber: normalizedPhone,
        name: displayName,
        email: data.email,
        password,
      })
    }

    return { success: true, data: { user, profile } }
  } catch (error: any) {
    console.error("Error in createTaxpayer:", error)
    return { success: false, error: error.message || "Failed to create taxpayer" }
  }
}

async function sendWhatsAppRegistrationAlert(data: {
  phoneNumber: string
  name: string
  email: string
  password: string
}) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    const authToken = process.env.N8N_WEBHOOK_AUTH_TOKEN

    if (!webhookUrl || !authToken) {
      console.error("[v0] WhatsApp webhook not configured")
      return { success: false, error: "WhatsApp webhook not configured" }
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "send_reg_info",
        channel: "whatsapp",
        phone_number: data.phoneNumber,
        user_name: data.name,
        email: data.email,
        password: data.password,
        message_template: `Welcome to KADIRS!\n\nYour account has been created.\n\nLogin Details:\nEmail: ${data.email}\nPassword: ${data.password}\n\nPlease login and change your password.`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] WhatsApp webhook error:", errorText)
      return { success: false, error: "Failed to send WhatsApp alert" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error sending WhatsApp alert:", error)
    return { success: false, error: error.message }
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
