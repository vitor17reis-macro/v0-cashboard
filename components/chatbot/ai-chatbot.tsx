"use client"

import type React from "react"
import { useRef, useState, useContext } from "react"
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
import { useCurrency } from "@/contexts/currency-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIChatbotProps {
  onClose?: () => void
}

export function AIChatbot({ onClose }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
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
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const financeContext = useContext(FinanceContext)
  const { formatCurrency } = useCurrency()

  const userId = financeContext?.userId

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    scrollToBottom()

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        let fullContent = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2))
                fullContent += text
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullContent } : m)),
                )
                scrollToBottom()
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      // Fallback to local response
      const fallbackResponse = generateLocalResponse(input.trim())
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallbackResponse,
        },
      ])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  const generateLocalResponse = (query: string): string => {
    const q = query.toLowerCase()

    if (financeContext) {
      const { accounts = [], goals = [], transactions = [] } = financeContext
      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
      const totalSavings = accounts.filter((a) => a.type === "savings").reduce((sum, a) => sum + a.balance, 0)
      const totalInvestments = accounts.filter((a) => a.type === "investment").reduce((sum, a) => sum + a.balance, 0)

      if (q.includes("saldo") || q.includes("quanto tenho") || q.includes("patrimonio")) {
        return `O teu património total é de **${formatCurrency(totalBalance)}**.\n\n• Poupança: ${formatCurrency(totalSavings)}\n• Investimentos: ${formatCurrency(totalInvestments)}\n\nPosso ajudar-te a analisar mais detalhadamente ou dar sugestões de poupança.`
      }

      if (q.includes("meta") || q.includes("objetivo")) {
        if (goals.length === 0) {
          return "Ainda não tens metas definidas. As metas ajudam-te a poupar para objetivos específicos. Queres que te ajude a criar uma estratégia?"
        }
        const goalsList = goals
          .map((g) => {
            const progress = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(0) : 0
            return `• **${g.name}**: ${progress}% (${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)})`
          })
          .join("\n")
        return `Tens ${goals.length} meta(s):\n\n${goalsList}\n\nQueres dicas para atingir estas metas mais rapidamente?`
      }
    }

    if (q.includes("poupar") || q.includes("poupanca") || q.includes("economizar")) {
      return `**Dicas para poupar mais:**\n\n1. **Regra 50/30/20** - 50% necessidades, 30% desejos, 20% poupança\n2. **Automações** - Configura transferências automáticas no dia do salário\n3. **Revê subscrições** - Cancela serviços que não usas\n4. **Metas visuais** - Define objetivos concretos para te motivar\n\nQueres que crie um plano personalizado?`
    }

    if (q.includes("investir") || q.includes("investimento")) {
      return `**Sobre investimentos:**\n\n• **ETFs** - Fundos diversificados com baixo custo\n• **Juros compostos** - O tempo é o teu maior aliado\n• **Diversificação** - Não ponhas todos os ovos no mesmo cesto\n\nAntes de investir, garante que tens um fundo de emergência (3-6 meses de despesas). Queres saber mais sobre algum tema específico?`
    }

    return `Posso ajudar-te com:\n\n• Consultar o teu saldo e património\n• Analisar despesas e receitas\n• Dicas de poupança personalizadas\n• Explicar conceitos financeiros\n• Criar planos para atingir metas\n\nO que gostarias de saber?`
  }

  const handleQuickAction = (query: string) => {
    setInput(query)
    const form = document.querySelector("form")
    if (form) {
      const event = new Event("submit", { bubbles: true, cancelable: true })
      form.dispatchEvent(event)
    }
  }

  const quickActions = [
    { icon: Wallet, label: "Saldo", query: "Qual é o meu saldo total?" },
    { icon: Target, label: "Metas", query: "Como estão as minhas metas?" },
    { icon: TrendingUp, label: "Investir", query: "Dicas para começar a investir" },
    { icon: Lightbulb, label: "Poupar", query: "Como posso poupar mais dinheiro?" },
    { icon: GraduationCap, label: "Aprender", query: "Explica-me o que são ETFs" },
    { icon: HelpCircle, label: "Ajuda", query: "O que podes fazer?" },
  ]

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
      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
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
                <div className="text-sm whitespace-pre-wrap">
                  {message.content.split("\n").map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
                    </p>
                  ))}
                </div>
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
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
