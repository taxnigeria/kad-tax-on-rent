"use server"

import { createUserAccount, type CreateUserAccountInput } from "./create-user-account"
import { createUserProfile } from "./create-user-profile"

export interface CreatePropertyManagerInput extends Omit<CreateUserAccountInput, "role"> {
  // Property manager-specific fields
  companyName?: string
  licenseNumber?: string
  managedProperties?: string[]
}

/**
 * Creates a property manager user account with profile
 * Reuses core account creation logic with property manager-specific handling
 */
export async function createPropertyManager(input: CreatePropertyManagerInput) {
  try {
    // Create base account with property_manager role
    const accountResult = await createUserAccount({
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      role: "property_manager",
    })

    if (!accountResult.success) {
      return { success: false, error: accountResult.error }
    }

    const { userId, password } = accountResult.data!

    // Create property manager profile
    const profileResult = await createUserProfile("property_manager", {
      userId,
      companyName: input.companyName,
      licenseNumber: input.licenseNumber,
      managedProperties: input.managedProperties,
    })

    if (!profileResult.success) {
      console.error("Error creating property manager profile:", profileResult.error)
      return { success: false, error: profileResult.error }
    }

    return {
      success: true,
      data: {
        user: { id: userId, email: input.email, role: "property_manager" },
        profile: profileResult.data,
        credentials: {
          email: input.email,
          password,
        },
      },
    }
  } catch (error: any) {
    console.error("Error in createPropertyManager:", error)
    return { success: false, error: error.message || "Failed to create property manager" }
  }
}
