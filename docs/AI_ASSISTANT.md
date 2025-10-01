# AI Assistant Integration

The AI assistant is integrated into both the admin and taxpayer dashboards as a docked right sidebar. It uses the Vercel AI SDK with OpenAI GPT-4o-mini to provide conversational assistance and execute actions through tool calling.

## Features

### For Taxpayers
- **Property Information**: Ask about specific properties by address or ID
- **Tax Balance**: Check current tax balance and due dates
- **Property Registration**: Register new properties through conversation
- **General Help**: Get answers about tax obligations, payment processes, and documentation

### For Admins
- **Property Information**: Look up any property in the system
- **Tax Balance**: Check any taxpayer's balance
- **Analytics**: Query system analytics (revenue, properties, taxpayers, compliance)
- **Administrative Tasks**: Get help with admin operations

## Architecture

### Components

**`components/ai-assistant-sidebar.tsx`**
- Floating toggle button (bottom-right when closed)
- Slide-in sidebar with chat interface
- Role-aware UI (shows different welcome messages for admin vs taxpayer)
- Real-time streaming responses
- Tool execution visualization

**`app/api/ai-assistant/route.ts`**
- API route handler for AI chat
- Role-based tool selection
- Streaming responses with tool calling
- Integration with Supabase (ready for production data)

### Tools

Tools are defined using the AI SDK's `tool()` function with:
- `description`: What the tool does (helps AI decide when to use it)
- `inputSchema`: Zod schema for input validation
- `execute`: Async function that performs the action

#### Current Tools

**Taxpayer Tools:**
1. `getPropertyInfo` - Look up property details
2. `getTaxBalance` - Check tax balance
3. `registerProperty` - Register a new property

**Admin Tools:**
1. `getPropertyInfo` - Look up any property
2. `getTaxBalance` - Check any taxpayer's balance
3. `getAnalytics` - Query system analytics

## Usage

### Opening the Assistant

Click the floating bot icon in the bottom-right corner of any dashboard page.

### Example Queries

**Taxpayers:**
- "What's my current tax balance?"
- "I want to register a property at 123 Main Street"
- "Show me information about my property on Oak Avenue"
- "When is my next payment due?"

**Admins:**
- "Show me revenue analytics for this month"
- "How many properties were registered this week?"
- "Look up property at 456 Commerce Street"
- "What's the compliance rate?"

## Extending the AI Assistant

### Adding New Tools

1. **Define the tool** in `app/api/ai-assistant/route.ts`:

\`\`\`typescript
const myNewTool = tool({
  description: "Clear description of what this tool does",
  inputSchema: z.object({
    param1: z.string().describe("Description of param1"),
    param2: z.number().describe("Description of param2"),
  }),
  async execute({ param1, param2 }) {
    // Your logic here
    const supabase = await createClient()
    const { data } = await supabase.from('table').select('*')
    
    return {
      result: data,
    }
  },
})
\`\`\`

2. **Add to tool set**:

\`\`\`typescript
const taxpayerTools = {
  // ... existing tools
  myNewTool: myNewTool,
} as const
\`\`\`

3. **Handle in UI** (optional, for custom visualization):

In `components/ai-assistant-sidebar.tsx`, add a case for your tool:

\`\`\`typescript
case "tool-myNewTool":
  if (part.state === "input-available") {
    return <div>Processing...</div>
  }
  if (part.state === "output-available") {
    return <div>Result: {part.output.result}</div>
  }
  break
\`\`\`

### Connecting to Real Data

The current implementation uses mock data. To connect to Supabase:

1. **Uncomment Supabase queries** in tool execute functions
2. **Add proper error handling**:

\`\`\`typescript
async execute({ query }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .ilike('address', `%${query}%`)
    
    if (error) throw error
    
    return data[0] || { message: "Property not found" }
  } catch (error) {
    console.error("[v0] Error fetching property:", error)
    throw new Error("Failed to fetch property information")
  }
}
\`\`\`

3. **Add authentication checks**:

\`\`\`typescript
async execute({ query }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }
  
  // Continue with query...
}
\`\`\`

### Customizing System Prompts

Edit the system prompts in `app/api/ai-assistant/route.ts`:

\`\`\`typescript
const systemPrompt =
  userRole === "admin"
    ? "Your custom admin prompt here..."
    : "Your custom taxpayer prompt here..."
\`\`\`

### Adjusting AI Model

Change the model in the API route:

\`\`\`typescript
const result = streamText({
  model: "openai/gpt-4o",  // or "anthropic/claude-sonnet-4.5", etc.
  // ... rest of config
})
\`\`\`

## Environment Variables

The AI assistant uses OpenAI through the Vercel AI Gateway. No additional environment variables are needed beyond what's already configured in your project.

If you want to use your own OpenAI API key:

1. Add `OPENAI_API_KEY` to your environment variables
2. Update the model configuration to use the provider package

## Security Considerations

1. **Role-based access**: Tools are filtered by user role
2. **Authentication**: All API routes should verify user authentication
3. **Data isolation**: Taxpayers should only access their own data
4. **Rate limiting**: Consider adding rate limits to prevent abuse
5. **Audit logging**: Log all AI-initiated actions for compliance

## Performance

- **Streaming**: Responses stream in real-time for better UX
- **Max steps**: Limited to 5 steps to prevent infinite loops
- **Timeout**: 30-second max duration for API routes
- **Caching**: Consider caching frequent queries

## Troubleshooting

**Assistant not responding:**
- Check browser console for errors
- Verify API route is accessible at `/api/ai-assistant`
- Check OpenAI API status

**Tools not executing:**
- Verify tool descriptions are clear
- Check Supabase connection
- Review server logs for errors

**Slow responses:**
- Consider using a faster model (gpt-4o-mini)
- Optimize database queries
- Add caching for common requests
