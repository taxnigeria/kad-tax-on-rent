"use server"

import { createUserAccount, type CreateUserAccountInput } from "./create-user-account"
import { createUserProfile } from "./create-user-profile"

export interface CreateEnumeratorInput extends Omit<CreateUserAccountInput, "role"> {
  // Enumerator-specific fields
  areaOfficeId?: string
  lgaId?: string
  assignedZones?: string[]
  supervisorId?: string
}

/**
 * Creates an enumerator user account with profile
 * Reuses core account creation logic with enumerator-specific handling
 */
export async function createEnumerator(input: CreateEnumeratorInput) {
  try {
    // Create base account with enumerator role
    const accountResult = await createUserAccount({
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      role: "enumerator",
    })

    if (!accountResult.success) {
      return { success: false, error: accountResult.error }
    }

    const { userId, password } = accountResult.data!

    // Create enumerator profile
    const profileResult = await createUserProfile("enumerator", {
      userId,
      areaOfficeId: input.areaOfficeId,
      lgaId: input.lgaId,
      assignedZones: input.assignedZones,
      supervisorId: input.supervisorId,
    })

    if (!profileResult.success) {
      console.error("Error creating enumerator profile:", profileResult.error)
      return { success: false, error: profileResult.error }
    }

    return {
      success: true,
      data: {
        user: { id: userId, email: input.email, role: "enumerator" },
        profile: profileResult.data,
        credentials: {
          email: input.email,
          password,
        },
      },
    }
  } catch (error: any) {
    console.error("Error in createEnumerator:", error)
    return { success: false, error: error.message || "Failed to create enumerator" }
  }
}
