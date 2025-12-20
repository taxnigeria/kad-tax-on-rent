"use server"

import { createClient } from "@/lib/supabase/server"

interface CreatePropertyData {
  propertyName: string
  propertyType: string
  propertyCategory: string
  businessType: string
  commencementYear?: number
  registeringForSomeoneElse: boolean
  houseNumber: string
  streetName: string
  city: string
  state: string
  lga: string
  totalUnits: number
  occupiedUnits: number
  totalAnnualRent: number
  floorArea?: number
  latitude?: number
  longitude?: number
  authId: string
}

export async function createProperty(data: CreatePropertyData) {
  try {
    const supabase = await createClient()

    // First, get the database user ID from auth_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", data.authId)
      .single()

    if (userError || !userData) {
      return {
        success: false,
        error: "User not found in database",
      }
    }

    const { data: addressData, error: addressError } = await supabase
      .from("addresses")
      .insert({
        street_address: `${data.houseNumber} ${data.streetName}`,
        city: data.city,
        state: data.state,
        lga: data.lga,
        country: "Nigeria",
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      })
      .select()
      .single()

    if (addressError) {
      return {
        success: false,
        error: "Failed to create address",
      }
    }

    const commencementDate = data.commencementYear
      ? `${data.commencementYear}-01-01`
      : new Date().toISOString().split("T")[0]

    const { error: propertyError } = await supabase.from("properties").insert({
      owner_id: userData.id,
      registered_property_name: data.propertyName,
      property_type: data.propertyType,
      property_category: data.propertyCategory,
      business_type: data.businessType,
      house_number: data.houseNumber,
      street_name: data.streetName,
      address_id: addressData.id,
      total_units: data.totalUnits,
      occupied_units: data.occupiedUnits,
      total_annual_rent: data.totalAnnualRent,
      total_floor_area: data.floorArea || 0,
      rental_commencement_date: commencementDate,
      verification_status: "pending",
      status: "draft",
      // If registering for someone else, we'll need to handle this separately
      // For now, we'll add a note in admin_notes
      admin_notes: data.registeringForSomeoneElse ? "Property registered on behalf of another taxpayer" : null,
    })

    if (propertyError) {
      console.error("Property creation error:", propertyError)
      return {
        success: false,
        error: "Failed to create property",
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error creating property:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
