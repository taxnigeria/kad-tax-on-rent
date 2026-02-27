import { getPayKadunaConfig } from "./config"
import { computePostSignature, computeGetSignature } from "./hash"
import type {
    CreateBillRequest,
    CreateBillResponse,
    CreateBulkBillRequest,
    CreateBulkBillResponse,
    GetBillResponse,
    CreateTransactionRequest,
    CreateTransactionResponse,
    RegisterTaxPayerRequest,
    RegisterTaxPayerResponse,
    SearchTaxPayerResponse,
    UpdateRedirectUrlRequest,
    UpdateRedirectUrlResponse,
    AttachAdditionalDataRequest,
    AttachAdditionalDataResponse,
    BulkAttachAdditionalDataRequest,
    BulkAttachAdditionalDataResponse,
    GetInvoiceUrlResponse,
    PayKadunaConfig,
} from "./types"

/**
 * PayKaduna API Client
 *
 * Makes direct REST calls to PayKaduna with proper HMAC SHA256 signing.
 * Reads the current mode (live/test) from system_settings to select
 * the correct base URL and API key.
 */
class PayKadunaClient {
    /**
     * Internal helper — makes a POST request with HMAC signature.
     */
    private async post<TReq, TRes>(path: string, body: TReq, config?: PayKadunaConfig): Promise<TRes> {
        const cfg = config || await getPayKadunaConfig()
        const url = `${cfg.baseUrl}${path}`
        const jsonPayload = JSON.stringify(body)
        const signature = computePostSignature(jsonPayload, cfg.apiKey)

        console.log(`[PayKaduna] POST ${url} (mode: ${cfg.mode})`)

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Signature": signature,
            },
            body: jsonPayload,
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[PayKaduna] POST ${path} error (${response.status}):`, errorText)
            throw new Error(`PayKaduna API error (${response.status}): ${errorText || response.statusText}`)
        }

        return response.json() as Promise<TRes>
    }

    /**
     * Internal helper — makes a GET request with HMAC signature.
     */
    private async get<TRes>(path: string, config?: PayKadunaConfig): Promise<TRes> {
        const cfg = config || await getPayKadunaConfig()
        const url = `${cfg.baseUrl}${path}`
        const signature = computeGetSignature(path, cfg.apiKey)

        console.log(`[PayKaduna] GET ${url} (mode: ${cfg.mode})`)

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-Api-Signature": signature,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[PayKaduna] GET ${path} error (${response.status}):`, errorText)
            throw new Error(`PayKaduna API error (${response.status}): ${errorText || response.statusText}`)
        }

        return response.json() as Promise<TRes>
    }

    // ===================================================================
    // 2.1 Create a Bill
    // POST /api/ESBills/CreateESBill
    // ===================================================================
    async createBill(data: CreateBillRequest): Promise<CreateBillResponse> {
        return this.post<CreateBillRequest, CreateBillResponse>(
            "/api/ESBills/CreateESBill",
            data
        )
    }

    // ===================================================================
    // 2.2 Create Multiple Bills
    // POST /api/ESBills/CreateBulkESBill
    // ===================================================================
    async createBulkBills(data: CreateBulkBillRequest): Promise<CreateBulkBillResponse> {
        return this.post<CreateBulkBillRequest, CreateBulkBillResponse>(
            "/api/ESBills/CreateBulkESBill",
            data
        )
    }

    // ===================================================================
    // 2.3 Get Bill Information
    // GET /api/ESBills/GetBill?billreference=<ref>
    // ===================================================================
    async getBill(billReference: string): Promise<GetBillResponse> {
        return this.get<GetBillResponse>(
            `/api/ESBills/GetBill?billreference=${encodeURIComponent(billReference)}`
        )
    }

    // ===================================================================
    // 2.4 Create a Payment Transaction
    // POST /api/ESBills/CreateESTransaction
    // ===================================================================
    async createTransaction(data: CreateTransactionRequest): Promise<CreateTransactionResponse> {
        return this.post<CreateTransactionRequest, CreateTransactionResponse>(
            "/api/ESBills/CreateESTransaction",
            data
        )
    }

    // ===================================================================
    // 2.5 Register a Tax Payer
    // POST /api/ESBills/RegisterTaxPayer
    // ===================================================================
    async registerTaxPayer(data: RegisterTaxPayerRequest): Promise<RegisterTaxPayerResponse> {
        return this.post<RegisterTaxPayerRequest, RegisterTaxPayerResponse>(
            "/api/ESBills/RegisterTaxPayer",
            data
        )
    }

    // ===================================================================
    // 2.6 Get Bill's Invoice URL
    // GET /api/ESBills/GetInvoiceUrl?billreference=<ref>
    // ===================================================================
    async getInvoiceUrl(billReference: string): Promise<GetInvoiceUrlResponse> {
        return this.get<GetInvoiceUrlResponse>(
            `/api/ESBills/GetInvoiceUrl?billreference=${encodeURIComponent(billReference)}`
        )
    }

    // ===================================================================
    // 2.7 Search Tax Payer
    // GET /api/ESBills/SearchTaxPayer?criteria=<criteria>
    // ===================================================================
    async searchTaxPayer(criteria: string): Promise<SearchTaxPayerResponse> {
        return this.get<SearchTaxPayerResponse>(
            `/api/ESBills/SearchTaxPayer?criteria=${encodeURIComponent(criteria)}`
        )
    }

    // ===================================================================
    // 2.8 Update Payment Redirect URL
    // POST /api/ESBills/UpdatePaymentRedirectUrl
    // ===================================================================
    async updatePaymentRedirectUrl(data: UpdateRedirectUrlRequest): Promise<UpdateRedirectUrlResponse> {
        return this.post<UpdateRedirectUrlRequest, UpdateRedirectUrlResponse>(
            "/api/ESBills/UpdatePaymentRedirectUrl",
            data
        )
    }

    // ===================================================================
    // 2.9 Attach Additional Data to Bill
    // POST /api/ESBills/AttachAdditionalDataToBill
    // ===================================================================
    async attachAdditionalData(data: AttachAdditionalDataRequest): Promise<AttachAdditionalDataResponse> {
        return this.post<AttachAdditionalDataRequest, AttachAdditionalDataResponse>(
            "/api/ESBills/AttachAdditionalDataToBill",
            data
        )
    }

    // ===================================================================
    // 2.10 Bulk Attach Additional Data
    // POST /api/ESBills/BulkAttachAdditionalDataToBill
    // ===================================================================
    async bulkAttachAdditionalData(data: BulkAttachAdditionalDataRequest): Promise<BulkAttachAdditionalDataResponse> {
        return this.post<BulkAttachAdditionalDataRequest, BulkAttachAdditionalDataResponse>(
            "/api/ESBills/BulkAttachAdditionalDataToBill",
            data
        )
    }
}

// Export a singleton instance
export const payKadunaClient = new PayKadunaClient()
