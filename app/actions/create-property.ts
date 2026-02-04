"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { put } from "@vercel/blob"
import { logAudit } from "./audit"

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
  firebaseUid: string
}

export async function createProperty(data: CreatePropertyData) {
  try {
    const supabase = await createClient()

    // First, get the database user ID from Firebase UID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", data.firebaseUid)
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

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
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
        admin_notes: data.registeringForSomeoneElse ? "Property registered on behalf of another taxpayer" : null,
      })
      .select()
      .single()

    if (propertyError) {
      console.error("Property creation error:", propertyError)
      return {
        success: false,
        error: "Failed to create property",
      }
    }

    // Log property creation
    await logAudit({
      action: "create",
      entityType: "properties",
      entityId: property.id,
      changeSummary: `Registered property: ${data.propertyName} at ${data.houseNumber} ${data.streetName}`
    })

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

export async function enumerateProperty(formData: FormData) {
  try {
    const supabase = createAdminClient()

    const firebaseUid = formData.get("firebaseUid") as string
    if (!firebaseUid) return { success: false, error: "Firebase UID is required" }

    // Verify user exists and is an enumerator
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) return { success: false, error: "Authorized user not found" }
    if (userData.role !== "enumerator") return { success: false, error: "Forbidden - Enumerator access only" }

    // Extract property data
    const taxpayerId = formData.get("taxpayerId") as string

    // Try to find by profile ID first, then by user ID as fallback
    let taxpayerProfile: any = null

    const { data: profileById } = await supabase
      .from("taxpayer_profiles")
      .select("id, user_id")
      .eq("id", taxpayerId)
      .maybeSingle()

    if (profileById) {
      taxpayerProfile = profileById
    } else {
      // Fallback: search by user_id
      const { data: profileByUserId } = await supabase
        .from("taxpayer_profiles")
        .select("id, user_id")
        .eq("user_id", taxpayerId)
        .maybeSingle()

      if (profileByUserId) {
        taxpayerProfile = profileByUserId
      }
    }

    if (!taxpayerProfile) {
      return { success: false, error: "Taxpayer profile not found" }
    }

    const propertyName = formData.get("propertyName") as string
    const propertyType = formData.get("propertyType") as string
    const propertyCategory = formData.get("propertyCategory") as string
    const houseNumber = formData.get("houseNumber") as string
    const streetName = formData.get("streetName") as string
    const city = formData.get("city") as string
    const lga = formData.get("lga") as string
    const areaOfficeId = formData.get("areaOfficeId") as string
    const totalUnits = formData.get("totalUnits") as string
    const annualRent = formData.get("annualRent") as string
    const latitude = formData.get("latitude") as string
    const longitude = formData.get("longitude") as string
    const enumerationNotes = formData.get("enumerationNotes") as string
    const rentalCommencementDate = formData.get("rentalCommencementDate") as string

    // Photos
    const facadePhoto = formData.get("facadePhoto") as File | null
    const addressNumberPhoto = (formData.get("addressNumberPhoto") || formData.get("addressPhoto")) as File | null

    if (!facadePhoto) {
      return { success: false, error: "Facade photo is required" }
    }

    // Upload photos to Vercel Blob
    let facadeUrl = ""
    let addressNumberUrl = ""

    try {
      const facadeBlob = await put(`properties/${taxpayerId}/facade-${Date.now()}.jpg`, facadePhoto, { access: "public" })
      facadeUrl = facadeBlob.url

      if (addressNumberPhoto) {
        const addressBlob = await put(`properties/${taxpayerId}/address-${Date.now()}.jpg`, addressNumberPhoto, { access: "public" })
        addressNumberUrl = addressBlob.url
      }
    } catch (uploadError) {
      console.error("[Enumerate] Photo upload error:", uploadError)
      return { success: false, error: "Failed to upload photos" }
    }

    // Create address
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        street_address: `${houseNumber} ${streetName}`,
        city: city || null,
        lga: lga || null,
        state: "Kaduna",
        country: "Nigeria",
        latitude: latitude ? Number.parseFloat(latitude) : null,
        longitude: longitude ? Number.parseFloat(longitude) : null,
      })
      .select()
      .single()

    if (addressError) return { success: false, error: "Failed to create address" }

    const propertyReference = `PROP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        owner_id: taxpayerProfile.user_id,
        registered_for_taxpayer_id: taxpayerProfile.user_id,
        registered_property_name: propertyName,
        property_reference: propertyReference,
        property_type: propertyType,
        property_category: propertyCategory || null,
        house_number: houseNumber,
        street_name: streetName,
        address_id: address.id,
        total_units: totalUnits ? Number.parseInt(totalUnits) : null,
        total_annual_rent: annualRent ? Number.parseFloat(annualRent.replace(/,/g, "")) : null,
        rental_commencement_date: rentalCommencementDate || new Date().toISOString().split("T")[0],
        enumerated_by: userData.id,
        enumeration_date: new Date().toISOString().split("T")[0],
        enumeration_notes: enumerationNotes || null,
        area_office_id: areaOfficeId || null,
        verification_status: "pending",
        status: "submitted",
      })
      .select()
      .single()

    if (propertyError) return { success: false, error: "Failed to create property record" }

    // Store photo URLs in documents table
    const documents = [
      {
        entity_type: "property",
        entity_id: property.id,
        document_type: "property_facade",
        document_name: "Facade Photo",
        file_url: facadeUrl,
        uploaded_by: userData.id,
      },
    ]

    if (addressNumberUrl) {
      documents.push({
        entity_type: "property",
        entity_id: property.id,
        document_type: "address_number",
        document_name: "Address Number Photo",
        file_url: addressNumberUrl,
        uploaded_by: userData.id,
      })
    }

    await supabase.from("documents").insert(documents)

    // Log activity
    await logAudit({
      userId: userData.id,
      action: "create",
      entityType: "properties",
      entityId: property.id,
      changeSummary: `Enumerator registered property: ${propertyName} at ${houseNumber} ${streetName}`,
      newValues: {
        latitude: latitude || null,
        longitude: longitude || null,
        photos: { facade: facadeUrl, addressNumber: addressNumberUrl || null }
      }
    })

    return {
      success: true,
      propertyId: property.id,
      propertyReference
    }
  } catch (error: any) {
    console.error("[Enumerate] Error:", error)
    return { success: false, error: error.message || "Internal server error" }
  }
}
