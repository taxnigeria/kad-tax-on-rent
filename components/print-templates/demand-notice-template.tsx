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

  return (
    <div className="demand-notice-page bg-white p-12 max-w-[210mm] mx-auto">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="w-[90px] h-[100px] relative">
          <Image src="/kaduna-state-government-logo.jpg" alt="Kaduna State Logo" fill className="object-contain" />
        </div>
      </div>

      {/* Header with recipient info and date */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <p className="font-semibold text-xs leading-tight">{recipientName}</p>
          <p className="font-semibold text-xs leading-tight">{recipientAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-xs">Date: {date}</p>
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
          The amount of liabilities extracted from the last ({taxYears}) year(s) {assessmentYear} - {currentYear}{" "}
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
      <div className="mt-20">
        <div className="w-[100px] h-[2px] bg-gray-300 rounded mb-2" />
        <p className="text-[13px] font-bold">{officerName}</p>
        <p className="text-xs font-semibold">{areaOffice} Area Office</p>
        <p className="text-[9px] mt-1">For Executive Chairman</p>
      </div>

      {/* Footer */}
      <div className="text-center mt-12">
        <p className="text-[11px] font-semibold">KADUNA STATE INTERNAL REVENUE SERVICE</p>
        <p className="text-[11px] font-semibold">{areaOfficeAddress}</p>
      </div>
    </div>
  )
}
