import { openai } from "@ai-sdk/openai"
import {
  convertToModelMessages,
  type InferUITools,
  stepCountIs,
  streamText,
  tool,
  type UIDataTypes,
  type UIMessage,
  validateUIMessages,
} from "ai"
import { z } from "zod"

export const maxDuration = 30

// Define tools for taxpayers
const getPropertyInfoTool = tool({
  description: "Get information about a specific property by address or ID",
  inputSchema: z.object({
    query: z.string().describe("Property address or ID to search for"),
  }),
  async execute({ query }) {
    // Mock data - replace with actual Supabase query
    console.log("[v0] Getting property info for:", query)

    // In production, query Supabase:
    // const supabase = await createClient()
    // const { data } = await supabase.from('properties').select('*').ilike('address', `%${query}%`)

    return {
      address: query,
      type: "Residential",
      value: 5000000,
      taxRate: 0.02,
      status: "Active",
    }
  },
})

const getTaxBalanceTool = tool({
  description: "Get the current tax balance for the user",
  inputSchema: z.object({}),
  async execute() {
    console.log("[v0] Getting tax balance")

    // In production, query Supabase for user's tax balance
    // const supabase = await createClient()
    // const { data } = await supabase.from('invoices').select('amount').eq('status', 'pending')

    return {
      balance: 0,
      currency: "NGN",
      dueDate: "2025-12-31",
    }
  },
})

const registerPropertyTool = tool({
  description: "Register a new property for the taxpayer",
  inputSchema: z.object({
    address: z.string().describe("Property address"),
    type: z.enum(["residential", "commercial", "industrial"]).describe("Property type"),
    value: z.number().describe("Estimated property value in Naira"),
  }),
  async execute({ address, type, value }) {
    console.log("[v0] Registering property:", { address, type, value })

    // In production, insert into Supabase:
    // const supabase = await createClient()
    // const { data, error } = await supabase.from('properties').insert({ address, type, value })

    return {
      success: true,
      propertyId: "PROP-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      message: "Property registered successfully",
    }
  },
})

// Admin-specific tools
const getAnalyticsTool = tool({
  description: "Get analytics data for admin dashboard",
  inputSchema: z.object({
    metric: z.enum(["revenue", "properties", "taxpayers", "compliance"]).describe("Metric to retrieve"),
    period: z.enum(["day", "week", "month", "year"]).describe("Time period"),
  }),
  async execute({ metric, period }) {
    console.log("[v0] Getting analytics:", { metric, period })

    // In production, query Supabase for analytics
    return {
      metric,
      period,
      value: Math.floor(Math.random() * 1000000),
      change: Math.floor(Math.random() * 20) - 10,
    }
  },
})

const taxpayerTools = {
  getPropertyInfo: getPropertyInfoTool,
  getTaxBalance: getTaxBalanceTool,
  registerProperty: registerPropertyTool,
} as const

const adminTools = {
  getPropertyInfo: getPropertyInfoTool,
  getTaxBalance: getTaxBalanceTool,
  getAnalytics: getAnalyticsTool,
} as const

export type AIAssistantMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof taxpayerTools> | InferUITools<typeof adminTools>
>

export async function POST(req: Request) {
  const body = await req.json()
  const userRole = body.userRole as "admin" | "taxpayer" | "property_manager"

  // Select tools based on user role
  const tools = userRole === "admin" ? adminTools : taxpayerTools

  const messages = await validateUIMessages<AIAssistantMessage>({
    messages: body.messages,
    tools,
  })

  // System prompt based on role
  const systemPrompt =
    userRole === "admin"
      ? "You are an AI assistant for property tax administrators. Help them with analytics, property management, and administrative tasks. Be professional and data-focused."
      : "You are an AI assistant for taxpayers. Help them understand their tax obligations, register properties, check balances, and make payments. Be friendly, clear, and helpful."

  const result = streamText({
    model: openai("gpt-4o-mini", {
      apiKey: process.env.OPENAI_API_KEY,
    }),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
  })

  return result.toUIMessageStreamResponse()
}
