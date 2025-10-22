import { formatCurrency } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"

interface InvoiceItem {
  description: string
  amount: number
}

interface InvoiceProps {
  invoiceNumber: string
  date: string
  clientName: string
  propertyName: string
  clientPhone: string
  areaOffice: string
  items: InvoiceItem[]
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
  items,
  discount,
  total,
  paymentReference,
}: InvoiceProps) {
  return (
    <div className="invoice-page">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoice</h1>
          <p className="text-sm">
            <strong>Invoice #:</strong> {invoiceNumber}
          </p>
          <p className="text-sm">
            <strong>Date:</strong> {date}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">Kaduna State Internal Revenue Service</p>
          <p className="text-sm">{areaOffice}</p>
          <p className="text-sm">No. 1-3 TMS Building Kachia Road Sabon Tasha, Kaduna</p>
          <p className="text-sm text-blue-600">https://www.kadtaxonrent.ng</p>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-8 p-4 bg-gray-50 rounded">
        <h2 className="font-bold mb-2">Client Information</h2>
        <p className="text-sm">
          <strong>Name:</strong> {clientName}
        </p>
        <p className="text-sm">
          <strong>Property Name:</strong> {propertyName}
        </p>
        <p className="text-sm">
          <strong>Phone:</strong> {clientPhone}
        </p>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left text-sm font-semibold">ITEM DESCRIPTION</th>
              <th className="border border-gray-300 p-2 text-right text-sm font-semibold">AMOUNT (₦)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 text-sm">{item.description}</td>
                <td className="border border-gray-300 p-2 text-sm text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="border border-gray-300 p-2 text-sm font-semibold">Discount</td>
              <td className="border border-gray-300 p-2 text-sm text-right">{formatCurrency(discount)}</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-gray-300 p-2 text-sm font-bold">Total</td>
              <td className="border border-gray-300 p-2 text-sm text-right font-bold">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer with QR Code and Instructions */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-bold mb-2">For Inquiries or Complains</h3>
          <p className="text-sm">Call: 09114049832</p>
          <p className="text-sm">Or Visit Our Website:</p>
          <p className="text-sm text-blue-600">https://www.kadtaxonrent.ng</p>

          <div className="mt-4">
            <h3 className="font-bold mb-2">Payment Instructions for Paydirect (Bank Branch)</h3>
            <ol className="text-xs list-decimal list-inside space-y-1">
              <li>Visit any bank branch</li>
              <li>Ensure you have your Invoice No./Reference ID with you. (E.g {paymentReference})</li>
              <li>Ask to make a Paydirect payment</li>
              <li>Inform the teller that the payment is for Kaduna State_Tax scheme</li>
            </ol>
          </div>
        </div>

        <div className="text-center ml-8">
          <p className="text-sm font-semibold mb-2">Scan to Pay</p>
          <QRCodeSVG value={`https://www.kadtaxonrent.ng/pay/${paymentReference}`} size={120} />
        </div>
      </div>
    </div>
  )
}
