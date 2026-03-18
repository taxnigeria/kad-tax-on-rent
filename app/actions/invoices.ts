"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { payKadunaClient, getPayKadunaConfig } from "@/lib/paykaduna"

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
    area_office_id?: string
    area_office?: {
      office_name: string
      address: string
      area_officer?: {
        first_name: string
        last_name: string
      }
    }
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

export async function getTaxpayerInvoices(
  firebaseUid: string,
  filters?: {
    status?: string
    taxYear?: number
    searchQuery?: string
  },
) {
  try {
    const supabase = await createClient()

    // Get user ID from firebase_uid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { success: false, error: "User not found" }
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
          area_office_id,
          area_office:area_offices(office_name),
          address:addresses(
            street_address,
            city,
            state
          )
        )
      `,
      )
      .eq("taxpayer_id", userData.id)
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

export async function getInvoiceStats(firebaseUid: string) {
  try {
    const supabase = await createClient()

    // Get user ID from firebase_uid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { success: false, error: "User not found" }
    }

    // Get all invoices for stats calculation
    const { data: invoices, error } = await supabase.from("invoices").select("*").eq("taxpayer_id", userData.id)

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

export async function getInvoiceDetails(firebaseUid: string, invoiceId: string) {
  try {
    const supabase = await createClient()

    // Get user ID from firebase_uid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { success: false, error: "User not found" }
    }

    // Get invoice with property and area office details including area officer
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
          area_office_id,
          area_office:area_offices(
            office_name,
            address,
            area_officer:users!area_offices_area_officer_id_fkey(
              first_name,
              last_name
            )
          ),
          address:addresses(
            street_address,
            city,
            state
          )
        )
      `,
      )
      .eq("id", invoiceId)
      .eq("taxpayer_id", userData.id)
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

export async function generatePayKadunaInvoice(invoiceId: string) {
  try {
    const supabase = await createClient()

    // Get invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        property:properties(
          *,
          address:addresses(*)
        ),
        taxpayer:users!invoices_taxpayer_id_fkey(
          *,
          profile:taxpayer_profiles!taxpayer_profiles_user_id_fkey(*)
        )
      `,
      )
      .eq("id", invoiceId)
      .single()

    if (invoiceError || !invoice) {
      console.error("[v0] Error fetching invoice:", invoiceError)
      return { success: false, error: "Invoice not found" }
    }

    // Prepare PayKaduna request
    const taxpayerProfile = invoice.taxpayer?.profile
    if (!taxpayerProfile?.kadirs_id) {
      return { success: false, error: "Taxpayer KADIRS ID not found" }
    }

    // Build bill items array
    const billItems = []

    // Add stamp duty if present
    if (invoice.stamp_duty && invoice.stamp_duty > 0) {
      billItems.push({
        amount: Number(invoice.stamp_duty),
        mdasId: "132",
        narration: "Stamp Duty",
      })
    }

    // Add main tax (withholding tax on rent)
    const mainTaxAmount =
      Number(invoice.base_amount) +
      Number(invoice.penalty || 0) +
      Number(invoice.interest || 0) -
      Number(invoice.discount || 0)

    billItems.push({
      amount: mainTaxAmount,
      mdasId: "132",
      narration: `Withholding Tax on Rent - ${invoice.tax_year}`,
    })

    // Prepare request body using PayKaduna client (direct API)
    const config = await getPayKadunaConfig()
    const requestBody = {
      engineCode: config.engineCode,
      identifier: taxpayerProfile.kadirs_id,
      firstName: invoice.taxpayer.first_name || "",
      middleName: invoice.taxpayer.middle_name || "",
      lastName: invoice.taxpayer.last_name || "",
      telephone: invoice.taxpayer.phone_number || "",
      address: invoice.property?.address?.street_address || invoice.property?.street_name || "",
      esBillDetailsDto: billItems,
    }

    console.log("[PayKaduna] Creating bill with:", JSON.stringify(requestBody, null, 2))

    // Call PayKaduna API directly (replaces n8n webhook)
    const payKadunaResponse = await payKadunaClient.createBill(requestBody)
    console.log("[PayKaduna] Response:", JSON.stringify(payKadunaResponse, null, 2))

    // OLD n8n approach (kept for rollback reference):
    // const response = await fetch(
    //   "https://tax-nigeria-n8n.vwc4mb.easypanel.host/webhook/085cbdf3-a485-4ae2-8f03-6de83b5923be",
    //   { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.N8N_WEBHOOK_AUTH_TOKEN}` }, body: JSON.stringify(requestBody) },
    // )

    // Extract bill reference from response
    const billReference = payKadunaResponse.billItems?.[0]?.billReference

    if (!billReference) {
      console.error("[PayKaduna] No bill reference in response")
      return { success: false, error: "No bill reference received from PayKaduna" }
    }

    // Update invoice with bill reference
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        bill_reference: billReference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)

    if (updateError) {
      console.error("[PayKaduna] Error updating invoice with bill reference:", updateError)
      return { success: false, error: "Failed to update invoice with bill reference" }
    }

    revalidatePath("/admin/tax-calculations")
    revalidatePath("/taxpayer-dashboard/invoices")

    return {
      success: true,
      data: {
        billReference,
        payKadunaResponse,
      },
    }
  } catch (error) {
    console.error("[v0] Error in generatePayKadunaInvoice:", error)
    return { success: false, error: error instanceof Error ? `Failed to generate PayKaduna invoice: ${error.message}` : "Failed to generate PayKaduna invoice" }
  }
}

