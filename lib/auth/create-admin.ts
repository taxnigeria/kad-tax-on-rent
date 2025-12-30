"use server"

import { createUserAccount, type CreateUserAccountInput } from "./create-user-account"
import { createUserProfile } from "./create-user-profile"

export interface CreateAdminInput extends Omit<CreateUserAccountInput, "role"> {
  // Admin-specific fields can be added here
  departmentId?: string
  permissions?: string[]
}

/**
 * Creates an admin user account with profile
 * Reuses core account creation logic with admin-specific handling
 */
export async function createAdmin(input: CreateAdminInput) {
  try {
    // Create base account with admin role
    const accountResult = await createUserAccount({
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      role: "admin",
    })

    if (!accountResult.success) {
      return { success: false, error: accountResult.error }
    }

    const { userId, password } = accountResult.data!

    // Create admin profile
    const profileResult = await createUserProfile("admin", {
      userId,
      departmentId: input.departmentId,
      permissions: input.permissions,
    })

    if (!profileResult.success) {
      console.error("Error creating admin profile:", profileResult.error)
      return { success: false, error: profileResult.error }
    }

    return {
      success: true,
      data: {
        user: { id: userId, email: input.email, role: "admin" },
        profile: profileResult.data,
        credentials: {
          email: input.email,
          password,
        },
      },
    }
  } catch (error: any) {
    console.error("Error in createAdmin:", error)
    return { success: false, error: error.message || "Failed to create admin" }
  }
}
