import crypto from "crypto"

/**
 * Compute HMAC SHA256 signature for POST requests.
 * The signature is the HMAC SHA256 hash of the JSON payload, Base64-encoded.
 *
 * @param jsonPayload - The JSON string body of the request (single-line formatted)
 * @param apiKey - The PayKaduna API secret key
 * @returns Base64-encoded HMAC SHA256 signature
 */
export function computePostSignature(jsonPayload: string, apiKey: string): string {
    const hmac = crypto.createHmac("sha256", apiKey)
    hmac.update(jsonPayload, 'utf8')
    return hmac.digest("base64")
}

export function computeGetSignature(pathAndQuery: string, apiKey: string): string {
    const hmac = crypto.createHmac("sha256", apiKey)
    hmac.update(pathAndQuery, 'utf8')
    return hmac.digest("base64")
}
