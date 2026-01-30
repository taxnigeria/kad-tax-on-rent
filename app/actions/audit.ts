"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export type AuditActionType =
    | "create"
    | "update"
    | "delete"
    | "login"
    | "logout"
    | "generate"
    | "payment";

interface AuditLogParams {
    userId?: string;
    action: AuditActionType | string;
    entityType: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    changeSummary?: string;
}

/**
 * Records an audit log entry in the database.
 * Matches existing schema: user_id, action, entity_type, entity_id, old_values, new_values, change_summary, ip_address, user_agent, created_at
 */
export async function logAudit(params: AuditLogParams) {
    try {
        const supabase = await createClient();
        const headersList = await headers();

        // Get client info if possible
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
        const userAgent = headersList.get("user-agent");

        const { error } = await supabase.from("audit_logs").insert({
            user_id: params.userId || (await supabase.auth.getUser()).data.user?.id,
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId,
            old_values: params.oldValues,
            new_values: params.newValues,
            change_summary: params.changeSummary,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        if (error) {
            console.error("[AuditLog] Error inserting log:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("[AuditLog] Critical error:", error);
        return { success: false, error: "Internal audit error" };
    }
}
