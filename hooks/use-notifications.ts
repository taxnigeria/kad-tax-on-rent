"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    fetchNotifications,
    markAsRead as markAsReadAction,
    markAllAsRead as markAllAsReadAction,
    NotificationPayload,
    NotificationType
} from "@/app/actions/notifications"
import { toast } from "sonner"

export function useNotifications(firebaseUid: string | undefined) {
    const [notifications, setNotifications] = useState<NotificationPayload[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLive, setIsLive] = useState(false)

    const supabase = createClient()

    // Calculate unread count from state
    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.isRead).length)
    }, [notifications])

    const loadInitial = useCallback(async () => {
        if (!firebaseUid) return
        setLoading(true)
        try {
            const data = await fetchNotifications(firebaseUid)
            setNotifications(data)
            setError(null)
        } catch (err) {
            console.error("Error loading notifications:", err)
            setError("Failed to load notifications")
        } finally {
            setLoading(false)
        }
    }, [firebaseUid])

    useEffect(() => {
        if (firebaseUid) {
            loadInitial()
        } else {
            setNotifications([])
            setLoading(false)
        }
    }, [firebaseUid, loadInitial])

    // Realtime Subscriptions
    useEffect(() => {
        if (!firebaseUid) return

        let isMounted = true

        // We need the internal ID for subscription filters
        // However, Supabase Realtime filters are limited. 
        // For simplicity and robustness, we subscribe and filter/refresh

        // 1. Transactional Notifications channel
        // We listen to the notification_recipients table
        const recipientsChannel = supabase
            .channel('realtime_notifications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notification_recipients' },
                async (payload) => {
                    if (!isMounted) return
                    console.log('Notification change received:', payload)
                    // Refresh list on any change to recipients (INSERT, UPDATE, DELETE)
                    // This ensures we get the joined data (title, body) via the server action
                    await loadInitial()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications_broadcast' },
                async () => {
                    if (!isMounted) return
                    // Refresh on any change: INSERT (new broadcast), UPDATE (status change), DELETE
                    await loadInitial()
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setIsLive(true)
                else setIsLive(false)
            })

        return () => {
            isMounted = false
            supabase.removeChannel(recipientsChannel)
        }
    }, [firebaseUid, supabase, loadInitial])

    const markAsRead = async (id: string, sourceType: NotificationType) => {
        if (!firebaseUid) return

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))

        try {
            await markAsReadAction(id, sourceType, firebaseUid)
        } catch (err) {
            console.error("Error marking as read:", err)
            toast.error("Failed to update notification status")
            // Revert on error?
            await loadInitial()
        }
    }

    const markAllRead = async () => {
        if (!firebaseUid) return

        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

        try {
            await markAllAsReadAction(firebaseUid)
            toast.success("All notifications marked as read")
        } catch (err) {
            console.error("Error marking all read:", err)
            toast.error("Failed to update notifications")
            await loadInitial()
        }
    }

    return {
        notifications,
        unreadCount,
        loading,
        error,
        isLive,
        markAsRead,
        markAllRead,
        refresh: loadInitial
    }
}
