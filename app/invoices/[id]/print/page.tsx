"use client"

import { getInvoiceDetails } from "@/app/actions/invoices"
import { DemandNoticeTemplate } from "@/components/print-templates/demand-notice-template"
import { InvoiceTemplate } from "@/components/print-templates/invoice-template"
import { Button } from "@/components/ui/button"
import { PrinterIcon } from "lucide-react"
import { notFound } from "next/navigation"

export default async function InvoicePrintPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getInvoiceDetails(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { invoice, payments } = result.data

  // Calculate demand notice data
  const demandNoticeData = {
    recipientName: invoice.property.registered_property_name,
    recipientAddress:
      `${invoice.property.house_number || ""} ${invoice.property.street_name || ""}, ${invoice.property.address?.city || ""}, ${invoice.property.address?.state || ""}`.trim(),
    date: new Date(invoice.issue_date).toLocaleDateString("en-GB"),
    assessmentYear: `${invoice.tax_year - 1}-${invoice.tax_year}`,
    actualAmount: invoice.base_amount,
    arrears: 0,
    stampDuty: invoice.stamp_duty,
    penalties: invoice.penalty,
    interest: invoice.interest,
    totalOutstanding: invoice.total_amount,
    officerName: "Williams Joe Fada",
    areaOffice: "Sabon Tasha Area Office",
  }

  // Calculate invoice data
  const invoiceItems = [
    {
      description: `Withholding Tax on Rent for ${invoice.tax_year}`,
      amount: invoice.base_amount,
    },
    {
      description: "Stamp Duty",
      amount: invoice.stamp_duty,
    },
  ]

  if (invoice.penalty > 0) {
    invoiceItems.push({
      description: "Penalties",
      amount: invoice.penalty,
    })
  }

  if (invoice.interest > 0) {
    invoiceItems.push({
      description: "Interest",
      amount: invoice.interest,
    })
  }

  const invoiceData = {
    invoiceNumber: invoice.invoice_number,
    date: new Date(invoice.issue_date).toLocaleDateString("en-GB"),
    clientName: invoice.property.registered_property_name,
    propertyName: invoice.property.registered_property_name,
    clientPhone: "N/A", // TODO: Get from taxpayer profile
    areaOffice: "Sabon Tasha Area Office",
    items: invoiceItems,
    discount: invoice.discount,
    total: invoice.total_amount,
    paymentReference: invoice.bill_reference,
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} size="lg" className="shadow-lg">
          <PrinterIcon className="mr-2 size-4" />
          Print Invoice
        </Button>
      </div>

      {/* Print Content */}
      <div className="print-container">
        {/* Page 1: Demand Notice */}
        <DemandNoticeTemplate {...demandNoticeData} />

        {/* Page 2: Invoice */}
        <InvoiceTemplate {...invoiceData} />
      </div>
    </div>
  )
}
