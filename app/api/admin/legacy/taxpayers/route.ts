import { listFirebaseUsers } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || searchParams.get("q") || undefined
    const pageToken = searchParams.get("pageToken") || undefined
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortField = searchParams.get("sortField") || "displayName"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    const { users, nextPageToken, error } = await listFirebaseUsers(limit, pageToken, query, sortField, sortOrder as 'asc' | 'desc')
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      data: users,
      nextPageToken,
      pagination: {
        limit,
        sortField,
        sortOrder
      },
    })
  } catch (error: any) {
    console.error("Error in legacy taxpayers route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
