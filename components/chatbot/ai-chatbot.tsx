"use client"

import type React from "react"
import { useRef, useEffect, useContext } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SendIcon,
  XIcon,
  Sparkles,
  UserIcon,
  Loader2,
  Wallet,
  Target,
  TrendingUp,
  Lightbulb,
  GraduationCap,
  HelpCircle,
} from "lucide-react"
import { FinanceContext } from "@/components/providers/finance-provider"

interface AIChatbotProps {
  onClose?: () => void
}

export function AIChatbot({ onClose }: AIChatbotProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const financeContext = useContext(FinanceContext)
  const userId = financeContext?.userId

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/chat",
    body: { userId },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `Olá! Sou o assistente inteligente do CashBoard. Posso ajudar-te com:

• **Análise financeira** - Consultar saldo, despesas, receitas
• **Conselhos de poupança** - Dicas personalizadas para poupar
• **Planos financeiros** - Criar estratégias para atingir metas
• **Educação financeira** - Explicar conceitos como ETFs, juros compostos
• **Usar o CashBoard** - Guiar-te nas funcionalidades

Pergunta-me o que quiseres!`,
      },
    ],
  })

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleQuickAction = (query: string) => {
    setInput(query)
    setTimeout(() => {
      const form = document.getElementById("chat-form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 50)
  }

  const quickActions = [
    { icon: Wallet, label: "Saldo", query: "Qual é o meu saldo total?" },
    { icon: Target, label: "Metas", query: "Como estão as minhas metas?" },
    { icon: TrendingUp, label: "Investir", query: "Dicas para começar a investir" },
    { icon: Lightbulb, label: "Poupar", query: "Como posso poupar mais dinheiro?" },
    { icon: GraduationCap, label: "Aprender", query: "Explica-me o que são ETFs" },
    { icon: HelpCircle, label: "Ajuda", query: "O que podes fazer?" },
  ]

  // Helper to get message text content
  const getMessageContent = (message: (typeof messages)[0]): string => {
    // Check if message has parts (new AI SDK format)
    if ("parts" in message && Array.isArray(message.parts)) {
      return message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("")
    }
    // Fallback to content string
    return typeof message.content === "string" ? message.content : ""
  }

  // Helper to render formatted text
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <p key={i} className="mb-1 last:mb-0">
        {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
      </p>
    ))
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Assistente IA</h3>
            <p className="text-xs text-muted-foreground">Powered by Claude</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b">
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-auto py-2 px-3 flex flex-col gap-1 rounded-xl hover:bg-primary/10 hover:border-primary/30 bg-transparent"
              onClick={() => handleQuickAction(action.query)}
              disabled={isLoading}
            >
              <action.icon className="h-4 w-4 text-primary" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        <div className="space-y-4">
          {messages.map((message) => {
            const content = getMessageContent(message)

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {content ? (
                    <div className="text-sm whitespace-pre-wrap">{renderFormattedText(content)}</div>
                  ) : (
                    isLoading &&
                    message.role === "assistant" && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">A pensar...</span>
                      </div>
                    )
                  )}
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">A pensar...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form id="chat-form" onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Escreve a tua pergunta..."
            disabled={isLoading}
            className="rounded-xl"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-xl shrink-0">
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default AIChatbot
