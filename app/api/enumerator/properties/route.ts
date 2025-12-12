import { createClient } from "@/lib/supabase/client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const firebaseUid = searchParams.get("firebaseUid")
  const status = searchParams.get("status") // verified, pending, rejected

  if (!firebaseUid) {
    return NextResponse.json({ error: "Firebase UID is required" }, { status: 401 })
  }

  try {
    // Get the user by firebase_uid
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "enumerator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Map frontend status to database status values
    let dbStatus: string[] = []
    switch (status) {
      case "verified":
        dbStatus = ["verified"]
        break
      case "pending":
        dbStatus = ["submitted", "under_review"]
        break
      case "rejected":
        dbStatus = ["rejected"]
        break
      default:
        dbStatus = ["submitted", "under_review", "verified", "rejected"]
    }

    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(`
        id,
        registered_property_name,
        property_reference,
        property_type,
        property_category,
        status,
        total_annual_rent,
        house_number,
        street_name,
        created_at,
        area_offices (
          office_name,
          lgas (
            name
          )
        ),
        addresses (
          city,
          lga,
          state
        ),
        users!properties_owner_id_fkey (
          first_name,
          last_name,
          phone_number,
          email
        )
      `)
      .eq("enumerated_by", user.id)
      .in("status", dbStatus)
      .order("created_at", { ascending: false })

    if (propertiesError) {
      console.error("[v0] Properties fetch error:", propertiesError.message)
      return NextResponse.json(
        { error: "Failed to fetch properties", details: propertiesError.message },
        { status: 500 },
      )
    }

    if (properties && properties.length > 0) {
      const propertyIds = properties.map((p) => p.id)

      const { data: documents } = await supabase
        .from("documents")
        .select("entity_id, file_url, document_type")
        .eq("entity_type", "property")
        .in("entity_id", propertyIds)
        .in("document_type", ["property_facade", "address_number"])

      // Add documents array to each property
      const propertiesWithDocs = properties.map((property) => ({
        ...property,
        documents: documents?.filter((doc) => doc.entity_id === property.id) || [],
      }))

      return NextResponse.json({
        success: true,
        properties: propertiesWithDocs,
        count: propertiesWithDocs.length,
      })
    }

    return NextResponse.json({
      success: true,
      properties: properties || [],
      count: properties?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Properties API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
