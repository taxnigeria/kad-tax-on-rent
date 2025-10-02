"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Invoice {
  id: string
  invoice_number: string
  bill_reference: string
  property_id: string
  taxpayer_id: string
  tax_year: number
  base_amount: number
  stamp_duty: number
  penalty: number
  interest: number
  discount: number
  total_amount: number
  amount_paid: number
  balance_due: number
  payment_status: string
  issue_date: string
  due_date: string
  paid_date: string | null
  narration: string | null
  is_printed: boolean
  print_count: number
  created_at: string
  property: {
    registered_property_name: string
    property_reference: string
    property_type: string
    house_number?: string
    street_name?: string
    address?: {
      street_address?: string
      city?: string
      state?: string
    }
  }
}

export interface InvoiceStats {
  totalOutstanding: number
  overdueCount: number
  totalPaidThisYear: number
  nextDueDate: string | null
}

export async function getTaxpayerInvoices(filters?: {
  status?: string
  taxYear?: number
  searchQuery?: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Build query
    let query = supabase
      .from("invoices")
      .select(
        `
        *,
        property:properties(
          registered_property_name,
          property_reference,
          property_type,
          house_number,
          street_name,
          address:addresses(
            street_address,
            city,
            state
          )
        )
      `,
      )
      .eq("taxpayer_id", user.id)
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq("payment_status", filters.status)
    }

    if (filters?.taxYear) {
      query = query.eq("tax_year", filters.taxYear)
    }

    if (filters?.searchQuery) {
      query = query.or(`invoice_number.ilike.%${filters.searchQuery}%,bill_reference.ilike.%${filters.searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching invoices:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Invoice[] }
  } catch (error) {
    console.error("[v0] Error in getTaxpayerInvoices:", error)
    return { success: false, error: "Failed to fetch invoices" }
  }
}

export async function getInvoiceStats() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get all invoices for stats calculation
    const { data: invoices, error } = await supabase.from("invoices").select("*").eq("taxpayer_id", user.id)

    if (error) {
      console.error("[v0] Error fetching invoice stats:", error)
      return { success: false, error: error.message }
    }

    const currentYear = new Date().getFullYear()
    const today = new Date().toISOString().split("T")[0]

    // Calculate stats
    const totalOutstanding = invoices
      .filter((inv) => inv.payment_status !== "paid")
      .reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0)

    const overdueCount = invoices.filter((inv) => inv.payment_status !== "paid" && inv.due_date < today).length

    const totalPaidThisYear = invoices
      .filter(
        (inv) =>
          inv.payment_status === "paid" && inv.paid_date && new Date(inv.paid_date).getFullYear() === currentYear,
      )
      .reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0)

    // Get next due date
    const upcomingInvoices = invoices
      .filter((inv) => inv.payment_status !== "paid" && inv.due_date >= today)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))

    const nextDueDate = upcomingInvoices.length > 0 ? upcomingInvoices[0].due_date : null

    const stats: InvoiceStats = {
      totalOutstanding,
      overdueCount,
      totalPaidThisYear,
      nextDueDate,
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error("[v0] Error in getInvoiceStats:", error)
    return { success: false, error: "Failed to fetch invoice stats" }
  }
}

export async function getInvoiceDetails(invoiceId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get invoice with property and payment details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        property:properties(
          registered_property_name,
          property_reference,
          property_type,
          house_number,
          street_name,
          address:addresses(
            street_address,
            city,
            state
          )
        )
      `,
      )
      .eq("id", invoiceId)
      .eq("taxpayer_id", user.id)
      .single()

    if (invoiceError) {
      console.error("[v0] Error fetching invoice details:", invoiceError)
      return { success: false, error: invoiceError.message }
    }

    // Get payment history
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: false })

    if (paymentsError) {
      console.error("[v0] Error fetching payments:", paymentsError)
    }

    return {
      success: true,
      data: {
        invoice,
        payments: payments || [],
      },
    }
  } catch (error) {
    console.error("[v0] Error in getInvoiceDetails:", error)
    return { success: false, error: "Failed to fetch invoice details" }
  }
}

export async function downloadInvoicePDF(invoiceId: string) {
  // This will be implemented with a PDF generation library
  // For now, return a placeholder
  revalidatePath("/taxpayer-dashboard/invoices")
  return { success: true, message: "PDF generation coming soon" }
}
