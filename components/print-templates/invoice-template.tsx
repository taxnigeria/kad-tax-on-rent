import { formatCurrency } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"
import Image from "next/image"

interface InvoiceProps {
  invoiceNumber: string
  date: string
  clientName: string
  propertyName: string
  clientPhone: string
  areaOffice: string
  areaOfficeAddress: string
  baseAmount: number
  stampDuty: number
  interest: number
  penalty: number
  discount: number
  total: number
  paymentReference: string
}

export function InvoiceTemplate({
  invoiceNumber,
  date,
  clientName,
  propertyName,
  clientPhone,
  areaOffice,
  areaOfficeAddress,
  baseAmount,
  stampDuty,
  interest,
  penalty,
  discount,
  total,
  paymentReference,
}: InvoiceProps) {
  return (
    <div className="invoice-page bg-white p-16 min-h-[297mm] max-w-[210mm] mx-auto relative overflow-hidden flex flex-col">
      {/* Watermark Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-5 pointer-events-none flex items-center justify-center">
        <Image
          src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/kadirs-payment-spyvkx/assets/2z4l4zrvjgu4/kadirs-removebg-preview.png"
          alt="Watermark"
          fill
          className="object-contain"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-[40px] font-bold text-[#003E2F] leading-none">Invoice</h1>
            <div className="mt-2 space-y-1">
              <p className="text-xs">
                <span className="font-normal">Invoice #: </span>
                <span className="font-semibold">{invoiceNumber}</span>
              </p>
              <p className="text-xs">
                <span className="font-normal">Date: </span>
                <span className="font-semibold">{date}</span>
              </p>
            </div>
          </div>
          <div className="w-[90px] h-[90px] relative">
            <Image
              src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/kadirs-payment-spyvkx/assets/2z4l4zrvjgu4/kadirs-removebg-preview.png"
              alt="Kaduna State Logo"
              width={90}
              height={90}
              className="object-contain"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[#003E2F] mb-4" />

        {/* Two Column Layout */}
        <div className="flex gap-10 mb-4">
          {/* KADIRS Info */}
          <div className="flex-1">
            <p className="text-xs font-semibold">Kaduna State Internal Revenue Service</p>
            <p className="text-xs font-semibold">{areaOffice} Area Office</p>
            <p className="text-xs">{areaOfficeAddress}</p>
            <p className="text-xs text-[#003E2F]">https://www.kadtaxonrent.com.ng</p>
          </div>

          {/* Client Info */}
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1">Client Information</p>
            <p className="text-xs">Name: {clientName}</p>
            <p className="text-xs">Property Name: {propertyName}</p>
            <p className="text-xs">Phone: {clientPhone}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          {/* Table Header */}
          <div className="bg-[#003E2F] rounded h-[35px] flex items-center px-4 mb-2">
            <div className="flex-1">
              <p className="text-xs font-bold text-white">ITEM DESCRIPTION</p>
            </div>
            <div>
              <p className="text-xs font-bold text-white">AMOUNT (₦)</p>
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-1 mt-3">
            {/* Base Amount */}
            <div className="flex justify-between items-center px-4 py-2">
              <p className="text-[11px]">Withholding Tax on Rent</p>
              <p className="text-xs font-semibold">{formatCurrency(baseAmount || 0)}</p>
            </div>

            {/* Stamp Duty */}
            <div className="flex justify-between items-center px-4 py-1">
              <p className="text-[11px]">Stamp Duty - 1%</p>
              <p className="text-xs font-semibold">{formatCurrency(stampDuty || 0)}</p>
            </div>

            {/* Interest */}
            <div className="flex justify-between items-center px-4 py-1">
              <p className="text-[11px]">Interest - 27%</p>
              <p className="text-xs font-semibold">{formatCurrency(interest || 0)}</p>
            </div>

            {/* Penalty */}
            <div className="flex justify-between items-center px-4 py-1">
              <p className="text-[11px]">Penalty - 10%</p>
              <p className="text-xs font-semibold">{formatCurrency(penalty || 0)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-[#003E2F] my-2" />

          {/* Discount */}
          <div className="flex justify-end items-center px-4 py-1">
            <div className="flex gap-8 items-center">
              <p className="text-[11px]">Discount</p>
              <p className="text-[11px] font-semibold">- {formatCurrency(discount || 0)}</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end items-center px-4 py-2">
            <div className="flex gap-8 items-center">
              <p className="text-xs">Total</p>
              <p className="text-base font-semibold">{formatCurrency(total || 0)}</p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-auto flex justify-between items-end">
          {/* Left Column - Contact and Instructions */}
          <div className="flex-1">
            <div className="mb-6">
              <p className="text-[10px] mb-1">For Inquiries or Complains</p>
              <p className="text-[11px] font-semibold mb-2">Call: 0902 571 3908</p>
              <p className="text-[10px] mb-1">Or Visit Our Website:</p>
              <p className="text-[10px] font-semibold text-[#003E2F]">https://www.kadtaxonrent.com.ng</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold mb-2">Payment Instructions for Paydirect (Bank Branch)</p>
              <ol className="text-[8px] space-y-1 list-decimal list-inside">
                <li>Visit any bank branch</li>
                <li>Ensure you have your Invoice Number with you. (E.g 65477000001)</li>
                <li>Ask to make a Paydirect payment</li>
                <li>Inform the teller you want to make payment on Paykaduna Scheme</li>
                <li>Select Withholding Tax on Rent (WHT on Rent)</li>
              </ol>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="flex flex-col items-center ml-8">
            <p className="text-[8px] mb-2">Scan to Pay</p>
            <QRCodeSVG value={`https://paykaduna.com/make_payment_tsp?ref=${paymentReference}`} size={60} level="M" />
          </div>
        </div>
      </div>
    </div>
  )
}
