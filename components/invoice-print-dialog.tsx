"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DemandNoticeTemplate } from "@/components/print-templates/demand-notice-template"
import { InvoiceTemplate } from "@/components/print-templates/invoice-template"
import { IconPrinter, IconX } from "@tabler/icons-react"
import { useEffect, useState } from "react"

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
    discount: number
    total: number
    paymentReference: string
  }
}

export function InvoicePrintDialog({ open, onOpenChange, invoiceData }: InvoicePrintDialogProps) {
  const [includeDemandNotice, setIncludeDemandNotice] = useState(true)

  useEffect(() => {
    if (open) {
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
          .invoice-page, .demand-notice-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .invoice-page:last-of-type {
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - No Print */}
        <div className="no-print border-b pb-4">
          <h2 className="text-xl font-semibold mb-4">Print Invoice</h2>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Left Column - Preview */}
          <div className="flex-1 overflow-y-auto border-r pr-4">
            <div className="print-content space-y-6">
              {/* Demand Notice Page */}
              {includeDemandNotice && (
                <div>
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
                </div>
              )}

              {/* Invoice Page */}
              <div>
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
          </div>

          {/* Right Column - Settings and Actions */}
          <div className="no-print w-64 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-sm mb-4">Print Options</h3>

              <div className="flex items-center space-x-2 mb-6">
                <Checkbox
                  id="includeDemandNotice"
                  checked={includeDemandNotice}
                  onCheckedChange={(checked) => setIncludeDemandNotice(checked as boolean)}
                />
                <label htmlFor="includeDemandNotice" className="text-sm cursor-pointer font-medium">
                  Include Demand Notice
                </label>
              </div>

              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium">Page Summary:</p>
                <ul className="list-disc list-inside space-y-1">
                  {includeDemandNotice && <li>Page 1: Demand Notice</li>}
                  <li>Page {includeDemandNotice ? "2" : "1"}: Invoice</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-col">
              <Button onClick={handlePrint} className="w-full bg-blue-600 hover:bg-blue-700">
                <IconPrinter className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <IconX className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
