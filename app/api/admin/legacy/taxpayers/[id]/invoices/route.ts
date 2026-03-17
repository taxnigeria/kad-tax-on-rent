import { getLegacyInvoices } from "@/lib/firebase-admin"
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

    // We try multiple potential matching fields in parallel
    const [invByUserId, invByTaxpayerUid] = await Promise.all([
      getLegacyInvoices(undefined, 200, "dateCreated", "desc", "user_id", id),
      getLegacyInvoices(undefined, 200, "dateCreated", "desc", "taxpayer_uid", id),
    ])

    // Merge and deduplicate invoices
    const invoiceMap = new Map()
    ;[...invByUserId.invoices, ...invByTaxpayerUid.invoices].forEach((inv) => {
      invoiceMap.set(inv.id, inv)
    })
    const userInvoices = Array.from(invoiceMap.values())

    return NextResponse.json({ invoices: userInvoices })
  } catch (error: any) {
    console.error(`[Legacy Taxpayer Invoices API] Error for ${params.id}:`, error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
