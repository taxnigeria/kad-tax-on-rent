"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DemandNoticeTemplate } from "@/components/print-templates/demand-notice-template"
import { InvoiceTemplate } from "@/components/print-templates/invoice-template"
import { IconPrinter, IconX, IconZoomIn, IconZoomOut } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

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
    areaOfficeAddress: string
    recipientAddress: string
    assessmentYear: string
    taxYears: number
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

// Portal for print content to ensure it is isolated from the modal and renders correctly
const PrintPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  if (typeof document === "undefined") return null

  return createPortal(<div className="print-portal-root">{children}</div>, document.body)
}

export function InvoicePrintDialog({ open, onOpenChange, invoiceData }: InvoicePrintDialogProps) {
  const [includeDemandNotice, setIncludeDemandNotice] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [zoom, setZoom] = useState(0.7)

  useEffect(() => {
    if (open) {
      // Add print styles dynamically
      const style = document.createElement("style")
      style.id = "print-styles"
      style.textContent = `
        @media print {
          @page {
            size: auto;
            margin: 11mm;
          }
          body {
            background-color: white !important;
          }
          /* Hide everything by default */
          body > * {
            display: none !important;
          }
          /* Show only our portal */
          body > .print-portal-root {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            min-height: 100%;
            background: white;
            z-index: 9999;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            min-height: 100vh;
            width: 100%;
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
        /* Screen styles for the portal - hidden */
        .print-portal-root {
          display: none;
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
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const demandNoticeComponent = (
    <DemandNoticeTemplate
      recipientName={invoiceData.propertyName}
      recipientAddress={invoiceData.recipientAddress}
      date={invoiceData.date}
      assessmentYear={invoiceData.assessmentYear}
      taxYears={invoiceData.taxYears}
      actualAmount={invoiceData.actualAmount}
      arrears={invoiceData.arrears}
      stampDuty={invoiceData.stampDuty}
      penalties={invoiceData.penalties}
      interest={invoiceData.interest}
      totalOutstanding={invoiceData.totalOutstanding}
      officerName={invoiceData.officerName}
      areaOffice={invoiceData.areaOffice}
      areaOfficeAddress={invoiceData.areaOfficeAddress}
    />
  )

  const invoiceComponent = (
    <InvoiceTemplate
      invoiceNumber={invoiceData.invoiceNumber}
      date={invoiceData.date}
      clientName={invoiceData.propertyName}
      propertyName={invoiceData.recipientAddress}
      clientPhone={invoiceData.clientPhone}
      areaOffice={invoiceData.areaOffice}
      areaOfficeAddress={invoiceData.areaOfficeAddress}
      baseAmount={invoiceData.actualAmount}
      stampDuty={invoiceData.stampDuty}
      interest={invoiceData.interest}
      penalty={invoiceData.penalties}
      discount={invoiceData.discount}
      total={invoiceData.totalOutstanding}
      paymentReference={invoiceData.paymentReference}
    />
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-7xl !w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0 bg-muted/10 shrink-0">
            <div className="flex flex-col gap-1">
              <DialogTitle>Print Preview</DialogTitle>
              <DialogDescription>Review the documents before printing.</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <IconX className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left Column - Preview Area */}
            <div className="flex-1 bg-muted/30 relative overflow-hidden flex flex-col">
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
                  disabled={zoom <= 0.3}
                >
                  <IconZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                  disabled={zoom >= 1.5}
                >
                  <IconZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Scrollable Preview Canvas */}
              <div className="flex-1 overflow-auto p-8">
                <div
                  className="flex flex-col items-center gap-8 origin-top transition-transform duration-200 ease-out"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                >
                  {includeDemandNotice && (
                    <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl ring-1 ring-gray-900/5">
                      {demandNoticeComponent}
                      <div className="text-center text-[10px] text-muted-foreground py-2 border-t bg-muted/5 mt-auto">
                        Page 1: Demand Notice
                      </div>
                    </div>
                  )}

                  <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl ring-1 ring-gray-900/5">
                    {invoiceComponent}
                    <div className="text-center text-[10px] text-muted-foreground py-2 border-t bg-muted/5 mt-auto">
                      Page {includeDemandNotice ? "2" : "1"}: Invoice
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Settings & Actions */}
            <div className="w-full md:w-80 bg-background border-l flex flex-col shrink-0 z-20 shadow-xl md:shadow-none">
              <div className="p-6 flex-1">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <IconPrinter className="size-4" />
                  Print Settings
                </h3>

                <div className="space-y-6">
                  <div
                    className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setIncludeDemandNotice(!includeDemandNotice)}
                  >
                    <Checkbox
                      id="includeDemandNotice"
                      checked={includeDemandNotice}
                      onCheckedChange={(checked) => setIncludeDemandNotice(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="includeDemandNotice"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Include Demand Notice
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Print the formal demand notice alongside the invoice.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md bg-blue-50 p-4 text-xs text-blue-900 border border-blue-100">
                    <p className="font-semibold mb-1">Document Summary</p>
                    <ul className="space-y-1 list-disc list-inside opacity-80">
                      {includeDemandNotice && <li>Demand Notice (Letterhead)</li>}
                      <li>Payment Invoice (QR Code)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-muted/10 space-y-3">
                <Button
                  onClick={handlePrint}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base shadow-sm"
                  disabled={isPrinting}
                >
                  <IconPrinter className="mr-2 size-4" />
                  {isPrinting ? "Preparing..." : "Print Documents"}
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Print Portal - This is what actually gets printed */}
      <PrintPortal>
        <div className="print-container font-sans">
          {includeDemandNotice && <div className="print-page">{demandNoticeComponent}</div>}
          <div className="print-page">{invoiceComponent}</div>
        </div>
      </PrintPortal>
    </>
  )
}
