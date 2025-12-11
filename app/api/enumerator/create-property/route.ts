import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const formData = await request.formData()

    const firebaseUid = formData.get("firebaseUid") as string

    if (!firebaseUid) {
      return NextResponse.json({ error: "Firebase UID is required" }, { status: 401 })
    }

    // Verify user exists and is an enumerator
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (userData.role !== "enumerator") {
      return NextResponse.json({ error: "Forbidden - Enumerator access only" }, { status: 403 })
    }

    // Extract property data
    const taxpayerId = formData.get("taxpayerId") as string

    const { data: taxpayerProfile, error: taxpayerError } = await supabase
      .from("taxpayer_profiles")
      .select("user_id")
      .eq("id", taxpayerId)
      .single()

    if (taxpayerError || !taxpayerProfile) {
      return NextResponse.json({ error: "Taxpayer not found" }, { status: 404 })
    }

    const propertyName = formData.get("propertyName") as string
    const propertyType = formData.get("propertyType") as string
    const propertyCategory = formData.get("propertyCategory") as string
    const houseNumber = formData.get("houseNumber") as string
    const streetName = formData.get("streetName") as string
    const city = formData.get("city") as string
    const lga = formData.get("lga") as string
    const state = formData.get("state") as string
    const totalUnits = formData.get("totalUnits") as string
    const annualRent = formData.get("annualRent") as string
    const latitude = formData.get("latitude") as string
    const longitude = formData.get("longitude") as string
    const enumerationNotes = formData.get("enumerationNotes") as string
    const areaOfficeId = formData.get("areaOfficeId") as string

    // Photos (compulsory)
    const facadePhoto = formData.get("facadePhoto") as File | null
    const addressNumberPhoto = (formData.get("addressNumberPhoto") || formData.get("addressPhoto")) as File | null

    // Validation
    if (!taxpayerId || !propertyName || !propertyType || !houseNumber || !streetName) {
      return NextResponse.json(
        {
          error: "Missing required fields: taxpayerId, propertyName, propertyType, houseNumber, streetName",
        },
        { status: 400 },
      )
    }

    if (!facadePhoto || !addressNumberPhoto) {
      return NextResponse.json(
        {
          error: "Facade photo and address number photo are required",
        },
        { status: 400 },
      )
    }

    // Upload photos to Vercel Blob
    let facadeUrl = ""
    let addressNumberUrl = ""

    try {
      const facadeBlob = await put(`properties/${taxpayerId}/facade-${Date.now()}.jpg`, facadePhoto, {
        access: "public",
      })
      facadeUrl = facadeBlob.url

      const addressBlob = await put(`properties/${taxpayerId}/address-${Date.now()}.jpg`, addressNumberPhoto, {
        access: "public",
      })
      addressNumberUrl = addressBlob.url
    } catch (uploadError) {
      console.error("[v0] Photo upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload photos" }, { status: 500 })
    }

    // Create address first
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        street_address: `${houseNumber} ${streetName}`,
        city: city || null,
        lga: lga || null,
        state: state || "Kaduna",
        country: "Nigeria",
        latitude: latitude ? Number.parseFloat(latitude) : null,
        longitude: longitude ? Number.parseFloat(longitude) : null,
      })
      .select()
      .single()

    if (addressError) {
      console.error("[v0] Create address error:", addressError)
      return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
    }

    // Create property - use taxpayerProfile.user_id as owner_id
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        owner_id: taxpayerProfile.user_id,
        registered_for_taxpayer_id: taxpayerId,
        registered_property_name: propertyName,
        property_type: propertyType,
        property_category: propertyCategory || null,
        house_number: houseNumber,
        street_name: streetName,
        address_id: address.id,
        total_units: totalUnits ? Number.parseInt(totalUnits) : null,
        total_annual_rent: annualRent ? Number.parseFloat(annualRent) : null,
        enumerated_by: userData.id,
        enumeration_date: new Date().toISOString().split("T")[0],
        enumeration_notes: enumerationNotes || null,
        area_office_id: areaOfficeId || null,
        verification_status: "pending",
        status: "pending",
      })
      .select()
      .single()

    if (propertyError) {
      console.error("[v0] Create property error:", propertyError)
      return NextResponse.json({ error: "Failed to create property" }, { status: 500 })
    }

    // Store photo URLs in documents table
    await supabase.from("documents").insert([
      {
        entity_type: "property",
        entity_id: property.id,
        document_type: "property_facade",
        document_name: "Facade Photo",
        file_url: facadeUrl,
        uploaded_by: userData.id,
      },
      {
        entity_type: "property",
        entity_id: property.id,
        document_type: "address_number",
        document_name: "Address Number Photo",
        file_url: addressNumberUrl,
        uploaded_by: userData.id,
      },
    ])

    // Log activity for gamification
    await supabase.from("audit_logs").insert({
      user_id: userData.id,
      entity_type: "property",
      entity_id: property.id,
      action: "create",
      change_summary: `Enumerator created property: ${propertyName} at ${houseNumber} ${streetName}`,
      new_values: {
        latitude: latitude || null,
        longitude: longitude || null,
        photos: { facade: facadeUrl, addressNumber: addressNumberUrl },
      },
    })

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        propertyName,
        propertyReference: property.property_reference,
        verificationStatus: property.verification_status,
      },
    })
  } catch (error) {
    console.error("[v0] Create property API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
