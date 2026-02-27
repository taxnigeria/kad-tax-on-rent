/**
 * PayKaduna API Types
 * Based on PayKaduna API Documentation V8
 */

// ===== Bill Detail DTO (used in Create Bill requests) =====
export interface BillDetailDto {
    amount: number
    mdasId: number | string
    recommendedRate?: number
    narration: string
}

// ===== 2.1 Create Bill =====
export interface CreateBillRequest {
    engineCode: string
    identifier: string
    firstName: string
    middleName: string
    lastName: string
    telephone: string
    address: string
    esBillDetailsDto: BillDetailDto[]
}

export interface BillInfo {
    billReference: string
    payStatus: string
    narration: string
    receipt: string
}

export interface BillItem {
    billReference: string
    mdaId: number
    revenueCode: string
    revenueHead: string
    amount: number
    engineCode: string | null
}

export interface FailedBillItem {
    billReference: string
    mdasId: string
    amount: number
}

export interface CreateBillResponse {
    bill: BillInfo
    billItems: BillItem[]
    failedBillItems: FailedBillItem[]
}

// ===== 2.2 Create Multiple Bills =====
export interface BulkBillDto {
    identifier: string
    firstName: string
    middleName: string
    lastName: string
    telephone: string
    address: string
    esBillDetailsDto: BillDetailDto[]
}

export interface CreateBulkBillRequest {
    engineCode: string
    esBillDtos: BulkBillDto[]
}

export type CreateBulkBillResponse = CreateBillResponse[]

// ===== 2.3 Get Bill =====
export interface GetBillResponse {
    bill: BillInfo
    billItems: BillItem[]
}

// ===== 2.4 Create Payment Transaction =====
export interface CreateTransactionRequest {
    tpui: string
    billReference: string
}

export interface CreateTransactionResponse {
    checkoutUrl: string
    rawResponse: Record<string, any>
}

// ===== 2.5 Register Tax Payer =====
export interface RegisterTaxPayerRequest {
    firstName: string
    lastName: string
    tin: string
    email: string
    phoneNumber: string
    genderId: number
    addressLine1: string
    identifier: string
    userType: "Individual" | "Corporate"
    password: string
    confirmPassword: string
    middleName?: string
    rcNumber?: string
    industryId?: number
    numberOfStaff?: number
    officeName?: string
    officeEmail?: string
    officePhoneNumber?: string
    officeAddressLine1?: string
    officeStateId?: number
    officeLgaId?: number
    taxStationId?: number
}

export interface UserRegistration {
    id: string
    userId: string
    user: any
    fullName: string
    tin: string
    tpui: string
    genderId: number
    gender: any
    addressLine1: string
    stateId: number
    state: any
    lgaId: number
    lga: any
    createdAt: string
    modifiedAt: string
    rcNumber: string
    industryId: number
    industry: any
    officeName: string
    officeEmail: string
    officePhoneNumber: string
    officeAddressLine1: string
}

export interface RegisterTaxPayerResponse {
    userRegistrationId: string
    userRegistration: UserRegistration
    user: any
    userType: string
}

// ===== 2.6 Get Invoice URL =====
export interface GetInvoiceUrlResponse {
    invoiceUrl: string
}

// ===== 2.7 Search Tax Payer =====
export interface SearchTaxPayerResult {
    fullName: string
    tpui: string
    tin: string
    nin: string
    phone: string
    email: string
}

export type SearchTaxPayerResponse = SearchTaxPayerResult[]

// ===== 2.8 Update Payment Redirect URL =====
export interface UpdateRedirectUrlRequest {
    redirectUrl: string
}

export interface UpdateRedirectUrlResponse {
    statusCode: number
    message: string
}

// ===== 2.9 Attach Additional Data to Bill =====
export interface AttachAdditionalDataRequest {
    billReference: string
    additionalData: Record<string, any>
}

export interface AttachAdditionalDataResponse {
    billReference: string
    tpui: string
    payStatus: string
    narration: string
    receipt: string
    additionalData: Record<string, any>
}

// ===== 2.10 Bulk Attach Additional Data =====
export interface BulkAttachAdditionalDataRequest {
    bills: AttachAdditionalDataRequest[]
}

export interface BulkAttachAdditionalDataResponse {
    success: boolean
    errors: string[]
    bills: AttachAdditionalDataResponse[]
}

// ===== PayKaduna Config =====
export type PayKadunaMode = "live" | "test"

export interface PayKadunaConfig {
    mode: PayKadunaMode
    baseUrl: string
    apiKey: string
    engineCode: string
    mdasId: string
}
