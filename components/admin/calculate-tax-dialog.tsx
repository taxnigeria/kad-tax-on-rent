"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, DollarSign, AlertCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type CalculateTaxDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: any
  onSuccess: () => void
}

export default function CalculateTaxDialog({ open, onOpenChange, property, onSuccess }: CalculateTaxDialogProps) {
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [endYear, setEndYear] = useState(new Date().getFullYear())
  const [eligibleYears, setEligibleYears] = useState<number[]>([])

  const [calculationMode, setCalculationMode] = useState<"single" | "range">("single")

  const [taxRate, setTaxRate] = useState("10") // 10% tax rate
  const [annualRent, setAnnualRent] = useState("")

  // Optional charges with fixed legal rates
  const [applyPenalty, setApplyPenalty] = useState(false)
  const [penaltyRate] = useState("10") // Fixed 10% penalty rate

  const [applyInterest, setApplyInterest] = useState(false)
  const [interestRate] = useState("27") // Fixed 27% interest rate

  const [applyDiscount, setApplyDiscount] = useState(false)
  const [discountAmount, setDiscountAmount] = useState("")

  const [applyStampDuty, setApplyStampDuty] = useState(false)
  const [stampDutyRate] = useState("1") // Fixed 1% stamp duty rate

  const [calculationNotes, setCalculationNotes] = useState("")
  const [generateInvoice, setGenerateInvoice] = useState(true)

  const [loading, setLoading] = useState(false)
  const [existingCalculations, setExistingCalculations] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (open && property) {
      calculateEligibleYears()
      fetchExistingCalculations()
      setAnnualRent(property.total_annual_rent?.toString() || "")
    }
  }, [open, property])

  function calculateEligibleYears() {
    if (!property?.rental_commencement_date) {
      setEligibleYears([new Date().getFullYear()])
      return
    }

    const currentYear = new Date().getFullYear()
    const commencementYear = new Date(property.rental_commencement_date).getFullYear()

    // Max 6 years back, but not before rental commencement
    const earliestYear = Math.max(currentYear - 6, commencementYear)

    const years = Array.from({ length: currentYear - earliestYear + 1 }, (_, i) => earliestYear + i)
    setEligibleYears(years)
    setStartYear(currentYear)
    setEndYear(currentYear)
  }

  async function fetchExistingCalculations() {
    if (!property?.id) return

    try {
      const { data, error } = await supabase
        .from("tax_calculations")
        .select("*")
        .eq("property_id", property.id)
        .order("tax_year", { ascending: false })

      if (error) throw error
      setExistingCalculations(data || [])
    } catch (error) {
      console.error("Error fetching calculations:", error)
    }
  }

  function calculatePreview() {
    const rent = Number.parseFloat(annualRent) || 0
    const rate = Number.parseFloat(taxRate) || 0

    const baseTax = rent * (rate / 100)

    // Calculate number of years in range
    const yearsInRange = calculationMode === "range" ? endYear - startYear + 1 : 1

    // Calculate backlog (years before current year in the range)
    const currentYear = new Date().getFullYear()
    let backlogYears = 0
    if (calculationMode === "range") {
      // Count how many years in the range are before current year
      for (let year = startYear; year < currentYear && year <= endYear; year++) {
        backlogYears++
      }
    }

    const backlogTax = baseTax * backlogYears

    const penalty = applyPenalty ? baseTax * (Number.parseFloat(penaltyRate) / 100) * yearsInRange : 0
    const interest = applyInterest ? (baseTax + backlogTax) * (Number.parseFloat(interestRate) / 100) : 0
    const discount = applyDiscount ? Number.parseFloat(discountAmount) || 0 : 0
    const stampDuty = applyStampDuty ? baseTax * (Number.parseFloat(stampDutyRate) / 100) * yearsInRange : 0

    const totalTax = baseTax * yearsInRange + penalty + interest + stampDuty - discount

    return {
      baseTax,
      backlogTax,
      penalty,
      interest,
      discount,
      stampDuty,
      totalTax,
      yearsInRange,
      backlogYears,
    }
  }

  async function handleCalculateTax() {
    if (!property) return

    const preview = calculatePreview()

    setLoading(true)
    try {
      const yearsToCalculate =
        calculationMode === "range"
          ? Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
          : [startYear]

      const currentYear = new Date().getFullYear()
      const rent = Number.parseFloat(annualRent)
      const rate = Number.parseFloat(taxRate)
      const baseTax = rent * (rate / 100)

      const backlogYears = yearsToCalculate.filter((year) => year < currentYear)
      const currentYears = yearsToCalculate.filter((year) => year >= currentYear)

      const calculationPromises = []
      let totalInvoicesCreated = 0

      if (backlogYears.length > 0) {
        const backlogStartYear = Math.min(...backlogYears)
        const backlogEndYear = Math.max(...backlogYears)
        const numBacklogYears = backlogYears.length

        // Calculate total backlog tax
        const backlogTaxTotal = baseTax * numBacklogYears

        // Calculate charges for backlog
        const penaltyForBacklog = applyPenalty ? baseTax * (Number.parseFloat(penaltyRate) / 100) * numBacklogYears : 0
        const interestForBacklog = applyInterest
          ? (baseTax * numBacklogYears + backlogTaxTotal) * (Number.parseFloat(interestRate) / 100)
          : 0
        const stampDutyForBacklog = applyStampDuty
          ? rent * (Number.parseFloat(stampDutyRate) / 100) * numBacklogYears
          : 0

        // Apply discount only if this is the only calculation
        const discountForBacklog =
          applyDiscount && currentYears.length === 0 ? Number.parseFloat(discountAmount) || 0 : 0

        const totalTaxForBacklog =
          baseTax * numBacklogYears +
          backlogTaxTotal +
          penaltyForBacklog +
          interestForBacklog +
          stampDutyForBacklog -
          discountForBacklog

        // Create single backlog calculation
        const backlogPromise = (async () => {
          let billReference = null

          if (generateInvoice) {
            const { createPayKadunaInvoice } = await import("@/app/actions/invoices")

            const payKadunaResult = await createPayKadunaInvoice({
              taxpayerId: property.owner_id,
              propertyId: property.id,
              taxYear: backlogEndYear,
              stampDuty: stampDutyForBacklog,
              baseTax: baseTax * numBacklogYears,
              penalty: penaltyForBacklog,
              interest: interestForBacklog,
              discount: discountForBacklog,
              narration: `Backlog tax for ${numBacklogYears} year(s): ${backlogStartYear}-${backlogEndYear}`,
            })

            if (!payKadunaResult.success) {
              throw new Error(`PayKaduna API failed: ${payKadunaResult.error}`)
            }

            billReference = payKadunaResult.data?.billReference
            console.log("[v0] PayKaduna invoice created with bill reference:", billReference)
          }

          const { data: calculation, error: calcError } = await supabase
            .from("tax_calculations")
            .insert({
              property_id: property.id,
              tax_year: backlogEndYear,
              annual_rent: rent,
              tax_rate: rate,
              base_tax_amount: baseTax,
              backlog_tax_amount: backlogTaxTotal,
              backlog_years: numBacklogYears,
              backlog_start_date: `${backlogStartYear}-01-01`,
              backlog_end_date: `${backlogEndYear}-12-31`,
              penalty_amount: penaltyForBacklog,
              interest_amount: interestForBacklog,
              total_tax_due: totalTaxForBacklog,
              calculation_notes:
                calculationMode === "range"
                  ? `${calculationNotes} (Backlog for ${backlogStartYear}-${backlogEndYear}, ${numBacklogYears} years combined)`
                  : calculationNotes,
              is_active: true,
            })
            .select()
            .single()

          if (calcError) throw calcError

          if (generateInvoice && calculation) {
            const invoiceNumber = `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            const { error: invoiceError } = await supabase.from("invoices").insert({
              invoice_number: invoiceNumber,
              bill_reference: billReference, // Use bill reference from PayKaduna
              taxpayer_id: property.owner_id,
              property_id: property.id,
              tax_calculation_id: calculation.id,
              tax_year: backlogEndYear,
              tax_period: `${backlogStartYear}-${backlogEndYear}`,
              base_amount: baseTax * numBacklogYears,
              penalty: penaltyForBacklog,
              interest: interestForBacklog,
              discount: discountForBacklog,
              stamp_duty: stampDutyForBacklog,
              total_amount: totalTaxForBacklog,
              balance_due: totalTaxForBacklog,
              amount_paid: 0,
              payment_status: "unpaid",
              issue_date: new Date().toISOString().split("T")[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              narration: `Backlog tax for ${numBacklogYears} year(s): ${backlogStartYear}-${backlogEndYear}`,
            })

            if (invoiceError) throw invoiceError
            totalInvoicesCreated++
          }

          return calculation
        })()

        calculationPromises.push(backlogPromise)
      }

      for (const year of currentYears) {
        const yearPromise = (async () => {
          // Calculate charges per year
          const penaltyForYear = applyPenalty ? baseTax * (Number.parseFloat(penaltyRate) / 100) : 0
          const interestForYear = applyInterest ? baseTax * (Number.parseFloat(interestRate) / 100) : 0
          const stampDutyForYear = applyStampDuty ? rent * (Number.parseFloat(stampDutyRate) / 100) : 0

          // Apply discount only if this is the only calculation
          const discountForYear =
            applyDiscount && currentYears.length === 1 && backlogYears.length === 0
              ? Number.parseFloat(discountAmount) || 0
              : 0

          const totalTaxForYear = baseTax + penaltyForYear + interestForYear + stampDutyForYear - discountForYear

          let billReference = null

          if (generateInvoice) {
            const { createPayKadunaInvoice } = await import("@/app/actions/invoices")

            const payKadunaResult = await createPayKadunaInvoice({
              taxpayerId: property.owner_id,
              propertyId: property.id,
              taxYear: year,
              stampDuty: stampDutyForYear,
              baseTax: baseTax,
              penalty: penaltyForYear,
              interest: interestForYear,
              discount: discountForYear,
              narration: `Withholding Tax on Rent - ${year}`,
            })

            if (!payKadunaResult.success) {
              throw new Error(`PayKaduna API failed: ${payKadunaResult.error}`)
            }

            billReference = payKadunaResult.data?.billReference
            console.log("[v0] PayKaduna invoice created for year", year, "with bill reference:", billReference)
          }

          const { data: calculation, error: calcError } = await supabase
            .from("tax_calculations")
            .insert({
              property_id: property.id,
              tax_year: year,
              annual_rent: rent,
              tax_rate: rate,
              base_tax_amount: baseTax,
              backlog_tax_amount: 0,
              backlog_years: 0,
              penalty_amount: penaltyForYear,
              interest_amount: interestForYear,
              total_tax_due: totalTaxForYear,
              calculation_notes:
                calculationMode === "range"
                  ? `${calculationNotes} (Part of ${startYear}-${endYear} range calculation)`
                  : calculationNotes,
              is_active: true,
            })
            .select()
            .single()

          if (calcError) throw calcError

          if (generateInvoice && calculation) {
            const invoiceNumber = `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            const { error: invoiceError } = await supabase.from("invoices").insert({
              invoice_number: invoiceNumber,
              bill_reference: billReference, // Use bill reference from PayKaduna
              taxpayer_id: property.owner_id,
              property_id: property.id,
              tax_calculation_id: calculation.id,
              tax_year: year,
              tax_period: year.toString(),
              base_amount: baseTax,
              penalty: penaltyForYear,
              interest: interestForYear,
              discount: discountForYear,
              stamp_duty: stampDutyForYear,
              total_amount: totalTaxForYear,
              balance_due: totalTaxForYear,
              amount_paid: 0,
              payment_status: "unpaid",
              issue_date: new Date().toISOString().split("T")[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            })

            if (invoiceError) throw invoiceError
            totalInvoicesCreated++
          }

          return calculation
        })()

        calculationPromises.push(yearPromise)
      }

      await Promise.all(calculationPromises)

      const totalCalculations = (backlogYears.length > 0 ? 1 : 0) + currentYears.length
      let successMessage = ""

      if (backlogYears.length > 0 && currentYears.length > 0) {
        successMessage = `Tax calculated: ${backlogYears.length} backlog year(s) combined + ${currentYears.length} current year(s)`
      } else if (backlogYears.length > 0) {
        successMessage = `Backlog tax calculated for ${backlogYears.length} year(s) (${Math.min(...backlogYears)}-${Math.max(...backlogYears)})`
      } else {
        successMessage = `Tax calculated for ${currentYears.length} year(s)`
      }

      if (generateInvoice) {
        successMessage += ` and ${totalInvoicesCreated} PayKaduna invoice(s) generated`
      }

      toast.success(successMessage)

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error calculating tax:", error)
      toast.error(error instanceof Error ? error.message : "Failed to calculate tax")
    } finally {
      setLoading(false)
    }
  }

  const preview = calculatePreview()
  const yearsToCalculate =
    calculationMode === "range" ? Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i) : [startYear]
  const hasExistingInRange = yearsToCalculate.some((year) =>
    existingCalculations.some((calc) => calc.tax_year === year),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculate Property Tax</DialogTitle>
          <DialogDescription>
            Calculate tax for {property?.registered_property_name || "this property"} - single year or year range
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Calculation Mode</Label>
            <RadioGroup value={calculationMode} onValueChange={(value: any) => setCalculationMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="cursor-pointer font-normal">
                  Single Year - Calculate tax for one specific year
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range" className="cursor-pointer font-normal">
                  Year Range - Calculate tax for multiple years (including backlog)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Existing Calculations Warning */}
          {hasExistingInRange && (
            <div className="flex items-start gap-2 p-3 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500">
                  {calculationMode === "range"
                    ? `Calculations exist for some years in ${startYear}-${endYear}`
                    : `Calculation exists for ${startYear}`}
                </p>
                <p className="text-muted-foreground">Creating new calculations will not deactivate existing ones.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {calculationMode === "single" ? (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="startYear">Tax Year *</Label>
                <Select value={startYear.toString()} onValueChange={(value) => setStartYear(Number.parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                        {existingCalculations.some((calc) => calc.tax_year === year) && " (has calculation)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startYear">Start Year *</Label>
                  <Select
                    value={startYear.toString()}
                    onValueChange={(value) => {
                      const newStart = Number.parseInt(value)
                      setStartYear(newStart)
                      if (newStart > endYear) {
                        setEndYear(newStart)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                          {existingCalculations.some((calc) => calc.tax_year === year) && " ✓"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endYear">End Year *</Label>
                  <Select
                    value={endYear.toString()}
                    onValueChange={(value) => {
                      const newEnd = Number.parseInt(value)
                      setEndYear(newEnd)
                      if (newEnd < startYear) {
                        setStartYear(newEnd)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleYears.map((year) => (
                        <SelectItem key={year} value={year.toString()} disabled={year < startYear}>
                          {year}
                          {existingCalculations.some((calc) => calc.tax_year === year) && " ✓"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="annualRent">Annual Rent (₦) *</Label>
              <Input
                id="annualRent"
                type="number"
                value={annualRent}
                onChange={(e) => setAnnualRent(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%) *</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="10.00"
              />
            </div>
          </div>

          {calculationMode === "range" && (
            <div className="flex items-start gap-2 p-3 border border-blue-500/20 bg-blue-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-500">
                  Calculating for {preview.yearsInRange} year{preview.yearsInRange > 1 ? "s" : ""} ({startYear} -{" "}
                  {endYear})
                </p>
                <p className="text-muted-foreground">
                  {preview.backlogYears > 0 && preview.yearsInRange > preview.backlogYears
                    ? `Backlog: ${preview.backlogYears} year(s) combined into 1 calculation • Current: ${preview.yearsInRange - preview.backlogYears} separate calculation(s)`
                    : preview.backlogYears > 0
                      ? `All ${preview.backlogYears} year(s) are backlog - will be combined into 1 calculation`
                      : "No backlog years in this range"}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Optional Charges */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Optional Charges</h3>

            {/* Penalty */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="applyPenalty"
                checked={applyPenalty}
                onCheckedChange={(checked) => setApplyPenalty(checked as boolean)}
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="applyPenalty" className="cursor-pointer">
                  Apply Penalty (10%)
                </Label>
              </div>
            </div>

            {/* Interest */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="applyInterest"
                checked={applyInterest}
                onCheckedChange={(checked) => setApplyInterest(checked as boolean)}
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="applyInterest" className="cursor-pointer">
                  Apply Interest (27%)
                </Label>
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="applyDiscount"
                checked={applyDiscount}
                onCheckedChange={(checked) => setApplyDiscount(checked as boolean)}
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="applyDiscount" className="cursor-pointer">
                  Apply Discount {calculationMode === "range" && "(applied to total)"}
                </Label>
                {applyDiscount && (
                  <Input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="Discount amount (₦)"
                  />
                )}
              </div>
            </div>

            {/* Stamp Duty */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="applyStampDuty"
                checked={applyStampDuty}
                onCheckedChange={(checked) => setApplyStampDuty(checked as boolean)}
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="applyStampDuty" className="cursor-pointer">
                  Apply Stamp Duty (1%)
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Calculation Preview {calculationMode === "range" && `(${preview.yearsInRange} years)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Base Tax per Year ({taxRate}% of ₦{Number(annualRent).toLocaleString()})
                </span>
                <span className="font-medium">
                  ₦{preview.baseTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {calculationMode === "range" && preview.backlogYears < preview.yearsInRange && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Base Tax ({preview.yearsInRange} years)</span>
                  <span className="font-medium">
                    ₦
                    {(preview.baseTax * preview.yearsInRange).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              {preview.backlogYears > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Backlog Tax ({preview.backlogYears} years)</span>
                  <span className="font-medium">
                    ₦
                    {preview.backlogTax.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              {preview.penalty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Penalty (10%)</span>
                  <span className="font-medium">
                    ₦{preview.penalty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {preview.interest > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest (27%)</span>
                  <span className="font-medium">
                    ₦
                    {preview.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {preview.stampDuty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stamp Duty (1%)</span>
                  <span className="font-medium">
                    ₦
                    {preview.stampDuty.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              {preview.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600">
                    -₦
                    {preview.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total Tax Due</span>
                <span>
                  ₦{preview.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {calculationMode === "range" && preview.yearsInRange > 1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {preview.backlogYears > 0 && preview.yearsInRange > preview.backlogYears
                    ? `This will create ${1 + (preview.yearsInRange - preview.backlogYears)} calculation(s): 1 combined backlog + ${preview.yearsInRange - preview.backlogYears} current year(s)`
                    : preview.backlogYears > 0
                      ? `This will create 1 combined backlog calculation for all ${preview.backlogYears} year(s)`
                      : `This will create ${preview.yearsInRange} separate calculations`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Calculation Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={calculationNotes}
              onChange={(e) => setCalculationNotes(e.target.value)}
              placeholder="Add any notes about this calculation..."
              rows={3}
            />
          </div>

          {/* Generate Invoice Option */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="generateInvoice"
              checked={generateInvoice}
              onCheckedChange={(checked) => setGenerateInvoice(checked as boolean)}
            />
            <Label htmlFor="generateInvoice" className="cursor-pointer">
              Generate invoice{calculationMode === "range" && "s"} immediately after calculation
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCalculateTax} disabled={!annualRent || !taxRate || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Calculate Tax {calculationMode === "range" && `(${preview.yearsInRange} years)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
