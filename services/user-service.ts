import { createBrowserClient } from "@/utils/supabase/client"

/**
 * Fetch the user's profile photo URL from the taxpayer_profiles table
 * @param firebaseUid - The user's Firebase UID
 * @returns The profile photo URL or null if not found
 */
export async function getUserProfilePhoto(firebaseUid: string): Promise<string | null> {
  try {
    const supabase = createBrowserClient()

    // First, get the user ID from the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user:", userError)
      return null
    }

    // Then, get the profile photo from taxpayer_profiles
    const { data: profileData, error: profileError } = await supabase
      .from("taxpayer_profiles")
      .select("profile_photo_url")
      .eq("user_id", userData.id)
      .single()

    if (profileError || !profileData) {
      console.error("Error fetching profile:", profileError)
      return null
    }

    return profileData.profile_photo_url || null
  } catch (error) {
    console.error("Error in getUserProfilePhoto:", error)
    return null
  }
}
