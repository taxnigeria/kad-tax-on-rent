"use client"

import { getInvoiceDetails } from "@/app/actions/invoices"
import { DemandNoticeTemplate } from "@/components/print-templates/demand-notice-template"
import { InvoiceTemplate } from "@/components/print-templates/invoice-template"
import { notFound } from "next/navigation"
import { PrintButton } from "@/components/print-button"

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getInvoiceDetails(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { invoice } = result.data

  const demandNoticeData = {
    recipientName: invoice.property.registered_property_name,
    recipientAddress:
      `${invoice.property.house_number || ""} ${invoice.property.street_name || ""}, ${invoice.property.address?.city || ""}, ${invoice.property.address?.state || ""}`.trim(),
    date: new Date(invoice.issue_date).toLocaleDateString("en-GB"),
    assessmentYear: `${invoice.tax_year - 1}-${invoice.tax_year}`,
    actualAmount: invoice.base_amount || 0,
    arrears: 0,
    stampDuty: invoice.stamp_duty || 0,
    penalties: invoice.penalty || 0,
    interest: invoice.interest || 0,
    totalOutstanding: invoice.total_amount || 0,
    officerName: "Williams Joe Fada",
    areaOffice: "Sabon Tasha Area Office",
  }

  const invoiceData = {
    invoiceNumber: invoice.invoice_number,
    date: new Date(invoice.issue_date).toLocaleDateString("en-GB"),
    clientName: invoice.property.registered_property_name,
    propertyName: invoice.property.registered_property_name,
    clientPhone: "N/A",
    areaOffice: "Sabon Tasha Area Office",
    recipientAddress:
      `${invoice.property.house_number || ""} ${invoice.property.street_name || ""}, ${invoice.property.address?.city || ""}, ${invoice.property.address?.state || ""}`.trim(),
    assessmentYear: `${invoice.tax_year - 1}-${invoice.tax_year}`,
    actualAmount: invoice.base_amount || 0,
    arrears: 0,
    stampDuty: invoice.stamp_duty || 0,
    penalties: invoice.penalty || 0,
    interest: invoice.interest || 0,
    totalOutstanding: invoice.total_amount || 0,
    officerName: "Williams Joe Fada",
    discount: invoice.discount || 0,
    total: invoice.total_amount || 0,
    paymentReference: invoice.bill_reference,
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50">
        <PrintButton onClick={() => window.print()} size="lg" className="shadow-lg">
          Print Invoice
        </PrintButton>
      </div>

      {/* Print Content */}
      <div className="print-container space-y-8">
        {/* Page 1: Demand Notice */}
        <DemandNoticeTemplate {...demandNoticeData} />

        {/* Page 2: Invoice */}
        <InvoiceTemplate
          invoiceNumber={invoiceData.invoiceNumber}
          date={invoiceData.date}
          clientName={invoiceData.clientName}
          propertyName={invoiceData.propertyName}
          clientPhone={invoiceData.clientPhone}
          areaOffice={invoiceData.areaOffice}
          areaOfficeAddress={invoiceData.recipientAddress}
          baseAmount={invoiceData.actualAmount}
          stampDuty={invoiceData.stampDuty}
          interest={invoiceData.interest}
          penalty={invoiceData.penalties}
          discount={invoiceData.discount}
          total={invoiceData.totalOutstanding}
          paymentReference={invoiceData.paymentReference}
        />
      </div>
    </div>
  )
}
