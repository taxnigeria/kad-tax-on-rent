import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "Invoice ID is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Fetch the invoice to get required details
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("id, invoice_number, tax_year, taxpayer_id")
      .eq("id", invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    // Generate a bill reference using invoice_number and tax_year
    // Format: BILL-[TAX_YEAR]-[INVOICE_NUMBER]-[RANDOM_5_DIGITS]
    const randomSuffix = Math.floor(10000 + Math.random() * 90000)
    const billReference = `BILL-${invoice.tax_year}-${invoice.invoice_number}-${randomSuffix}`

    // Update the invoice with the generated bill reference
    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({ bill_reference: billReference })
      .eq("id", invoiceId)
      .select("bill_reference")
      .single()

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update invoice with bill reference" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      billReference: updated.bill_reference,
      message: "Bill reference generated successfully",
    })
  } catch (error) {
    console.error("Error generating bill reference:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
