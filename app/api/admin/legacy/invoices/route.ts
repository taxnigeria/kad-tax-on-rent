import { getLegacyInvoices } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || searchParams.get("q") || undefined
    const lastDocId = searchParams.get("lastDocId") || undefined
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortField = searchParams.get("sortField") || "dateCreated"
    const sortOrder = (searchParams.get("sortOrder") || "desc") as 'asc' | 'desc'

    const { invoices, error } = await getLegacyInvoices(
      lastDocId, 
      limit, 
      sortField, 
      sortOrder, 
      undefined, 
      undefined, 
      query
    )
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      data: invoices,
      pagination: {
        lastDocId,
        limit,
        sortField,
        sortOrder
      },
    })
  } catch (error: any) {
    console.error("Error in legacy invoices route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
