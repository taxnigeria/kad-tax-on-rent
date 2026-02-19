"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { Loader2, Bell, CheckCheck, Filter } from "lucide-react"
import { createBrowserClient } from "@/utils/supabase/client"
import { fetchNotifications, markAsRead, markAllAsRead, type NotificationPayload } from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 20

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["taxpayer", "property_manager"].includes(userRole)) {
        router.push("/dashboard")
      }
    }
  }, [user, userRole, authLoading, router])

  // Resolve User ID
  useEffect(() => {
    async function resolveUser() {
      if (!user) return
      const supabase = createBrowserClient()
      const { data } = await supabase.from("users").select("id").eq("firebase_uid", user.uid).single()
      if (data) {
        setUserId(data.id)
      }
    }
    resolveUser()
  }, [user])

  // Fetch Notifications
  useEffect(() => {
    if (userId) {
      loadNotifications(1)
    }
  }, [userId])

  const loadNotifications = async (pageNum: number) => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await fetchNotifications(userId, pageNum, LIMIT)
      if (pageNum === 1) {
        setNotifications(data)
      } else {
        setNotifications(prev => [...prev, ...data])
      }
      setHasMore(data.length === LIMIT)
    } catch (error) {
      console.error("Failed to load notifications", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadNotifications(nextPage)
  }

  const handleMarkAsRead = async (notification: NotificationPayload) => {
    if (!userId) return
    // Optimistic
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n))
    await markAsRead(notification.id, notification.sourceType, userId)
    router.refresh()
  }

  const handleMarkAllRead = async () => {
    if (!userId) return
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    await markAllAsRead(userId)
    router.refresh()
  }

  if (authLoading || (!user && loading)) {
    return (
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as any}>
        <TaxpayerSidebar variant="inset" />
        <SidebarInset>
          <TaxpayerHeader />
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!user || (userRole && !["taxpayer", "property_manager"].includes(userRole))) return null

  // Filter Logic (Client-side for now as fetch returns mixed)
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as any}>
      <TaxpayerSidebar variant="inset" />
      <SidebarInset>
        <TaxpayerHeader />
        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground mt-1">Stay updated with your property tax alerts and announcements.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="broadcasts">Announcements</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              <NotificationList notifications={notifications} onMarkRead={handleMarkAsRead} />
            </TabsContent>
            <TabsContent value="unread" className="space-y-4">
              <NotificationList notifications={notifications.filter(n => !n.isRead)} onMarkRead={handleMarkAsRead} emptyMessage="No unread notifications." />
            </TabsContent>
            <TabsContent value="broadcasts" className="space-y-4">
              <NotificationList notifications={notifications.filter(n => n.sourceType === 'broadcast')} onMarkRead={handleMarkAsRead} emptyMessage="No announcements." />
            </TabsContent>
          </Tabs>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="ghost" onClick={handleLoadMore} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
      <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />
    </SidebarProvider>
  )
}

function NotificationList({ notifications, onMarkRead, emptyMessage = "No notifications found." }: { notifications: NotificationPayload[], onMarkRead: (n: NotificationPayload) => void, emptyMessage?: string }) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Bell className="h-8 w-8 mb-4 opacity-20" />
          <p>{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="grid gap-4">
      {notifications.map((notification) => (
        <Card key={notification.key || notification.id} className={cn("transition-colors", !notification.isRead ? "border-primary/20 bg-primary/5" : "")}>
          <div className="flex flex-row items-start p-4 md:p-6 gap-4">
            <div className={cn("mt-1 h-3 w-3 rounded-full shrink-0", !notification.isRead ? "bg-primary" : "bg-muted")} />

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold leading-none tracking-tight">{notification.title}</h4>
                  {notification.sourceType === 'broadcast' && <Badge variant="outline" className="text-[10px] h-5">Announcement</Badge>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 pl-4">
                  {new Date(notification.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {notification.body || notification.payload?.message}
              </p>
              {/* Optional: Add Action Button based on payload */}
            </div>

            {!notification.isRead && (
              <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-2 opacity-50 hover:opacity-100" title="Mark as read" onClick={() => onMarkRead(notification)}>
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
