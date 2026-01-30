"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Building2,
    Search,
    Users,
    MapPin,
    DollarSign,
    Home,
    Loader2,
    User,
    ChevronRight,
    Mail,
    Phone,
    Plus
} from "lucide-react"
import { toast } from "sonner"
import { getManagedClients } from "@/app/actions/get-properties"
import { TaxpayerPropertyDetailsSheet } from "@/components/taxpayer/property-details-sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RegisterClientModal } from "@/components/manager/register-client-modal"
import { AddPropertyForClientModal } from "@/components/manager/add-property-modal"

type Property = {
    id: string
    property_reference: string
    registered_property_name: string
    property_type: string
    status: string
    verification_status: string
    total_annual_rent: number
    address: {
        street_address: string
        city: string
        lga: string
    }
}

type Client = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone_number: string
    profile: {
        kadirs_id: string | null
        business_name: string | null
        verification_status?: string | null
    } | null
    properties: Property[]
}

export default function ClientsPage() {
    const router = useRouter()
    const { user, userRole, loading: authLoading } = useAuth()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
    const [isPropertySheetOpen, setIsPropertySheetOpen] = useState(false)
    const [isRegisterClientOpen, setIsRegisterClientOpen] = useState(false)
    const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false)

    const fetchClients = useCallback(async () => {
        if (!user?.uid) return

        try {
            setLoading(true)
            const { clients: fetchedClients, error } = await getManagedClients(user.uid)
            if (error) {
                console.error("Error fetching clients:", error)
            } else {
                setClients(fetchedClients || [])
                // Select first client if none selected and list not empty
                if (fetchedClients && fetchedClients.length > 0 && !selectedClientId) {
                    setSelectedClientId(fetchedClients[0].id)
                }
            }
        } catch (error) {
            console.error("Error in fetchClients:", error)
        } finally {
            setLoading(false)
        }
    }, [user?.uid, selectedClientId])

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login")
            } else if (userRole !== "property_manager" && userRole !== "admin" && userRole !== "super_admin") {
                router.push("/taxpayer-dashboard")
            } else {
                fetchClients()
            }
        }
    }, [user, userRole, authLoading, router, fetchClients])

    const filteredClients = clients.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone_number?.includes(searchQuery)
    )

    const selectedClient = clients.find(c => c.id === selectedClientId)

    const handleAddPropertyClick = () => {
        if (!selectedClient) return

        if (selectedClient.profile?.verification_status !== 'verified') {
            toast.error("Client Not Verified", {
                description: "You can only add properties for verified clients."
            })
            return
        }

        setIsAddPropertyOpen(true)
    }

    const stats = {
        totalClients: clients.length,
        totalProperties: clients.reduce((sum, c) => sum + c.properties.length, 0),
        activeProperties: clients.reduce((sum, c) => sum + c.properties.filter(p => p.verification_status === 'approved').length, 0),
        totalRent: clients.reduce((sum, c) => sum + c.properties.reduce((pSum, p) => pSum + (p.total_annual_rent || 0), 0), 0)
    }

    function getStatusBadge(status: string) {
        const variants: Record<string, { label: string; className: string }> = {
            approved: { label: "Verified", className: "bg-green-500/10 text-green-500 border-green-500/20" },
            pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
            rejected: { label: "Rejected", className: "bg-red-500/10 text-red-500 border-red-500/20" },
        }
        const variant = variants[status] || variants.pending
        return (
            <Badge variant="outline" className={`text-[10px] h-5 px-1 ${variant.className}`}>
                {variant.label}
            </Badge>
        )
    }

    const sidebarStyle = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    if (authLoading || (loading && !clients.length && !searchQuery)) {
        return (
            <SidebarProvider style={sidebarStyle}>
                <TaxpayerSidebar variant="inset" />
                <SidebarInset>
                    <TaxpayerHeader />
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    return (
        <SidebarProvider style={sidebarStyle}>
            <TaxpayerSidebar variant="inset" />
            <SidebarInset>
                <TaxpayerHeader />
                <div className="flex flex-1 flex-col overflow-hidden bg-background/50">
                    <div className="p-4 md:p-6 pb-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold tracking-tight">My Clients (Principals)</h1>
                            <Button size="sm" onClick={() => setIsRegisterClientOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Client
                            </Button>
                        </div>

                        {/* Slim KPI Cards */}
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            <Card className="border-border/50 shadow-none bg-card/50">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Clients</p>
                                        <p className="text-lg font-bold leading-none mt-1">{stats.totalClients}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50 shadow-none bg-card/50">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Building2 className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Managed Props</p>
                                        <p className="text-lg font-bold leading-none mt-1">{stats.totalProperties}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50 shadow-none bg-card/50">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/10">
                                        <Home className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Verified</p>
                                        <p className="text-lg font-bold leading-none mt-1">{stats.activeProperties}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50 shadow-none bg-card/50">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <DollarSign className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Annual Rent</p>
                                        <p className="text-lg font-bold leading-none mt-1">₦{stats.totalRent.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden p-4 md:p-6 pt-0 gap-4">
                        {/* Left Column: Client List */}
                        <div className="w-1/3 flex flex-col gap-4 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search clients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 border-border/50"
                                />
                            </div>

                            <ScrollArea className="flex-1 border border-border/50 rounded-xl bg-card/50">
                                <div className="p-2 space-y-1">
                                    {filteredClients.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <p className="text-sm">No clients found</p>
                                            <Button variant="link" size="sm" onClick={() => setIsRegisterClientOpen(true)}>
                                                Register your first client
                                            </Button>
                                        </div>
                                    ) : (
                                        filteredClients.map((client) => (
                                            <button
                                                key={client.id}
                                                onClick={() => setSelectedClientId(client.id)}
                                                className={`w-full text-left p-3 rounded-lg transition-all border ${selectedClientId === client.id
                                                    ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm"
                                                    : "border-transparent hover:bg-muted/50"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${selectedClientId === client.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold truncate">
                                                                {client.first_name} {client.last_name}
                                                            </p>
                                                            {client.profile?.verification_status && (
                                                                <div className={`h-2 w-2 rounded-full ${client.profile.verification_status === 'verified' ? 'bg-green-500' :
                                                                    client.profile.verification_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`} title={client.profile.verification_status} />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-2">
                                                            {client.properties.length} Properties managed
                                                        </p>
                                                    </div>
                                                    {selectedClientId === client.id && <ChevronRight className="h-4 w-4 text-primary" />}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right Column: Properties Details */}
                        <div className="flex-1 flex flex-col border border-border/50 rounded-xl bg-card overflow-hidden">
                            {selectedClient ? (
                                <>
                                    <div className="p-4 border-b border-border/50 bg-muted/20">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-lg font-bold">{selectedClient.first_name} {selectedClient.last_name}</h2>
                                                    {selectedClient.profile?.verification_status && (
                                                        <Badge variant={selectedClient.profile.verification_status === 'verified' ? 'default' : 'secondary'} className="text-[10px] h-5 capitalize">
                                                            {selectedClient.profile.verification_status}
                                                        </Badge>
                                                    )}
																										{selectedClient.profile?.kadirs_id ? (
                                                <div className="flex flex-col  gap-1">
                                                    <Badge variant="outline" className="font-mono text-[10px] border-primary/20 text-primary">
                                                        KADIRS: {selectedClient.profile.kadirs_id}
                                                    </Badge>
                                                    {selectedClient.profile.business_name && (
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                            {selectedClient.profile.business_name}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-yellow-600 bg-yellow-500/10 border-yellow-500/20">
                                                    No KADIRS ID
                                                </Badge>

                                            )}
                                                </div>
                                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {selectedClient.email}</span>
                                                    <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {selectedClient.phone_number}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-end justify-start">
                                            <Button size="sm" onClick={handleAddPropertyClick} className="gap-2 h-7 text-xs" variant={selectedClient.profile?.verification_status === 'verified' ? 'default' : 'secondary'}>
                                                <Plus className="h-3 w-3" />
                                                Add Property
                                            </Button>
                                        </div>
                                        </div>
                                        
                                    </div>

                                    <ScrollArea className="flex-1 bg-background/30">
                                        <div className="p-4 grid gap-3 sm:grid-cols-2">
                                            {selectedClient.properties.length === 0 ? (
                                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                    <p>No properties listed for this client</p>
                                                    <div className="flex flex-col items-center gap-2">
                                                        {selectedClient.profile?.verification_status === 'pending' && (
                                                            <p className="text-xs text-amber-600 mt-2">
                                                                Client verification pending.
                                                            </p>
                                                        )}
                                                        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={handleAddPropertyClick}>
                                                            <Plus className="h-3 w-3" /> Add Property
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                selectedClient.properties.map((property) => (
                                                    <Card key={property.id} className="border-border/50 shadow-none hover:border-primary/30 transition-all group bg-card/80">
                                                        <CardHeader className="p-3 pb-0">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h3 className="text-sm font-bold truncate flex-1">{property.registered_property_name}</h3>
                                                                {getStatusBadge(property.verification_status)}
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground font-mono">{property.property_reference}</p>
                                                        </CardHeader>
                                                        <CardContent className="p-3 pt-2 space-y-2">
                                                            <div className="text-[11px] space-y-1">
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                                                    <span className="truncate">{property.address.street_address}, {property.address.city}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-tight">Annual Rent</span>
                                                                        <span className="font-bold text-primary">₦{property.total_annual_rent.toLocaleString()}</span>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-7 text-[10px] px-3 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                                                                        onClick={() => {
                                                                            setSelectedPropertyId(property.id)
                                                                            setIsPropertySheetOpen(true)
                                                                        }}
                                                                    >
                                                                        Details
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 bg-muted/5">
                                    <div className="relative">
                                        <Users className="h-16 w-16 mb-4 opacity-5" />
                                        <Search className="h-6 w-6 absolute bottom-4 right-0 opacity-10" />
                                    </div>
                                    <p className="text-sm font-medium">Select a client to view their property portfolio</p>
                                    <p className="text-xs mt-1 text-muted-foreground/60">Manage multiple owners from one place</p>
                                    <Button variant="outline" size="sm" onClick={() => setIsRegisterClientOpen(true)} className="mt-4 gap-2">
                                        <Plus className="h-4 w-4" />
                                        Register New Client
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
            <AIAssistantSidebar userRole={(userRole as any) || "property_manager"} />
            <TaxpayerPropertyDetailsSheet
                propertyId={selectedPropertyId}
                open={isPropertySheetOpen}
                onOpenChange={setIsPropertySheetOpen}
            />
            <RegisterClientModal
                open={isRegisterClientOpen}
                onOpenChange={setIsRegisterClientOpen}
                onSuccess={() => {
                    fetchClients()
                }}
            />
            <AddPropertyForClientModal
                open={isAddPropertyOpen}
                onOpenChange={setIsAddPropertyOpen}
                client={selectedClient || null}
                onSuccess={() => {
                    fetchClients()
                }}
            />
        </SidebarProvider>
    )
}
