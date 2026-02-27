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
    hmac.update(jsonPayload)
    return hmac.digest("base64")
}

/**
 * Compute HMAC SHA256 signature for GET requests.
 * The signature is the HMAC SHA256 hash of the API path + query string, Base64-encoded.
 *
 * Example: for GET /api/ESBills/GetBill?billreference=12345
 * you hash the string "/api/ESBills/GetBill?billreference=12345"
 *
 * @param pathAndQuery - The path and query string (e.g. "/api/ESBills/GetBill?billreference=12345")
 * @param apiKey - The PayKaduna API secret key
 * @returns Base64-encoded HMAC SHA256 signature
 */
export function computeGetSignature(pathAndQuery: string, apiKey: string): string {
    const hmac = crypto.createHmac("sha256", apiKey)
    hmac.update(pathAndQuery)
    return hmac.digest("base64")
}
