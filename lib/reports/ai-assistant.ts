import { generateText } from "ai"
import { z } from "zod"

// Define the expected template structure from AI
const TemplateSchema = z.object({
  name: z.string().describe("Report template name"),
  type: z.enum(["tax_summary", "property_inventory", "payment_analytics", "enumerator_performance", "custom"]),
  description: z.string().describe("Detailed description of what the report shows"),
  metrics: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      calculation: z.string(),
      filter: z.string().optional(),
      format: z.enum(["currency", "percentage", "number", "date"]),
    }),
  ),
  groupBy: z.array(z.string()).describe("Fields to group data by"),
  dateRange: z.enum(["day", "week", "month", "quarter", "year", "custom"]).describe("Default date range"),
})

export type GeneratedTemplate = z.infer<typeof TemplateSchema>

export async function generateTemplateFromDescription(description: string): Promise<GeneratedTemplate> {
  const systemPrompt = `You are a business intelligence expert specializing in property tax management systems.
Convert natural language report requests into structured report templates.
Return ONLY valid JSON matching the exact schema provided.
Focus on practical metrics that admins actually need for this tax system.`

  const userPrompt = `User wants: "${description}"

Based on this request, generate a JSON report template with:
- Appropriate name and type
- 3-5 relevant metrics for this tax/property management system
- Sensible grouping and date range defaults
- Each metric should have clear calculation logic

Return ONLY the JSON object, no other text or markdown.`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 1000,
    })

    let cleanedText = text.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "")
    }

    // Parse and validate the response
    const parsed = JSON.parse(cleanedText)
    const validated = TemplateSchema.parse(parsed)

    return validated
  } catch (error) {
    console.error("[v0] Error generating template:", error)
    throw new Error("Failed to generate template from description. Please try again or use manual creation.")
  }
}

export function getMetricSuggestions(reportType: string): string[] {
  const suggestions: Record<string, string[]> = {
    tax_summary: [
      "Total tax collected",
      "Pending tax amount",
      "Collection rate (%)",
      "Overdue taxes",
      "Monthly trends",
    ],
    property_inventory: [
      "Total properties",
      "Properties by type",
      "Active properties",
      "Property values",
      "Geographic distribution",
    ],
    payment_analytics: [
      "Completed payments",
      "Failed payments",
      "Average payment time",
      "Payment methods distribution",
      "Payment trends",
    ],
    enumerator_performance: [
      "Properties enumerated",
      "Compliance rate",
      "Enumerator efficiency",
      "Data quality score",
      "Workload distribution",
    ],
    custom: [], // Added custom report type suggestion
  }

  return suggestions[reportType] || []
}
