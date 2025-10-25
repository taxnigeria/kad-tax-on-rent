"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DemandNoticeTemplate } from "@/components/print-templates/demand-notice-template"
import { InvoiceTemplate } from "@/components/print-templates/invoice-template"
import { IconPrinter, IconX } from "@tabler/icons-react"
import { useEffect } from "react"

interface InvoicePrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceData: {
    invoiceNumber: string
    date: string
    clientName: string
    propertyName: string
    clientPhone: string
    areaOffice: string
    recipientAddress: string
    assessmentYear: string
    actualAmount: number
    arrears: number
    stampDuty: number
    penalties: number
    interest: number
    totalOutstanding: number
    officerName: string
    items: Array<{ description: string; amount: number }>
    discount: number
    total: number
    paymentReference: string
  }
}

export function InvoicePrintDialog({ open, onOpenChange, invoiceData }: InvoicePrintDialogProps) {
  useEffect(() => {
    if (open) {
      // Add print styles when dialog opens
      const style = document.createElement("style")
      style.id = "print-styles"
      style.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .demand-notice-page, .invoice-page {
            page-break-after: always;
            padding: 2rem;
          }
          .invoice-page {
            page-break-after: auto;
          }
        }
      `
      document.head.appendChild(style)

      return () => {
        const existingStyle = document.getElementById("print-styles")
        if (existingStyle) {
          existingStyle.remove()
        }
      }
    }
  }, [open])

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="no-print flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="sm">
              <IconPrinter className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
              <IconX className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        <div className="print-content">
          {/* Page 1: Demand Notice */}
          <DemandNoticeTemplate
            recipientName={invoiceData.clientName}
            recipientAddress={invoiceData.recipientAddress}
            date={invoiceData.date}
            assessmentYear={invoiceData.assessmentYear}
            actualAmount={invoiceData.actualAmount}
            arrears={invoiceData.arrears}
            stampDuty={invoiceData.stampDuty}
            penalties={invoiceData.penalties}
            interest={invoiceData.interest}
            totalOutstanding={invoiceData.totalOutstanding}
            officerName={invoiceData.officerName}
            areaOffice={invoiceData.areaOffice}
          />

          {/* Page 2: Invoice */}
          <div className="mt-8">
            <InvoiceTemplate
              invoiceNumber={invoiceData.invoiceNumber}
              date={invoiceData.date}
              clientName={invoiceData.clientName}
              propertyName={invoiceData.propertyName}
              clientPhone={invoiceData.clientPhone}
              areaOffice={invoiceData.areaOffice}
              items={invoiceData.items}
              discount={invoiceData.discount}
              total={invoiceData.total}
              paymentReference={invoiceData.paymentReference}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
