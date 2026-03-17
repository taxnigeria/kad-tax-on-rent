"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  MapPin, 
  Info, 
  Tag, 
  Calendar,
  Layers,
  Building,
  DollarSign,
  FileText
} from "lucide-react"
import { format } from "date-fns"

interface PropertyDetailsSectionProps {
  property: any
  invoices?: any[]
}

export function PropertyDetailsSection({ property, invoices = [] }: PropertyDetailsSectionProps) {
  // Helper to format timestamps from Firebase
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A"
    try {
      if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
        return format(new Date(dateValue.seconds * 1000), "MMM d, yyyy")
      }
      return format(new Date(dateValue), "MMM d, y")
    } catch {
      return "N/A"
    }
  }

  return (
    <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
      <div className="p-4 bg-muted/5 border-b border-muted-foreground/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-foreground">
                {property.registered_property_name || property.property_name || "Unnamed Property"}
              </h4>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                Property Ref: {property.kadirs_id || property.id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-right">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Area Office</p>
              <p className="text-xs font-bold">{property.area_office || property.lga || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Property Type</p>
              <p className="text-xs font-bold">{property.type_of_rent || property.property_type || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="text-left py-2 px-4 text-[10px] font-bold uppercase text-muted-foreground">Bill Reference</th>
              <th className="text-center py-2 px-4 text-[10px] font-bold uppercase text-muted-foreground">Amount (NGN)</th>
              <th className="text-center py-2 px-4 text-[10px] font-bold uppercase text-muted-foreground">Year</th>
              <th className="text-center py-2 px-4 text-[10px] font-bold uppercase text-muted-foreground">Status</th>
              <th className="text-right py-2 px-4 text-[10px] font-bold uppercase text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices && invoices.length > 0 ? (
              invoices.map((bill) => {
                const isPaid = bill.payStatus?.toLowerCase() === 'paid' || bill.payment_status?.toLowerCase() === 'paid';
                const year = bill.dateCreated ? new Date(bill.dateCreated).getFullYear() : bill.issue_date ? new Date(bill.issue_date).getFullYear() : "N/A";
                
                return (
                  <tr key={bill.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs uppercase font-medium">
                      {bill.billReference || bill.bill_reference || bill.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {Number(bill.amount || bill.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {year}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant={isPaid ? "default" : "outline"} 
                        className={cn(
                          "uppercase text-[9px] px-2 py-0.5 h-auto font-medium",
                          isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
                        )}
                      >
                        {bill.payStatus || bill.payment_status || 'unpaid'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase text-primary hover:text-primary hover:bg-primary/5">
                        {isPaid ? "Receipt" : "Pay Now"}
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs italic">
                  No billing history available for this property.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

