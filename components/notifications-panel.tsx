"use client"

import { useMemo, useState } from "react"
import { Bell, CheckCheck, X, Loader2, History, Info, AlertTriangle, CheckCircle2, Megaphone } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user, userRole } = useAuth()
    const { notifications, unreadCount, loading, isLive, markAsRead, markAllRead } = useNotifications(user?.uid)
    const [activeTab, setActiveTab] = useState<"all" | "alerts" | "announcements">("all")
    const router = useRouter()

    const filteredNotifications = useMemo(() => {
        if (activeTab === "all") return notifications
        if (activeTab === "alerts") return notifications.filter(n => n.sourceType === "transactional")
        if (activeTab === "announcements") return notifications.filter(n => n.sourceType === "broadcast")
        return notifications
    }, [notifications, activeTab])

    const newNotifications = filteredNotifications.filter(n => !n.isRead)
    const earlierNotifications = filteredNotifications.filter(n => n.isRead)

    const getIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />
            case "announcement": return <Megaphone className="h-4 w-4 text-blue-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markAsRead(notification.id, notification.sourceType)
        }

        // Potential navigation logic if payload has a URL
        if (notification.payload?.url) {
            router.push(notification.payload.url)
            onClose()
        }
    }

    const historyHref = useMemo(() => {
        if (userRole === "admin" || userRole === "super_admin") return "/admin/notifications"
        return "/taxpayer-dashboard/notifications"
    }, [userRole])

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-[420px] p-0 flex flex-col h-full border-l shadow-2xl">
                <SheetHeader className="px-6 py-5 border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
                            {unreadCount > 0 && (
                                <Badge variant="default" className="rounded-full h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-bold">
                                    {unreadCount}
                                </Badge>
                            )}
                            {isLive && (
                                <div className="flex items-center gap-1.5 ml-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-tight">Live</span>
                                </div>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllRead}
                                className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/5 transition-colors font-semibold"
                            >
                                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                                Mark all read
                            </Button>
                        )}
                    </div>

                    <div className="mt-4">
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => setActiveTab(v as any)}
                            className="w-full"
                        >
                            <TabsList className="bg-muted/50 p-1 h-9 w-auto inline-flex border border-muted/50">
                                <TabsTrigger value="all" className="h-7 text-xs px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="alerts" className="h-7 text-xs px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                    Alerts
                                </TabsTrigger>
                                <TabsTrigger value="announcements" className="h-7 text-xs px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                    Announcements
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Checking for updates...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5">
                            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 opacity-20" />
                            </div>
                            <p className="font-semibold text-foreground">You're all caught up!</p>
                            <p className="text-xs max-w-[200px] mt-1 opacity-70">
                                New {activeTab === "all" ? "notifications" : activeTab} will appear here in real-time.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="flex flex-col py-2">
                                {newNotifications.length > 0 && (
                                    <div className="px-6 py-2">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">New</h3>
                                        {newNotifications.map((n) => (
                                            <NotificationItem
                                                key={n.id}
                                                notification={n}
                                                onClick={() => handleNotificationClick(n)}
                                                icon={getIcon(n.type)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {earlierNotifications.length > 0 && (
                                    <div className="px-6 py-2 mt-4">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Earlier</h3>
                                        {earlierNotifications.map((n) => (
                                            <NotificationItem
                                                key={n.id}
                                                notification={n}
                                                onClick={() => handleNotificationClick(n)}
                                                icon={getIcon(n.type)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <div className="p-4 border-t bg-muted/5 backdrop-blur-sm">
                    <Button variant="outline" className="w-full text-xs font-semibold h-10 shadow-sm hover:bg-background transition-all" asChild onClick={onClose}>
                        <Link href={historyHref}>
                            <History className="mr-2 h-3.5 w-3.5" />
                            View Full History
                        </Link>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function NotificationItem({ notification, onClick, icon }: { notification: any, onClick: () => void, icon: React.ReactNode }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group flex gap-4 p-3 rounded-xl mb-1 cursor-pointer transition-all duration-200",
                !notification.isRead
                    ? "bg-primary/[0.03] hover:bg-primary/[0.06] border border-primary/5"
                    : "hover:bg-muted/50 border border-transparent"
            )}
        >
            <div className="relative mt-1 shrink-0">
                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-sm",
                    !notification.isRead ? "border-primary/20" : "border-muted"
                )}>
                    {icon}
                </div>
                {!notification.isRead && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                )}
            </div>

            <div className="flex-1 space-y-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                        "text-sm leading-tight transition-colors",
                        !notification.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                    )}>
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }).replace('about ', '')}
                    </span>
                </div>
                <p className={cn(
                    "text-xs line-clamp-2 transition-colors",
                    !notification.isRead ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                    {notification.body}
                </p>
            </div>
        </div>
    )
}
