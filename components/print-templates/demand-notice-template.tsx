import { formatCurrency } from "@/lib/utils"
import Image from "next/image"

interface DemandNoticeProps {
  recipientName: string
  recipientAddress: string
  date: string
  assessmentYear: string
  taxYears: number
  actualAmount: number
  arrears: number
  stampDuty: number
  penalties: number
  interest: number
  totalOutstanding: number
  officerName: string
  areaOffice: string
  areaOfficeAddress: string
}

export function DemandNoticeTemplate({
  recipientName,
  recipientAddress,
  date,
  assessmentYear,
  taxYears,
  actualAmount,
  arrears,
  stampDuty,
  penalties,
  interest,
  totalOutstanding,
  officerName,
  areaOffice,
  areaOfficeAddress,
}: DemandNoticeProps) {
  const currentYear = new Date().getFullYear()
  const displayYears = taxYears || 1

  return (
    <div className="demand-notice-page bg-white p-80 min-h-[297mm] max-w-[210mm] mx-auto flex flex-col font-sans">
      {/* Logo */}
      <div className="flex justify-center mb-8">
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

      {/* Header with recipient info and date */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <p className="font-semibold text-xs leading-tight capitalize">{recipientName}</p>
          <p className="font-semibold text-xs leading-tight capitalize">{recipientAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-xs">Date: __/__/{currentYear}</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-xs font-bold uppercase tracking-wide">Demand Notice on Withholding Tax on Rent</h1>
      </div>

      {/* Legal Text */}
      <div className="mb-6 space-y-4">
        <p className="text-[11px] leading-relaxed text-justify">
          Pursuant to the first schedule part 1 of the Kaduna State Tax (Codification and Consolidation) Law 2020 and
          Section 69 (2) of the Personal Income Tax Act 2011, you are required to withhold and remit withholding tax on
          rent.
        </p>
        <p className="text-[11px] leading-relaxed text-justify">
          While Part IX Sections 81 and 83 of PITA (2011) provide that the service may make an estimate of the total
          amount of the tax due. All taxes that are deducted and withheld but not remitted within the period of 21 days
          of the succeeding month shall attract penalty and interest.
        </p>
        <p className="text-[11px] leading-relaxed text-justify">
          The amount of liabilities extracted from the last ({displayYears}) year(s) {assessmentYear} - {currentYear}{" "}
          amounting to <span className="font-semibold">{formatCurrency(actualAmount + arrears)}</span> is presented to
          you for remittance to a government-designated bank account, and evidence of such payment should be presented
          within seven (7) days from the date of the service of this letter.
        </p>
      </div>

      {/* Tax Breakdown */}
      <div className="space-y-3 mb-20">
        {/* Actual Current Amount */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-xs">Actual Current Amount ({currentYear})</p>
          </div>
          <div className="w-[100px] h-[2px] bg-gray-300 rounded" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{formatCurrency(actualAmount)}</p>
          </div>
        </div>

        {/* Actual Withholding Arrears */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-xs">Actual Withholding Arrears</p>
          </div>
          <div className="w-[100px] h-[2px] bg-gray-300 rounded" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{formatCurrency(arrears)}</p>
          </div>
        </div>

        {/* Stamp Duty */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-xs">Stamp Duty (1%)</p>
          </div>
          <div className="w-[100px] h-[2px] bg-gray-300 rounded" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{formatCurrency(stampDuty)}</p>
          </div>
        </div>

        {/* Penalties */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-xs">Penalties at 10%</p>
          </div>
          <div className="w-[100px] h-[2px] bg-gray-300 rounded" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{formatCurrency(penalties)}</p>
          </div>
        </div>

        {/* Interest */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-xs">Interest at 27%</p>
          </div>
          <div className="w-[100px] h-[2px] bg-gray-300 rounded" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{formatCurrency(interest)}</p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-xs font-semibold">Total Outstanding</p>
          </div>
          <div className="w-[100px] h-[2px] bg-gray-300 rounded" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-auto pb-8">
        <div className="w-[100px] h-[2px] bg-gray-300 rounded mb-2" />
        <p className="text-[13px] font-bold capitalize">{officerName}</p>
        <p className="text-xs font-semibold capitalize">{areaOffice} Area Office</p>
        <p className="text-[9px] mt-1">For Executive Chairman</p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase">KADUNA STATE INTERNAL REVENUE SERVICE</p>
        {areaOfficeAddress && <p className="text-[11px] font-semibold capitalize">{areaOfficeAddress}</p>}
      </div>
    </div>
  )
}