export async function createPayKadunaInvoice(invoiceData: {
  taxpayerId: string
  propertyId: string
  taxYear: number
  stampDuty: number
  baseTax: number
  penalty: number
  interest: number
  discount: number
  narration?: string
}) {
  try {
    const supabase = await createClient()

    // Get taxpayer and property data
    const { data: taxpayer, error: taxpayerError } = await supabase
      .from("users")
      .select(
        `
        *,
        profile:taxpayer_profiles!taxpayer_profiles_user_id_fkey(*)
      `,
      )
      .eq("id", invoiceData.taxpayerId)
      .single()

    if (taxpayerError || !taxpayer) {
      console.error("[v0] Error fetching taxpayer:", taxpayerError)
      return { success: false, error: "Taxpayer not found" }
    }

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select(
        `
        *,
        address:addresses(*)
      `,
      )
      .eq("id", invoiceData.propertyId)
      .single()

    if (propertyError || !property) {
      console.error("[v0] Error fetching property:", propertyError)
      return { success: false, error: "Property not found" }
    }

    // Check for KADIRS ID
    const taxpayerProfile = taxpayer.profile
    if (!taxpayerProfile?.kadirs_id) {
      return { success: false, error: "Taxpayer KADIRS ID not found" }
    }

    // Build bill items array
    const billItems = []

    // Add stamp duty if present
    if (invoiceData.stampDuty && invoiceData.stampDuty > 0) {
      billItems.push({
        amount: Number(invoiceData.stampDuty),
        mdasId: "132",
        narration: "Stamp Duty",
      })
    }

    // Add main tax (withholding tax on rent)
    const mainTaxAmount =
      Number(invoiceData.baseTax) +
      Number(invoiceData.penalty || 0) +
      Number(invoiceData.interest || 0) -
      Number(invoiceData.discount || 0)

    billItems.push({
      amount: mainTaxAmount,
      mdasId: "132",
      narration: invoiceData.narration || `Withholding Tax on Rent - ${invoiceData.taxYear}`,
    })

    // Prepare request body using PayKaduna client (direct API)
    const config = await getPayKadunaConfig()
    const requestBody = {
      engineCode: config.engineCode,
      identifier: taxpayerProfile.kadirs_id,
      firstName: taxpayer.first_name || "",
      middleName: taxpayer.middle_name || "",
      lastName: taxpayer.last_name || "",
      telephone: taxpayer.phone_number || "",
      address: property.address?.street_address || property.street_name || "",
      esBillDetailsDto: billItems,
    }

    console.log("[PayKaduna] Creating bill with:", JSON.stringify(requestBody, null, 2))

    // Call PayKaduna API directly (replaces n8n webhook)
    const payKadunaResponse = await payKadunaClient.createBill(requestBody)
    console.log("[PayKaduna] Response:", JSON.stringify(payKadunaResponse, null, 2))

    // OLD n8n approach (kept for rollback reference):
    // const response = await fetch(
    //   "https://tax-nigeria-n8n.vwc4mb.easypanel.host/webhook/085cbdf3-a485-4ae2-8f03-6de83b5923be",
    //   { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.N8N_WEBHOOK_AUTH_TOKEN}` }, body: JSON.stringify(requestBody) },
    // )

    // Extract bill reference from response
    const billReference = payKadunaResponse.billItems?.[0]?.billReference

    if (!billReference) {
      console.error("[PayKaduna] No bill reference in response")
      return { success: false, error: "No bill reference received from PayKaduna" }
    }

    return {
      success: true,
      data: {
        billReference,
        payKadunaResponse,
      },
    }
  } catch (error) {
    console.error("[PayKaduna] Error in createPayKadunaInvoice:", error)
    return { success: false, error: error instanceof Error ? `Failed to create PayKaduna invoice: ${error.message}` : "Failed to create PayKaduna invoice" }
  }
}

