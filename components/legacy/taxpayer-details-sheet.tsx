"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Home, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  CreditCard,
  History,
  Loader2,
  Printer,
  Edit,
  Plus,
  Briefcase,
  Clock,
  Building,
  Info
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PropertyDetailsSection } from "./property-details-section"
import { cn } from "@/lib/utils"

interface TaxpayerDetailsSheetProps {
  taxpayerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaxpayerDetailsSheet({
  taxpayerId,
  open,
  onOpenChange,
}: TaxpayerDetailsSheetProps) {
  const [loading, setLoading] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [taxpayer, setTaxpayer] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    if (open && taxpayerId) {
      fetchTaxpayerDetails(taxpayerId)
    } else {
      setTaxpayer(null)
      setProperties([])
      setInvoices([])
    }
  }, [open, taxpayerId])

  const fetchTaxpayerDetails = async (id: string) => {
    setLoading(true)
    setTaxpayer(null)
    setProperties([])
    setInvoices([])
    
    try {
      // Step 1: Fetch Profile only
      const profileRes = await fetch(`/api/admin/legacy/taxpayers/${id}`)
      const profileResult = await profileRes.json()
      
      if (profileResult.data?.taxpayer) {
        setTaxpayer(profileResult.data.taxpayer)
        setLoading(false) // Profile is visible now

        // Step 2: Fetch Properties and Invoices lazily
        setLoadingProperties(true)
        setLoadingInvoices(true)

        // Fetch properties
        fetch(`/api/admin/legacy/taxpayers/${id}/properties`)
          .then(res => res.json())
          .then(data => {
            if (data.properties) setProperties(data.properties)
          })
          .catch(err => console.error("Error fetching properties:", err))
          .finally(() => setLoadingProperties(false))

        // Fetch invoices
        fetch(`/api/admin/legacy/taxpayers/${id}/invoices`)
          .then(res => res.json())
          .then(data => {
            if (data.invoices) setInvoices(data.invoices)
          })
          .catch(err => console.error("Error fetching invoices:", err))
          .finally(() => setLoadingInvoices(false))
      }
    } catch (error) {
      console.error("Error fetching taxpayer details:", error)
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[700px] w-[95vw] p-0 flex flex-col gap-0 border-l border-muted-foreground/10 bg-white dark:bg-zinc-950">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading profile details...</p>
          </div>
        ) : taxpayer ? (
          <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="p-6 border-b  border-muted-foreground/10 bg-muted/5">
              <div className="flex items-start justify-between mb-0">
                <div className="space-y-1">
                  <SheetHeader className="text-left space-y-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <SheetTitle className="text-xl font-bold text-foreground capitalize tracking-tight">
                        {taxpayer.displayName || `${taxpayer.first_name || ""} ${taxpayer.last_name || ""}` || "Unknown Taxpayer"}
                      </SheetTitle>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 h-auto">
                        Active Profile
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold mt-1">
                     <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px]">{taxpayer.kadirs_id || taxpayer.kadirsId || "PENDING"}</span>
                    </div>
                  </SheetHeader>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase gap-1.5 border-muted-foreground/20">
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" className="h-8 text-[10px] font-bold uppercase gap-1.5 shadow-sm">
                    <Plus className="h-3 w-3" /> New Bill
                  </Button>
                </div>
              </div>

              {/* Horizontal Info Bar */}
              <div className="grid grid-cols-2 capitalize md:grid-cols-4 gap-4 p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-muted-foreground/10 shadow-sm">
                <div className="space-y-1 border-r border-muted-foreground/10 last:border-0 pr-2">
                  <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-2.5 w-2.5" /> Address
                  </p>
                  <p className="text-[11px] font-bold leading-tight break-words">
                    {taxpayer.address || "No address provided"}
                  </p>
                </div>
                <div className="space-y-1 border-r border-muted-foreground/10 last:border-0 px-2">
                  <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-2.5 w-2.5" /> Email Address
                  </p>
                  <p className="text-[11px] font-bold truncate">
                    {taxpayer.email || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 border-r border-muted-foreground/10 last:border-0 px-2">
                  <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-2.5 w-2.5" /> Phone Number
                  </p>
                  <p className="text-[11px] font-bold font-mono">
                    {taxpayer.phoneNumber || taxpayer.phone_number || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 pl-2">
                  <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-2.5 w-2.5" /> User Type
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-tight">
                    {taxpayer.user_type || "Individual"}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrolling Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Registered Properties</h3>
                  {loadingProperties && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
                {!loadingProperties && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold h-6 px-3">
                    {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                  </Badge>
                )}
              </div>

              <div className="space-y-8">
                {properties.length > 0 ? (
                  properties.map((property) => (
                    <PropertyDetailsSection 
                      key={property.id} 
                      property={property} 
                      invoices={invoices.filter(inv => inv.property_id === property.id || inv.property_uid === property.id || inv.assetId === property.id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted rounded-3xl bg-muted/5 transition-colors hover:bg-muted/10">
                    <div className="p-4 bg-muted/20 rounded-full mb-4">
                      <Building className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h4 className="text-base font-bold text-foreground">No Registered Properties</h4>
                    <p className="text-sm text-muted-foreground text-center mt-2 max-w-[280px]">
                      This taxpayer hasn't enumerated any properties in the system yet.
                    </p>
                    <Button variant="outline" size="sm" className="mt-6 font-bold uppercase text-[10px]">
                      Register Property
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Section */}
            <div className="p-6 border-t border-muted-foreground/10 bg-muted/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted/20 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Last Sync Activity</p>
                    <p className="text-xs font-medium">
                      {taxpayer.creationTime ? format(new Date(taxpayer.creationTime), "MMM d, yyyy HH:mm") : format(new Date(), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-10 px-6 font-black uppercase tracking-widest text-[10px]">
                  Close Window
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-6">
            <User className="h-16 w-16 text-muted-foreground/10" />
            <p className="text-muted-foreground font-medium">Please select a taxpayer to view details.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
