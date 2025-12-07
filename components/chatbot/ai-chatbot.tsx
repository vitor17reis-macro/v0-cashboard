"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  ChevronDown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@supabase/ssr"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIChatbotProps {
  onClose?: () => void
}

const topicQuestions = {
  saldo: [
    "Qual é o meu saldo total atual?",
    "Quanto tenho em cada conta?",
    "Quanto gastei este mês?",
    "Qual foi a minha maior despesa recente?",
    "Estou a gastar mais do que ganho?",
  ],
  metas: [
    "Como estão as minhas metas financeiras?",
    "Quanto falta para atingir cada meta?",
    "Qual meta devo priorizar?",
    "Como posso atingir as metas mais rápido?",
    "Devo criar uma nova meta de poupança?",
  ],
  investir: [
    "Por onde devo começar a investir?",
    "O que são ETFs e como funcionam?",
    "Quanto do meu salário devo investir?",
    "Qual a diferença entre ações e fundos?",
    "É melhor investir tudo de uma vez ou aos poucos?",
  ],
  poupar: [
    "Onde posso cortar despesas?",
    "Como aplicar a regra 50/30/20?",
    "Quanto devo ter em fundo de emergência?",
    "Quais despesas posso eliminar?",
    "Como automatizar a minha poupança?",
  ],
  aprender: [
    "O que são juros compostos?",
    "Como funciona a diversificação?",
    "O que é inflação e como me protejo?",
    "Qual a diferença entre poupar e investir?",
    "O que é um fundo de emergência?",
  ],
  ajuda: [
    "O que podes fazer por mim?",
    "Como adiciono uma transação?",
    "Como crio uma automação?",
    "Como funcionam as metas?",
    "Como exporto os meus dados?",
  ],
}

export function AIChatbot({ onClose }: AIChatbotProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá! Sou o assistente financeiro do CashBoard, powered by Claude.

Posso ajudar-te com:
• **Analisar as tuas finanças** - Saldo, despesas, receitas
• **Dar conselhos personalizados** - Baseados nos teus dados reais
• **Criar planos de poupança** - Estratégias para atingir metas
• **Ensinar conceitos financeiros** - ETFs, juros compostos, etc.

Escolhe um tema acima ou escreve a tua pergunta!`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id)
      }
    })
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter((m) => m.id !== "welcome"), userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: userId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }

      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const textContent = JSON.parse(line.slice(2))
              if (typeof textContent === "string") {
                fullContent += textContent
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullContent } : m)),
                )
                scrollToBottom()
              }
            } catch {
              const text = line.slice(2).replace(/^"|"$/g, "")
              if (text) {
                fullContent += text
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullContent } : m)),
                )
                scrollToBottom()
              }
            }
          }
        }
      }

      if (!fullContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: "Desculpa, não consegui processar a tua pergunta. Por favor tenta novamente." }
              : m,
          ),
        )
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: "Ocorreu um erro ao processar a tua pergunta. Verifica a tua conexão e tenta novamente.",
              }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const quickActions = [
    { icon: Wallet, label: "Saldo", topic: "saldo" },
    { icon: Target, label: "Metas", topic: "metas" },
    { icon: TrendingUp, label: "Investir", topic: "investir" },
    { icon: Lightbulb, label: "Poupar", topic: "poupar" },
    { icon: GraduationCap, label: "Aprender", topic: "aprender" },
    { icon: HelpCircle, label: "Ajuda", topic: "ajuda" },
  ]

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
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shrink-0">
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
      <div className="p-3 border-b shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <DropdownMenu key={action.label}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 flex flex-col gap-1 rounded-xl hover:bg-primary/10 hover:border-primary/30 bg-transparent"
                  disabled={isLoading}
                >
                  <action.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs flex items-center gap-1">
                    {action.label}
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {topicQuestions[action.topic as keyof typeof topicQuestions].map((question, idx) => (
                  <DropdownMenuItem key={idx} onClick={() => sendMessage(question)} className="cursor-pointer">
                    {question}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
                {message.content ? (
                  <div className="text-sm whitespace-pre-wrap">{renderFormattedText(message.content)}</div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">A pensar...</span>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
