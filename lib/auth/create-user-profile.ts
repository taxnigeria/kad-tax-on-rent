"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { CreateProfileResult, ProfileType } from "./types"

/**
 * Creates role-specific user profiles
 * Extensible for different user types
 */
export async function createUserProfile(profileType: ProfileType, input: any): Promise<CreateProfileResult> {
  switch (profileType) {
    case "taxpayer":
      return createTaxpayerProfile(input)
    case "admin":
      return createAdminProfile(input)
    case "enumerator":
      return createEnumeratorProfile(input)
    case "property_manager":
      return createPropertyManagerProfile(input)
    default:
      return { success: false, error: `Unknown profile type: ${profileType}` }
  }
}

/**
 * Creates taxpayer-specific profile
 */
async function createTaxpayerProfile(input: {
  userId: string
  taxIdOrNin?: string
  tin?: string
  meansOfIdentification?: string
  identificationNumber?: string
  userType?: string
  gender?: string
  nationality?: string
  dateOfBirth?: string
  residentialAddress?: string
  isBusiness: boolean
  businessName?: string
  businessType?: string
  businessAddress?: string
  profilePhotoUrl?: string
  lgaId?: string
  areaOfficeId?: string
  addressLine1?: string
  rcNumber?: string
  industryId?: string
  businessRegistrationDate?: string
  managementLicenseNumber?: string
  yearsOfExperience?: string
}): Promise<CreateProfileResult> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("taxpayer_profiles")
      .insert({
        user_id: input.userId,
        tax_id_or_nin: input.taxIdOrNin || null,
        tin: input.tin || null,
        means_of_identification: input.meansOfIdentification || null,
        identification_number: input.identificationNumber || null,
        user_type: input.userType || "Individual",
        gender: input.gender || null,
        nationality: input.nationality || null,
        date_of_birth: input.dateOfBirth || null,
        residential_address: input.residentialAddress || null,
        is_business: input.isBusiness,
        business_name: input.businessName || null,
        business_type: input.businessType || null,
        business_address: input.businessAddress || null,
        profile_photo_url: input.profilePhotoUrl || null,
        lga_id: input.lgaId || null,
        area_office_id: input.areaOfficeId || null,
        address_line1: input.addressLine1 || null,
        rc_number: input.rcNumber || null,
        industry_id: input.industryId ? Number.parseInt(input.industryId) : null,
        business_registration_date: input.businessRegistrationDate || null,
        management_license_number: input.managementLicenseNumber || null,
        years_of_experience: input.yearsOfExperience ? Number.parseInt(input.yearsOfExperience) : null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating taxpayer profile:", error)
      return { success: false, error: `Failed to create profile: ${error.message}` }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error in createTaxpayerProfile:", error)
    return { success: false, error: error.message || "Failed to create taxpayer profile" }
  }
}

/**
 * Placeholder for admin profile creation
 * Can be expanded with admin-specific fields
 */
async function createAdminProfile(input: any): Promise<CreateProfileResult> {
  // TODO: Implement admin profile creation logic
  return { success: true, data: { userId: input.userId } }
}

/**
 * Placeholder for enumerator profile creation
 * Can be expanded with enumerator-specific fields
 */
async function createEnumeratorProfile(input: any): Promise<CreateProfileResult> {
  // TODO: Implement enumerator profile creation logic
  return { success: true, data: { userId: input.userId } }
}

/**
 * Placeholder for property manager profile creation
 * Can be expanded with property manager-specific fields
 */
async function createPropertyManagerProfile(input: any): Promise<CreateProfileResult> {
  // TODO: Implement property manager profile creation logic
  return { success: true, data: { userId: input.userId } }
}
