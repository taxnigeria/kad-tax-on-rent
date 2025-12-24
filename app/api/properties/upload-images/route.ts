import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()

    const propertyId = formData.get("propertyId") as string
    const facadeImage = formData.get("facadeImage") as File | null
    const addressNumberImage = formData.get("addressNumberImage") as File | null
    const otherImage = formData.get("otherImage") as File | null
    const otherImageName = formData.get("otherImageName") as string | null

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }

    const uploadedFiles: Array<{ type: string; url: string; name: string }> = []

    if (facadeImage) {
      const { data: existingFacade } = await supabase
        .from("documents")
        .select("*")
        .eq("entity_id", propertyId)
        .eq("document_type", "property_facade")

      console.log("[v0] Existing facade documents:", existingFacade?.length)

      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("entity_id", propertyId)
        .eq("document_type", "property_facade")

      if (deleteError) {
        console.error("[v0] Error deleting old facade documents:", deleteError)
      }

      const blob = await put(`properties/${propertyId}/facade-${Date.now()}.jpg`, facadeImage, {
        access: "public",
      })
      uploadedFiles.push({ type: "property_facade", url: blob.url, name: "Facade Photo" })
    }

    if (addressNumberImage) {
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("entity_id", propertyId)
        .eq("document_type", "address_number")

      if (deleteError) {
        console.error("[v0] Error deleting old address documents:", deleteError)
      }

      const blob = await put(`properties/${propertyId}/address-number-${Date.now()}.jpg`, addressNumberImage, {
        access: "public",
      })
      uploadedFiles.push({ type: "address_number", url: blob.url, name: "Address Number Photo" })
    }

    if (otherImage && otherImageName) {
      const blob = await put(`properties/${propertyId}/other-${Date.now()}.jpg`, otherImage, {
        access: "public",
      })
      uploadedFiles.push({ type: "other_document", url: blob.url, name: otherImageName })
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
    }

    console.log("[v0] Files to insert:", uploadedFiles)

    // Store in documents table
    const documentsToInsert = uploadedFiles.map((file) => ({
      entity_type: "property",
      entity_id: propertyId,
      document_type: file.type,
      document_name: file.name,
      file_url: file.url,
    }))

    const { error: insertError } = await supabase.from("documents").insert(documentsToInsert)

    if (insertError) {
      console.error("[v0] Insert documents error:", insertError)
      return NextResponse.json({ error: "Failed to save document metadata" }, { status: 500 })
    }

    console.log("[v0] Successfully inserted documents")

    return NextResponse.json({
      success: true,
      files: uploadedFiles.map((f) => ({ type: f.type, url: f.url, name: f.name })),
    })
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
