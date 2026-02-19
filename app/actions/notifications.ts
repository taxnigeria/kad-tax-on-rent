"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type NotificationType = "transactional" | "broadcast"

export interface NotificationPayload {
    id: string
    title: string
    body: string
    type: string // 'invoice', 'system', etc.
    sourceType: NotificationType
    isRead: boolean
    createdAt: string
    payload?: any
}

// Fetch notifications for a user (Unified Inbox)
export async function fetchNotifications(firebaseUid: string, page = 1, limit = 20) {
    const supabase = await createClient()

    // Get User details for targeting and resolving internal ID
    const { data: dbUser, error: userError } = await supabase
        .from("users")
        .select("id, role, lga_id")
        .eq("firebase_uid", firebaseUid)
        .single()

    if (userError || !dbUser) {
        console.error("User not found or error fetching user for notifications:", userError)
        return []
    }

    const internalUserId = dbUser.id

    // 1. Fetch Transactional Notifications
    const { data: transactional, error: transError } = await supabase
        .from("notification_recipients")
        .select(`
      id,
      status,
      created_at,
      notifications (
        id,
        title,
        body,
        type,
        payload
      )
    `)
        .eq("recipient_user_id", internalUserId)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (transError) {
        console.error("Error fetching transactional notifications:", transError)
        throw new Error("Failed to fetch notifications")
    }

    // 2. Fetch Broadcast Notifications
    const { data: broadcasts, error: castError } = await supabase
        .from("notifications_broadcast")
        .select(`
      *,
      notification_broadcast_reads (
        read_at
      )
    `)
        .filter("notification_broadcast_reads.user_id", "eq", internalUserId)
        .eq("status", "active")
        .lte("scheduled_for", new Date().toISOString())
        .gt("expires_at", new Date().toISOString()) // Only active
        .order("scheduled_for", { ascending: false })
        .limit(limit)

    if (castError) {
        console.error("Error fetching broadcasts:", castError)
    }

    // 3. Merge and Filter Broadcasts
    const relevantBroadcasts = (broadcasts || []).filter((b: any) => {
        // Check Targeting
        if (b.target_type === 'ALL') return true
        if (b.target_type === 'ROLE' && b.target_value === dbUser.role) return true
        if (b.target_type === 'LGA' && b.target_value === dbUser.lga_id) return true
        if (b.target_type === 'USER' && (b.target_value === internalUserId || b.target_value === firebaseUid)) return true
        return false
    }).map((b: any) => ({
        id: b.id,
        title: b.title,
        body: b.body,
        type: b.type,
        sourceType: "broadcast" as NotificationType,
        isRead: b.notification_broadcast_reads?.length > 0,
        createdAt: b.created_at,
        payload: b.payload
    }))

    // 4. Transform Transactional
    const formattedTransactional = (transactional || []).map((t: any) => ({
        id: t.id, // Use recipient row ID for read tracking logic
        title: t.notifications.title,
        body: t.notifications.body,
        type: t.notifications.type,
        sourceType: "transactional" as NotificationType,
        isRead: t.status === 'read',
        createdAt: t.created_at,
        payload: t.notifications.payload
    }))

    // 5. Merge and Sort
    const all = [...formattedTransactional, ...relevantBroadcasts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return all.slice(0, limit)
}

// Mark a notification as read
export async function markAsRead(notificationId: string, sourceType: NotificationType, firebaseUid: string) {
    const supabase = await createClient()

    // Resolve internal ID
    const { data: dbUser } = await supabase.from("users").select("id").eq("firebase_uid", firebaseUid).single()
    if (!dbUser) return

    if (sourceType === "transactional") {
        await supabase
            .from("notification_recipients")
            .update({ status: "read", read_at: new Date().toISOString() })
            .eq("id", notificationId)
            .eq("recipient_user_id", dbUser.id)
    } else {
        await supabase
            .from("notification_broadcast_reads")
            .upsert({ broadcast_id: notificationId, user_id: dbUser.id, read_at: new Date().toISOString() }, { onConflict: 'broadcast_id, user_id' })
    }

    revalidatePath("/taxpayer-dashboard/notifications")
}

// Mark all as read
export async function markAllAsRead(firebaseUid: string) {
    const supabase = await createClient()

    // Resolve internal ID
    const { data: dbUser } = await supabase.from("users").select("id").eq("firebase_uid", firebaseUid).single()
    if (!dbUser) return

    // 1. Update all transactional rows
    await supabase
        .from("notification_recipients")
        .update({ status: "read", read_at: new Date().toISOString() })
        .eq("recipient_user_id", dbUser.id)
        .eq("status", "unread")

    // 2. For broadcasts, marking all as read is omitted for now as it's complex.
}

// Send Transactional Notification
export async function sendTransactionalNotification({ userIds, title, body, type, payload }: { userIds: string[], title: string, body: string, type: string, payload?: any }) {
    const supabase = await createClient()

    // 1. Resolve internal IDs for all recipients (assuming userIds might be Firebase UIDs or Internal UUIDs)
    // We try to resolve Firebase UIDs first.
    const { data: resolvedUsers } = await supabase
        .from("users")
        .select("id, firebase_uid")
        .or(`id.in.(${userIds.join(',')}),firebase_uid.in.(${userIds.join(',')})`)

    // Note: the .in join for mixed types might be problematic. Let's do a cleaner lookup.
    // If they look like UUIDs, they are internal. If not, they are Firebase UIDs.
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    const internalIds: string[] = []
    const firebaseUidsToBeResolved = userIds.filter(id => !isUuid(id))
    const alreadyInternalIds = userIds.filter(id => isUuid(id))

    internalIds.push(...alreadyInternalIds)

    if (firebaseUidsToBeResolved.length > 0) {
        const { data: users } = await supabase
            .from("users")
            .select("id")
            .in("firebase_uid", firebaseUidsToBeResolved)

        if (users) {
            internalIds.push(...users.map(u => u.id))
        }
    }

    if (internalIds.length === 0) return { success: false, error: "No valid recipients found" }

    // 2. Insert Content
    const { data: notification, error } = await supabase
        .from("notifications")
        .insert({ type, title, body, payload })
        .select()
        .single()

    if (error) throw error

    // 3. Insert Recipients
    const recipients = internalIds.map(id => ({
        notification_id: notification.id,
        recipient_user_id: id
    }))

    const { error: recipError } = await supabase
        .from("notification_recipients")
        .insert(recipients)

    if (recipError) throw recipError

    return { success: true }
}

// Send Broadcast Notification
export async function sendBroadcastNotification({
    title,
    body,
    type,
    payload,
    targetType,
    targetValue,
    expiresAt,
    scheduledFor,
    status = 'active'
}: {
    title: string,
    body: string,
    type: string,
    payload?: any,
    targetType: string,
    targetValue?: string,
    expiresAt?: string,
    scheduledFor?: string,
    status?: 'active' | 'draft'
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("notifications_broadcast")
        .insert({
            type,
            title,
            body,
            payload,
            target_type: targetType,
            target_value: targetValue,
            expires_at: expiresAt,
            scheduled_for: scheduledFor || new Date().toISOString(),
            status
        })

    if (error) throw error
    revalidatePath("/admin/notifications")
    return { success: true }
}

// Get Broadcast History (Admin)
export async function getBroadcastHistory(limit = 20, status?: string, isScheduled?: boolean, search?: string) {
    const supabase = await createClient()
    let query = supabase
        .from("notifications_broadcast")
        .select("*")

    if (status) {
        query = query.eq("status", status)
    }

    if (isScheduled) {
        // Scheduled = active + future date
        query = query.gt("scheduled_for", new Date().toISOString()).eq("status", "active")
    } else if (status === 'active') {
        // If searching specifically for "Sent" (active and NOT future)
        query = query.lte("scheduled_for", new Date().toISOString())
    }

    if (search) {
        query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
    }

    const { data: broadcasts, error } = await query
        .order("scheduled_for", { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching broadcast history:", error)
        return []
    }
    return broadcasts
}

export async function getBroadcastStats() {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const [total, sent, scheduled, drafts] = await Promise.all([
        supabase.from("notifications_broadcast").select("*", { count: 'exact', head: true }),
        supabase.from("notifications_broadcast").select("*", { count: 'exact', head: true }).eq("status", "active").lte("scheduled_for", now),
        supabase.from("notifications_broadcast").select("*", { count: 'exact', head: true }).eq("status", "active").gt("scheduled_for", now),
        supabase.from("notifications_broadcast").select("*", { count: 'exact', head: true }).eq("status", "draft")
    ])

    return {
        total: total.count || 0,
        sent: sent.count || 0,
        scheduled: scheduled.count || 0,
        drafts: drafts.count || 0
    }
}
