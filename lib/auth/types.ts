export interface UserProfileInput {
  userId: string
  [key: string]: any
}

export interface CreateProfileResult {
  success: boolean
  data?: any
  error?: string
}

export type ProfileType = "taxpayer" | "admin" | "enumerator" | "property_manager" | "tenant"
