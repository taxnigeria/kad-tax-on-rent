"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Bot, Send, X, Loader2, User } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { AIAssistantMessage } from "@/app/api/ai-assistant/route"

interface AIAssistantSidebarProps {
  userRole: "admin" | "taxpayer" | "property_manager"
}

export function AIAssistantSidebar({ userRole }: AIAssistantSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const { messages, sendMessage, status } = useChat<AIAssistantMessage>({
    transport: new DefaultChatTransport({ api: "/api/ai-assistant" }),
    body: { userRole },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || status === "in_progress") return

    sendMessage({ text: inputValue })
    setInputValue("")
  }

  return (
    <>
      {/* Floating Toggle Button (visible when sidebar is closed) */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg"
          size="icon"
        >
          <Bot className="size-6" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      )}

      {/* AI Assistant Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-96 flex-col border-l bg-background shadow-lg transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <div>
              <h2 className="font-semibold">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                {userRole === "admin" ? "Admin Support" : "Taxpayer Support"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="mb-4 size-12 text-muted-foreground/50" />
                <h3 className="mb-2 font-semibold">Welcome to AI Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  {userRole === "admin"
                    ? "Ask me about property data, analytics, or administrative tasks."
                    : "Ask me about your properties, taxes, payments, or registration."}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {message.parts.map((part, index) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <p key={index} className="whitespace-pre-wrap text-sm">
                            {part.text}
                          </p>
                        )

                      case "tool-getPropertyInfo":
                        if (part.state === "input-available") {
                          return (
                            <div key={index} className="text-sm text-muted-foreground">
                              Looking up property information...
                            </div>
                          )
                        }
                        if (part.state === "output-available") {
                          return (
                            <div key={index} className="text-sm">
                              <strong>Property Found:</strong>
                              <pre className="mt-2 rounded bg-background p-2 text-xs">
                                {JSON.stringify(part.output, null, 2)}
                              </pre>
                            </div>
                          )
                        }
                        break

                      case "tool-getTaxBalance":
                        if (part.state === "input-available") {
                          return (
                            <div key={index} className="text-sm text-muted-foreground">
                              Checking tax balance...
                            </div>
                          )
                        }
                        if (part.state === "output-available") {
                          return (
                            <div key={index} className="text-sm">
                              <strong>Tax Balance:</strong> ₦{part.output.balance.toLocaleString()}
                            </div>
                          )
                        }
                        break

                      case "tool-registerProperty":
                        if (part.state === "input-available") {
                          return (
                            <div key={index} className="text-sm text-muted-foreground">
                              Registering property...
                            </div>
                          )
                        }
                        if (part.state === "output-available") {
                          return (
                            <div key={index} className="text-sm">
                              ✅ Property registered successfully!
                            </div>
                          )
                        }
                        break

                      default:
                        return null
                    }
                  })}
                </div>

                {message.role === "user" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}

            {status === "in_progress" && (
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              disabled={status === "in_progress"}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={status === "in_progress" || !inputValue.trim()}>
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">AI can make mistakes. Verify important information.</p>
        </div>
      </div>

      {/* Overlay (when sidebar is open on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default AIAssistantSidebar
