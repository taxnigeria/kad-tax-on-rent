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
    <div className="invoice-page bg-white p-20 min-h-[297mm] max-w-[210mm] mx-auto relative overflow-hidden flex flex-col font-sans">
      {/* Watermark Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-[0.03] pointer-events-none flex items-center justify-center">
        <Image
          src="/images/attachments-gen-images-public-kaduna-state-government-logo-watermark.jpg"
          alt="Watermark"
          fill
          className="object-contain"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-[40px] font-bold text-[#003E2F] leading-none mb-2">Invoice</h1>
            <div className="space-y-1">
              <p className="text-xs">
                <span className="font-normal text-gray-500">Invoice #: </span>
                <span className="font-semibold">{invoiceNumber}</span>
              </p>
              <p className="text-xs">
                <span className="font-normal text-gray-500">Date: </span>
                <span className="font-semibold">{date}</span>
              </p>
            </div>
          </div>
          <div className="w-[80px] h-[80px] relative">
            <Image
              src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/kadirs-payment-spyvkx/assets/2z4l4zrvjgu4/kadirs-removebg-preview.png"
              alt="Kaduna State Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-[2px] bg-[#003E2F] mb-8" />

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          {/* KADIRS Info */}
          <div>
            <p className="text-xs font-bold uppercase mb-2">Kaduna State Internal Revenue Service</p>
            <p className="text-xs font-semibold capitalize">{areaOffice} Area Office</p>
            <p className="text-xs mt-1 text-[#003E2F]">https://www.kadtaxonrent.com.ng</p>
          </div>

          {/* Client Info */}
          <div>
            <p className="text-xs font-bold mb-2">Client Information</p>
            <div className="space-y-1">
              <p className="text-xs">
                <span className="text-gray-500">Name:</span> <span className="capitalize">{clientName}</span>
              </p>
              <p className="text-xs">
                <span className="text-gray-500">Property Name:</span> <span className="capitalize">{propertyName}</span>
              </p>
              <p className="text-xs">
                <span className="text-gray-500">Phone:</span> {clientPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          {/* Table Header */}
          <div className="bg-[#003E2F] rounded-sm h-[40px] flex items-center px-6 mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-white uppercase tracking-wider">ITEM DESCRIPTION</p>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">AMOUNT (₦)</p>
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-4 px-2">
            {/* Base Amount */}
            <div className="flex justify-between items-center py-1">
              <p className="text-xs">Withholding Tax on Rent</p>
              <p className="text-xs font-bold">{formatCurrency(baseAmount || 0)}</p>
            </div>

            {/* Stamp Duty */}
            <div className="flex justify-between items-center py-1">
              <p className="text-xs">Stamp Duty - 1%</p>
              <p className="text-xs font-bold">{formatCurrency(stampDuty || 0)}</p>
            </div>

            {/* Interest */}
            <div className="flex justify-between items-center py-1">
              <p className="text-xs">Interest - 27%</p>
              <p className="text-xs font-bold">{formatCurrency(interest || 0)}</p>
            </div>

            {/* Penalty */}
            <div className="flex justify-between items-center py-1">
              <p className="text-xs">Penalty - 10%</p>
              <p className="text-xs font-bold">{formatCurrency(penalty || 0)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-gray-200 my-6" />

          {/* Discount */}
          <div className="flex justify-end items-center px-2 py-1 mb-2">
            <div className="flex gap-16 items-center w-[300px] justify-between">
              <p className="text-xs font-medium text-gray-500">Discount</p>
              <p className="text-xs font-bold">- {formatCurrency(discount || 0)}</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end items-center px-2">
            <div className="flex gap-16 items-center w-[300px] justify-between">
              <p className="text-sm font-bold text-gray-700">Total</p>
              <p className="text-xl font-bold">{formatCurrency(total || 0)}</p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-auto grid grid-cols-2 gap-8">
          {/* Left Column - Contact and Instructions */}
          <div>
            <div className="mb-8">
              <p className="text-[10px] text-gray-500 mb-1">For Inquiries or Complains</p>
              <p className="text-xs font-bold mb-2">Call: 0902 571 3908</p>
              <p className="text-[10px] text-gray-500 mb-1">Or Visit Our Website:</p>
              <p className="text-[10px] font-bold text-[#003E2F]">https://www.kadtaxonrent.com.ng</p>
            </div>

            <div>
              <p className="text-[10px] font-bold mb-3">Payment Instructions for Paydirect (Bank Branch)</p>
              <ol className="text-[9px] space-y-2 list-decimal list-inside text-gray-700">
                <li>Visit any bank branch</li>
                <li>Ensure you have your Invoice Number with you. (E.g {paymentReference || invoiceNumber})</li>
                <li>Ask to make a Paydirect payment</li>
                <li>Inform the teller you want to make payment on Paykaduna Scheme</li>
                <li>Select Withholding Tax on Rent (WHT on Rent)</li>
              </ol>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="flex flex-col items-end justify-end pb-2">
            <div className="text-center">
              <p className="text-[9px] mb-2 font-medium">Scan to Pay</p>
              <QRCodeSVG value={`https://paykaduna.com/make_payment_tsp?ref=${paymentReference}`} size={80} level="M" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
