import { generateTemplateFromDescription } from "@/lib/reports/ai-assistant"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const template = await generateTemplateFromDescription(description)

    return NextResponse.json(template)
  } catch (error) {
    console.error("[v0] Error in generate-template API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate template" },
      { status: 500 },
    )
  }
}
