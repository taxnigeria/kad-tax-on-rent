"use client"

import { useEffect, useState } from "react"
import { getBroadcastHistory, getBroadcastStats } from "@/app/actions/notifications"
import { NotificationSender } from "@/components/admin/notification-sender"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    Bell,
    Calendar,
    Clock,
    CheckCircle2,
    FileText,
    Search,
    Filter,
    Plus,
    History,
    MoreHorizontal,
    ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState("sent")
    const [broadcasts, setBroadcasts] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, sent: 0, scheduled: 0, drafts: 0 })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortField, setSortField] = useState("scheduled_for")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    useEffect(() => {
        fetchData()
    }, [activeTab, searchQuery, sortField, sortOrder])

    async function fetchData() {
        setLoading(true)
        try {
            // 1. Fetch Stats in parallel once or on updates
            const statsData = await getBroadcastStats()
            setStats(statsData)

            // 2. Fetch History based on tab
            let status: string | undefined = undefined
            let isScheduled: boolean | undefined = undefined

            if (activeTab === "sent") {
                status = "active"
                isScheduled = false
            } else if (activeTab === "scheduled") {
                status = "active"
                isScheduled = true
            } else if (activeTab === "drafts") {
                status = "draft"
                isScheduled = false
            }

            const data = await getBroadcastHistory(50, status, isScheduled, searchQuery)
            setBroadcasts(data)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("desc")
        }
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <span className="ml-1 text-muted-foreground opacity-30">↕</span>
        return <span className="ml-1 text-primary">{sortOrder === "asc" ? "↑" : "↓"}</span>
    }

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="overflow-x-hidden">
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-x-hidden max-w-7xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Notification Center</h1>
                        </div>
                        <NotificationSender />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <Card className="py-3 px-4 shadow-sm border-muted/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Broadcasts</p>
                                    <p className="text-lg font-bold">{stats.total}</p>
                                </div>
                                <Bell className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Card>

                        <Card className="py-3 px-4 shadow-sm border-muted/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Sent</p>
                                    <p className="text-lg font-bold text-green-600">{stats.sent}</p>
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                        </Card>

                        <Card className="py-3 px-4 shadow-sm border-muted/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
                                    <p className="text-lg font-bold text-blue-600">{stats.scheduled}</p>
                                </div>
                                <Clock className="h-4 w-4 text-blue-500" />
                            </div>
                        </Card>

                        <Card className="py-3 px-4 shadow-sm border-muted/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Drafts</p>
                                    <p className="text-lg font-bold text-slate-600">{stats.drafts}</p>
                                </div>
                                <FileText className="h-4 w-4 text-slate-500" />
                            </div>
                        </Card>
                    </div>

                    {/* Filters & Tabs */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                                <TabsList className="bg-muted/50 p-1 h-9 w-auto inline-flex">
                                    <TabsTrigger value="sent" className="h-7 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        Sent
                                    </TabsTrigger>
                                    <TabsTrigger value="scheduled" className="h-7 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        Scheduled
                                    </TabsTrigger>
                                    <TabsTrigger value="drafts" className="h-7 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        Drafts
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="relative w-full md:w-[350px]">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search broadcasts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Broadcasts Table */}
                    <Card className="border-muted/50 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted font-bold h-10">
                                            <TableHead className="w-12 text-[11px] uppercase tracking-wider">SN</TableHead>
                                            <TableHead
                                                className="cursor-pointer text-[11px] uppercase tracking-wider"
                                                onClick={() => handleSort("title")}
                                            >
                                                Notification Details <SortIcon field="title" />
                                            </TableHead>
                                            <TableHead className="text-[11px] uppercase tracking-wider">Target</TableHead>
                                            <TableHead
                                                className="cursor-pointer text-[11px] uppercase tracking-wider"
                                                onClick={() => handleSort("scheduled_for")}
                                            >
                                                {activeTab === 'scheduled' ? 'Scheduled For' : 'Timestamp'} <SortIcon field="scheduled_for" />
                                            </TableHead>
                                            <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                                            <TableHead className="text-right text-[11px] uppercase tracking-wider">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i} className="h-16">
                                                    <TableCell><Skeleton className="h-3 w-4" /></TableCell>
                                                    <TableCell>
                                                        <div className="space-y-2">
                                                            <Skeleton className="h-4 w-48" />
                                                            <Skeleton className="h-3 w-72" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : broadcasts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-16">
                                                    <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                                    <p className="text-muted-foreground text-sm font-medium">No {activeTab} broadcasts found.</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            broadcasts.map((b, index) => (
                                                <TableRow key={b.id} className="group hover:bg-muted/30 transition-colors h-16">
                                                    <TableCell className="text-[11px] font-medium text-muted-foreground">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold">{b.title}</span>
                                                            <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{b.body}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] font-mono h-5 bg-background border-muted/50">
                                                            {b.target_type}
                                                            {b.target_value ? `: ${b.target_value}` : ""}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-muted-foreground font-medium">
                                                        {format(new Date(activeTab === 'scheduled' ? b.scheduled_for : b.created_at), "MMM d, yyyy")}
                                                        <div className="text-[10px] text-muted-foreground/70 font-normal">
                                                            {format(new Date(activeTab === 'scheduled' ? b.scheduled_for : b.created_at), "h:mm a")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {activeTab === 'draft' && (
                                                            <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20 h-5 text-[10px]">
                                                                <FileText className="w-3 h-3 mr-1" /> Draft
                                                            </Badge>
                                                        )}
                                                        {activeTab === 'scheduled' && (
                                                            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 h-5 text-[10px]">
                                                                <Clock className="w-3 h-3 mr-1" /> Scheduled
                                                            </Badge>
                                                        )}
                                                        {activeTab === 'sent' && (
                                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 h-5 text-[10px]">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
