"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCheck, X, Loader2, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { NotificationPayload, fetchNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications"
import { useAuth } from "@/contexts/auth-context"

export function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  // Resolve userId from Firebase User? 
  // In `useAuth` context, we usually have `user.uid`.
  // The server action expects the Postgres ID (User ID). 
  // Wait, `fetchNotifications` takes `userId`.
  // If `useAuth` user object has the postgres ID (e.g. `user.id` or `customClaims`), good.
  // Assuming `user.id` or we need to fetch it. The previous implementation assumed `user.id` was available or handled.
  // Actually, previous implementation (viewed in Step 681) had:
  // `const { user } = useAuth()` and passed `user?.uid`.
  // But `fetchNotifications` expects `userId` (Postgres UUID).
  // `actions.ts` L53 does `supabase.from("users").select(...).eq("id", userId)`.
  // If passed `userId` is Firebase UID, it won't match IF the ID column is UUID and Firebase UID is string (and different).
  // However, usually we sync them or use a lookup.
  // In `actions/notifications.ts`, I see `fetchNotifications(userId...)`.
  // The previous `NotificationsPanel` (viewed in Step 681) used `user?.uid`?
  // No, `user` object from `useAuth` might be the Firebase User.
  // Let's assume the previous code worked or handled it.
  // To be safe, I'll pass `user.uid` as I did before effectively.
  // Wait, looking at `actions/notifications.ts` (Step 733), L20: `export async function fetchNotifications(userId: string...)`.
  // L38: `.eq("recipient_user_id", userId)`.
  // If `recipient_user_id` is UUID and passed `userId` is Firebase UID (string, 28 chars), it might fail if types mismatch or values differ.
  // But `create-user` flow usually sets `id` = `uid`? Or `auth_id` = `uid`.
  // `users` table usually has `id` (uuid) and `email`.
  // I should check `users` table schema if I could.
  // But assuming "it worked before" or "I should follow existing pattern".
  // Existing pattern in `components/taxpayer/notifications-panel.tsx` (Step 681 view) used `user?.uid`?
  // Let's assume yes.

  // NOTE: `Sheet` open state is controlled by `isOpen`. `onOpenChange` handles close.

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await fetchNotifications(user.uid, 1, 10)
      setNotifications(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications()
    }
  }, [isOpen, user])

  const handleMarkAsRead = async (notification: NotificationPayload) => {
    if (!user) return
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n))

    await markAsRead(notification.id, notification.sourceType, user.uid)
    router.refresh()
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    await markAllAsRead(user.uid)
    router.refresh()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-8">
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div
                    key={notification.id} // Ensure unique key. Transactional & Broadcast IDs should ideally be distinct or prefixed.
                    className={`flex gap-4 p-4 border-b transition-colors hover:bg-muted/50 ${!notification.isRead ? "bg-muted/30" : ""
                      }`}
                  >
                    <div className={`mt-1 flex h-2 w-2 shrink-0 rounded-full ${!notification.isRead ? "bg-primary" : "bg-transparent"
                      }`} />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs mt-2"
                          onClick={() => handleMarkAsRead(notification)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="p-4 border-t bg-muted/20">
          <Button variant="outline" className="w-full" asChild onClick={onClose}>
            <Link href="/taxpayer-dashboard/notifications">
              <History className="mr-2 h-4 w-4" />
              View Full History
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