export async function createInvoiceFromTaxCalculation(taxCalculationId: string) {
  try {
    const supabase = await createClient()

    // Get tax calculation with property (to resolve owner/taxpayer)
    const { data: calculation, error: calcError } = await supabase
      .from("tax_calculations")
      .select(
        `
        *,
        property:properties(
          id,
          owner_id
        )
      `,
      )
      .eq("id", taxCalculationId)
      .single()

    if (calcError || !calculation) {
      console.error("[v0] Error fetching tax calculation:", calcError)
      return { success: false, error: "Tax calculation not found" }
    }

    // Resolve taxpayer_id from the property's owner_id
    const taxpayerId = calculation.property?.owner_id
    if (!taxpayerId) {
      console.error("[v0] No owner_id found on property for tax calculation:", taxCalculationId)
      return { success: false, error: "Property owner not found" }
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("tax_calculation_id", taxCalculationId)
      .single()

    if (existingInvoice) {
      return { success: false, error: "Invoice already exists for this tax calculation" }
    }

    // Create invoice record (using correct column names from tax_calculations table)
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        tax_calculation_id: taxCalculationId,
        property_id: calculation.property_id,
        taxpayer_id: taxpayerId,
        tax_year: calculation.tax_year,
        base_amount: calculation.base_tax_amount || 0,
        stamp_duty: calculation.stamp_duty || 0,
        penalty: calculation.penalty_amount || 0,
        interest: calculation.interest_amount || 0,
        discount: calculation.discount || 0,
        total_amount: calculation.total_tax_due || 0,
        amount_paid: 0,
        balance_due: calculation.total_tax_due || 0,
        payment_status: "unpaid",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        invoice_number: `INV-${Date.now()}`,
        is_printed: false,
        print_count: 0,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error("[v0] Error creating invoice:", invoiceError)
      return { success: false, error: "Failed to create invoice" }
    }

    // Generate bill reference via PayKaduna
    const billRefResult = await generatePayKadunaInvoice(invoice.id)

    if (!billRefResult.success) {
      // Delete the invoice if bill reference generation fails
      await supabase.from("invoices").delete().eq("id", invoice.id)
      return { success: false, error: billRefResult.error || "Failed to generate bill reference" }
    }

    revalidatePath("/admin/tax-calculations")
    revalidatePath("/admin/invoices")
    revalidatePath("/taxpayer-dashboard/invoices")

    return {
      success: true,
      data: invoice,
      billReference: billRefResult.data?.billReference,
    }
  } catch (error) {
    console.error("[v0] Error in createInvoiceFromTaxCalculation:", error)
    return { success: false, error: "Failed to create invoice" }
  }
}

export async function getInvoices(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  taxYear?: string
  propertyType?: string
  sortField?: string
  sortOrder?: "asc" | "desc"
}) {
  try {
    const adminSupabase = createAdminClient()
    const {
      page = 1,
      pageSize = 50,
      search,
      status,
      taxYear,
      propertyType,
      sortField = "created_at",
      sortOrder = "desc",
    } = params || {}

    let query = adminSupabase.from("invoices").select(
      `
          *,
          properties!inner (
            id,
            property_reference,
            registered_property_name,
            property_type,
            owner:users!owner_id (
              first_name,
              last_name,
              email,
              phone_number,
              taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
                kadirs_id
              )
            )
          ),
          tax_calculations (
            id,
            tax_year,
            backlog_years
          )
        `,
      { count: "exact" },
    )

    // Filters
    if (status && status !== "all") {
      if (status === "overdue") {
        const today = new Date().toISOString().split("T")[0]
        query = query.neq("payment_status", "paid").lt("due_date", today)
      } else {
        query = query.eq("payment_status", status)
      }
    }

    if (taxYear && taxYear !== "all") {
      query = query.eq("tax_year", parseInt(taxYear))
    }

    if (propertyType && propertyType !== "all") {
      query = query.eq("properties.property_type", propertyType)
    }

    // Search
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,bill_reference.ilike.%${search}%`)
    }

    // Sorting
    if (sortField) {
      query = query.order(sortField, { ascending: sortOrder === "asc" })
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching invoices:", error)
      return { invoices: [], error: error.message, totalCount: 0 }
    }

    return { invoices: data || [], error: null, totalCount: count || 0 }
  } catch (error) {
    console.error("Error in getInvoices:", error)
    return { invoices: [], error: "Failed to fetch invoices", totalCount: 0 }
  }
}
