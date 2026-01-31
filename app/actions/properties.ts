"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getProperties(params?: {
    page?: number
    pageSize?: number
    search?: string
    propertyType?: string
    verificationStatus?: string
    status?: string
    sortField?: string
    sortOrder?: "asc" | "desc"
}) {
    try {
        const adminSupabase = createAdminClient()
        const {
            page = 1,
            pageSize = 50,
            search,
            propertyType,
            verificationStatus,
            status,
            sortField = "created_at",
            sortOrder = "desc",
        } = params || {}

        let query = adminSupabase.from("properties").select(
            `
        *,
        users!properties_owner_id_fkey (
          id,
          first_name,
          last_name,
          email,
          taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
            kadirs_id
          )
        )
      `,
            { count: "exact" },
        )

        // Filters
        if (propertyType && propertyType !== "all") {
            query = query.eq("property_type", propertyType)
        }

        if (verificationStatus && verificationStatus !== "all") {
            query = query.eq("verification_status", verificationStatus)
        }

        if (status && status !== "all") {
            query = query.eq("status", status)
        }

        // Search
        if (search) {
            query = query.or(`registered_property_name.ilike.%${search}%,property_reference.ilike.%${search}%,street_name.ilike.%${search}%`)
            // Note: Full searching across joined tables (owner name) might require a different approach or specialized query if needed.
        }

        // Sorting
        if (sortField) {
            if (sortField === "owner_name") {
                // Unfortunately Supabase client doesn't support easy sorting on joined fields in the same way 
                // as local fields without raw SQL or a view. We'll default to created_at if not possible.
                query = query.order("created_at", { ascending: sortOrder === "asc" })
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
            console.error("Error fetching properties:", error)
            return { properties: [], error: error.message, totalCount: 0 }
        }

        return { properties: data || [], error: null, totalCount: count || 0 }
    } catch (error) {
        console.error("Error in getProperties:", error)
        return { properties: [], error: "Failed to fetch properties", totalCount: 0 }
    }
}
