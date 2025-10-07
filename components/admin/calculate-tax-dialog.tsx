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
import { Loader2, DollarSign, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type CalculateTaxDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: any
  onSuccess: () => void
}

export default function CalculateTaxDialog({ open, onOpenChange, property, onSuccess }: CalculateTaxDialogProps) {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [eligibleYears, setEligibleYears] = useState<number[]>([])
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

  const [backlogYears, setBacklogYears] = useState("0")
  const [calculationNotes, setCalculationNotes] = useState("")
  const [generateInvoice, setGenerateInvoice] = useState(true)

  const [loading, setLoading] = useState(false)
  const [existingCalculations, setExistingCalculations] = useState<any[]>([])

  const { toast } = useToast()
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
    setTaxYear(currentYear)
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
    const backlog = Number.parseFloat(backlogYears) || 0

    const baseTax = rent * (rate / 100)
    const backlogTax = baseTax * backlog

    const penalty = applyPenalty ? baseTax * (Number.parseFloat(penaltyRate) / 100) : 0
    const interest = applyInterest ? (baseTax + backlogTax) * (Number.parseFloat(interestRate) / 100) : 0
    const discount = applyDiscount ? Number.parseFloat(discountAmount) || 0 : 0
    const stampDuty = applyStampDuty ? rent * (Number.parseFloat(stampDutyRate) / 100) : 0

    const totalTax = baseTax + backlogTax + penalty + interest + stampDuty - discount

    return {
      baseTax,
      backlogTax,
      penalty,
      interest,
      discount,
      stampDuty,
      totalTax,
    }
  }

  async function handleCalculateTax() {
    if (!property) return

    const preview = calculatePreview()

    setLoading(true)
    try {
      // Create tax calculation
      const { data: calculation, error: calcError } = await supabase
        .from("tax_calculations")
        .insert({
          property_id: property.id,
          tax_year: taxYear,
          annual_rent: Number.parseFloat(annualRent),
          tax_rate: Number.parseFloat(taxRate),
          base_tax_amount: preview.baseTax,
          backlog_tax_amount: preview.backlogTax,
          backlog_years: Number.parseFloat(backlogYears),
          penalty_amount: preview.penalty,
          interest_amount: preview.interest,
          total_tax_due: preview.totalTax,
          calculation_notes: calculationNotes,
          is_active: true,
        })
        .select()
        .single()

      if (calcError) throw calcError

      // Generate invoice if requested
      if (generateInvoice && calculation) {
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        const { error: invoiceError } = await supabase.from("invoices").insert({
          invoice_number: invoiceNumber,
          taxpayer_id: property.owner_id,
          property_id: property.id,
          tax_calculation_id: calculation.id,
          tax_year: taxYear,
          base_amount: preview.baseTax,
          penalty: preview.penalty,
          interest: preview.interest,
          discount: preview.discount,
          stamp_duty: preview.stampDuty,
          total_amount: preview.totalTax,
          balance_due: preview.totalTax,
          amount_paid: 0,
          payment_status: "unpaid",
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })

        if (invoiceError) throw invoiceError
      }

      toast({
        title: "Success",
        description: `Tax calculated successfully${generateInvoice ? " and invoice generated" : ""}`,
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error calculating tax:", error)
      toast({
        title: "Error",
        description: "Failed to calculate tax",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const preview = calculatePreview()
  const hasExistingForYear = existingCalculations.some((calc) => calc.tax_year === taxYear)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculate Property Tax</DialogTitle>
          <DialogDescription>
            Calculate tax for {property?.registered_property_name || "this property"} for a specific year
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Existing Calculations Warning */}
          {hasExistingForYear && (
            <div className="flex items-start gap-2 p-3 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500">Calculation exists for {taxYear}</p>
                <p className="text-muted-foreground">
                  A tax calculation already exists for this year. Creating a new one will not deactivate the existing
                  calculation.
                </p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxYear">Tax Year *</Label>
              <Select value={taxYear.toString()} onValueChange={(value) => setTaxYear(Number.parseInt(value))}>
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

            <div className="space-y-2">
              <Label htmlFor="backlogYears">Backlog Years</Label>
              <Input
                id="backlogYears"
                type="number"
                min="0"
                max="6"
                value={backlogYears}
                onChange={(e) => setBacklogYears(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

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
                  Apply Penalty (10% - Fixed by law)
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
                  Apply Interest (27% - Fixed by law)
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
                  Apply Discount
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
                  Apply Stamp Duty (1% - Fixed by law)
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Calculation Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calculation Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Base Tax ({taxRate}% of ₦{Number(annualRent).toLocaleString()})
                </span>
                <span className="font-medium">
                  ₦{preview.baseTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {preview.backlogTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Backlog Tax ({backlogYears} years)</span>
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
              Generate invoice immediately after calculation
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
                Calculate Tax
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
