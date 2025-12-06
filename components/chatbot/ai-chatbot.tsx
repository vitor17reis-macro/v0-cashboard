"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIChatbotProps {
  onClose?: () => void
}

export function AIChatbot({ onClose }: AIChatbotProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

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
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // If no content was received, show a fallback message
      if (!fullContent) {
        const fallbackResponse = generateLocalResponse(messageText)
        setMessages((prev) => prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fallbackResponse } : m)))
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      // Generate local response as fallback
      const fallbackResponse = generateLocalResponse(messageText)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fallbackResponse,
      }
      setMessages((prev) => {
        // Remove empty assistant message if exists
        const filtered = prev.filter((m) => m.role !== "assistant" || m.content !== "")
        return [...filtered, assistantMessage]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateLocalResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("saldo") || lowerQuery.includes("balanço") || lowerQuery.includes("quanto tenho")) {
      return `Para ver o teu saldo, consulta a secção **Visão Geral** no menu lateral. Lá encontras:

• **Saldo Líquido** - O teu saldo atual
• **Receitas** - Total de entradas no período
• **Despesas** - Total de saídas no período
• **Poupança** - Valor acumulado em poupança

Também podes ver o saldo individual de cada conta na secção **As Minhas Contas**.`
    }

    if (lowerQuery.includes("meta") || lowerQuery.includes("objetivo")) {
      return `As tuas metas financeiras estão visíveis na secção **Metas Financeiras** da Visão Geral. Para cada meta podes:

• Ver o progresso atual em percentagem
• Adicionar dinheiro clicando em **Depositar**
• Levantar dinheiro para uma conta
• Editar ou eliminar a meta

**Dica:** Define metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes e Temporais) para maior sucesso!`
    }

    if (lowerQuery.includes("etf") || lowerQuery.includes("investir") || lowerQuery.includes("investimento")) {
      return `**ETFs (Exchange Traded Funds)** são fundos de investimento negociados em bolsa. Funcionam assim:

• **Diversificação** - Um ETF pode conter centenas de ações ou obrigações
• **Baixo custo** - Taxas muito menores que fundos tradicionais
• **Liquidez** - Podes comprar e vender a qualquer momento
• **Transparência** - Sabes exatamente o que contém

**ETFs populares para iniciantes:**
• IWDA - Ações mundiais desenvolvidas
• VWCE - Ações mundiais (incluindo emergentes)
• AGGH - Obrigações globais

**Dica:** Começa com um ETF diversificado e investe regularmente (DCA).`
    }

    if (lowerQuery.includes("poupar") || lowerQuery.includes("poupança") || lowerQuery.includes("economizar")) {
      return `**Estratégias para poupar mais:**

1. **Regra 50/30/20**
   • 50% para necessidades (renda, comida, contas)
   • 30% para desejos (lazer, compras)
   • 20% para poupança e investimentos

2. **Automatiza a poupança**
   • Usa as **Automações** do CashBoard
   • Cria uma regra para transferir X% do salário automaticamente

3. **Elimina gastos invisíveis**
   • Revê subscrições na secção **Assinaturas**
   • Identifica despesas recorrentes desnecessárias

4. **Define metas claras**
   • Cria metas específicas (viagem, fundo emergência)
   • Visualizar o objetivo ajuda a manter o foco`
    }

    if (lowerQuery.includes("ajuda") || lowerQuery.includes("fazer") || lowerQuery.includes("funcionalidade")) {
      return `**O que posso fazer por ti:**

• **Análise financeira** - Pergunta sobre saldo, despesas, receitas
• **Educação** - Explico conceitos como ETFs, juros compostos, diversificação
• **Dicas de poupança** - Estratégias personalizadas para poupar mais
• **Planeamento** - Ajudo a criar planos para atingir objetivos
• **Navegação** - Guio-te pelas funcionalidades do CashBoard

**Funcionalidades do CashBoard:**
• 📊 Visão Geral - Dashboard principal
• 📜 Histórico - Todas as transações
• 📈 Comparação - Análise de períodos
• 📋 Relatórios - Gráficos detalhados
• 🔮 Previsão - Projeções futuras
• 🔄 Automações - Regras automáticas
• 💳 Assinaturas - Gestão de subscrições`
    }

    return `Obrigado pela tua pergunta! Posso ajudar-te com:

• **Análise financeira** - Consulta saldo, despesas, receitas
• **Educação financeira** - ETFs, juros compostos, diversificação
• **Dicas de poupança** - Estratégias para poupar mais
• **Usar o CashBoard** - Guiar-te nas funcionalidades

Tenta ser mais específico na tua pergunta para eu poder ajudar melhor!`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (query: string) => {
    sendMessage(query)
  }

  const quickActions = [
    { icon: Wallet, label: "Saldo", query: "Qual é o meu saldo total?" },
    { icon: Target, label: "Metas", query: "Como estão as minhas metas?" },
    { icon: TrendingUp, label: "Investir", query: "Dicas para começar a investir" },
    { icon: Lightbulb, label: "Poupar", query: "Como posso poupar mais dinheiro?" },
    { icon: GraduationCap, label: "Aprender", query: "Explica-me o que são ETFs" },
    { icon: HelpCircle, label: "Ajuda", query: "O que podes fazer?" },
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
