"use server"

import { logAudit } from "./audit"

/**
 * Check if a phone number is registered on WhatsApp using an n8n webhook.
 */
export async function checkWhatsAppPresence(phoneNumber: string, userId: string) {
    try {
        const webhookUrl = "https://tax-nigeria-n8n.vwc4mb.easypanel.host/webhook/5f7233f0-658d-43cb-8d78-9ec0c390b22d"

        const authToken = process.env.N8N_WEBHOOK_AUTH_TOKEN

        // The user provided the endpoint and expected body
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                phone_number: phoneNumber,
                user_id: userId,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("[checkWhatsAppPresence] Webhook error:", errorText)
            return { success: false, error: "Failed to check WhatsApp presence" }
        }

        const data = await response.json()

        // Expected success format:
        // { "success": true, "data": [{ "exists": true, ... }] }
        if (data.success && data.data && data.data.length > 0) {
            return {
                success: true,
                exists: data.data[0].exists,
                name: data.data[0].name || null
            }
        }

        return { success: false, error: "Unknown response format from WhatsApp check" }
    } catch (error: any) {
        console.error("[checkWhatsAppPresence] Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Realtime email validation helper (server-side check if needed, but mostly for client)
 */
export async function validateEmailFormat(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}
