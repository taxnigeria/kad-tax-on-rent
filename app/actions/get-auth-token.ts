"use server"

export async function getAuthToken() {
  const authToken = process.env.N8N_WEBHOOK_AUTH_TOKEN

  if (!authToken) {
    throw new Error("N8N_WEBHOOK_AUTH_TOKEN is not configured")
  }

  return authToken
}
