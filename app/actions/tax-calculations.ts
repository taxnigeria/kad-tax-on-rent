"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getTaxCalculations() {
  try {
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from("tax_calculations")
      .select(
        `
          *,
          properties!inner (
            id,
            property_reference,
            registered_property_name,
            property_type,
            owner_id,
            users!properties_owner_id_fkey (
              first_name,
              last_name,
              taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
                kadirs_id
              )
            )
          ),
          invoices (
            id,
            invoice_number,
            payment_status,
            total_amount
          )
        `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tax calculations:", error)
      return { calculations: [], error: error.message }
    }

    return { calculations: data, error: null }
  } catch (error) {
    console.error("Error in getTaxCalculations:", error)
    return { calculations: [], error: "Failed to fetch tax calculations" }
  }
}
