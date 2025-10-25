"use client"

import { Button } from "@/components/ui/button"
import { PrinterIcon } from "lucide-react"

export function PrintButton() {
  return (
    <div className="no-print fixed top-4 right-4 z-50">
      <Button onClick={() => window.print()} size="lg" className="shadow-lg">
        <PrinterIcon className="mr-2 size-4" />
        Print Invoice
      </Button>
    </div>
  )
}
