import { getLegacyEnumerations } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: "Missing taxpayer ID" }, { status: 400 })
    }

    // We try multiple potential matching fields in parallel to ensure no data is missed
    const [propsById, propsByUid, propsByOwner] = await Promise.all([
      getLegacyEnumerations(undefined, 100, "date_created", "desc", "user_id", id),
      getLegacyEnumerations(undefined, 100, "date_created", "desc", "taxpayer_uid", id),
      getLegacyEnumerations(undefined, 100, "date_created", "desc", "owner_id", id),
    ])

    // Merge and deduplicate properties
    const propertyMap = new Map()
    ;[...propsById.enumerations, ...propsByUid.enumerations, ...propsByOwner.enumerations].forEach((p) => {
      propertyMap.set(p.id, p)
    })
    const userProperties = Array.from(propertyMap.values())

    return NextResponse.json({ properties: userProperties })
  } catch (error: any) {
    console.error(`[Legacy Taxpayer Properties API] Error for ${params.id}:`, error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
