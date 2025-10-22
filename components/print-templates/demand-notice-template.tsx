import { formatCurrency } from "@/lib/utils"

interface DemandNoticeProps {
  recipientName: string
  recipientAddress: string
  date: string
  assessmentYear: string
  actualAmount: number
  arrears: number
  stampDuty: number
  penalties: number
  interest: number
  totalOutstanding: number
  officerName: string
  areaOffice: string
}

export function DemandNoticeTemplate({
  recipientName,
  recipientAddress,
  date,
  assessmentYear,
  actualAmount,
  arrears,
  stampDuty,
  penalties,
  interest,
  totalOutstanding,
  officerName,
  areaOffice,
}: DemandNoticeProps) {
  return (
    <div className="demand-notice-page">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold">{recipientName}</h2>
        <p className="text-sm">{recipientAddress}</p>
        <p className="text-sm mt-2">Date: {date}</p>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase">Demand Notice on Withholding Tax on Rent</h1>
      </div>

      {/* Legal Text */}
      <div className="mb-6 text-sm leading-relaxed text-justify">
        <p className="mb-4">
          Pursuant to the first schedule part 1 of the Kaduna State Tax (Codification and Consolidation) Law 2020 and
          Section 69(2) of the Personal Income Tax Act 2011, you are required to withhold and remit withholding tax on
          rent.
        </p>
        <p className="mb-4">
          While Part IX Sections 81 and 83 of PITA (2011) provide that the service may make an estimate of the total
          amount of the tax due. All taxes that are deducted and withheld but not remitted within the period of 21 days
          of the succeeding month shall attract penalty and interest.
        </p>
        <p>
          The amount of liabilities extracted from the last (1) years {assessmentYear} amounting to{" "}
          <strong>{formatCurrency(actualAmount)}</strong> is presented to you for remittance to a government-designated
          bank account, and evidence of such payment should be presented within seven (7) days from the date of the
          service of this letter.
        </p>
      </div>

      {/* Breakdown Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b">
              <td className="py-2 text-sm">Actual Current Amount ({new Date().getFullYear()})</td>
              <td className="py-2 text-sm text-right font-semibold">{formatCurrency(actualAmount)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-sm">Actual Withholding Arrears</td>
              <td className="py-2 text-sm text-right font-semibold">{formatCurrency(arrears)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-sm">Stamp Duty (1%)</td>
              <td className="py-2 text-sm text-right font-semibold">{formatCurrency(stampDuty)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-sm">Penalties at 10%</td>
              <td className="py-2 text-sm text-right font-semibold">{formatCurrency(penalties)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-sm">Interest at 21%</td>
              <td className="py-2 text-sm text-right font-semibold">{formatCurrency(interest)}</td>
            </tr>
            <tr className="border-t-2 border-black">
              <td className="py-2 text-sm font-bold">Total Outstanding</td>
              <td className="py-2 text-sm text-right font-bold">{formatCurrency(totalOutstanding)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="font-semibold">{officerName}</p>
        <p className="text-sm">{areaOffice}</p>
        <p className="text-sm font-semibold mt-2">KADUNA STATE INTERNAL REVENUE SERVICE</p>
        <p className="text-xs">No. 1-3 TMS Building Kachia Road Sabon Tasha, Kaduna</p>
      </div>
    </div>
  )
}
