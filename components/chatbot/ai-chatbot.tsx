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
    "Qual é o meu saldo total?",
    "Quanto tenho na conta à ordem?",
    "Qual o meu património líquido?",
    "Quanto gastei este mês?",
    "Qual foi a minha maior despesa?",
  ],
  metas: [
    "Como estão as minhas metas?",
    "Quanto falta para atingir as metas?",
    "Qual meta está mais próxima?",
    "Como posso acelerar as minhas metas?",
    "Devo criar uma nova meta?",
  ],
  investir: [
    "Dicas para começar a investir",
    "O que são ETFs?",
    "Qual a diferença entre ações e ETFs?",
    "Quanto devo investir por mês?",
    "Quais são os riscos de investir?",
  ],
  poupar: [
    "Como posso poupar mais dinheiro?",
    "Qual a regra 50/30/20?",
    "Onde posso cortar despesas?",
    "Quanto devo ter em fundo de emergência?",
    "Dicas para reduzir gastos fixos",
  ],
  aprender: [
    "Explica-me o que são ETFs",
    "O que são juros compostos?",
    "Como funciona a diversificação?",
    "O que é inflação e como me afeta?",
    "Diferença entre poupar e investir",
  ],
  ajuda: [
    "O que podes fazer?",
    "Como adiciono uma transação?",
    "Como crio uma automação?",
    "Como funciona o histórico?",
    "Como exporto os meus dados?",
  ],
}

export function AIChatbot({ onClose }: AIChatbotProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
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

Clica num dos botões abaixo ou escreve a tua pergunta!`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

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
    setSelectedTopic(null)

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

      if (!fullContent) {
        const fallbackResponse = generateLocalResponse(messageText)
        setMessages((prev) => prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fallbackResponse } : m)))
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      const fallbackResponse = generateLocalResponse(messageText)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fallbackResponse,
      }
      setMessages((prev) => {
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

    if (lowerQuery.includes("juros compostos")) {
      return `**Juros Compostos** são os "juros sobre juros" - o conceito mais poderoso em finanças!

**Como funcionam:**
• No 1º ano: ganhas juros sobre o capital inicial
• No 2º ano: ganhas juros sobre capital + juros anteriores
• E assim sucessivamente...

**Exemplo prático:**
• Investes 1.000€ a 7% ao ano
• Ano 1: 1.070€ (+70€)
• Ano 10: 1.967€ (+967€)
• Ano 30: 7.612€ (+6.612€)

**A regra dos 72:**
Divide 72 pela taxa de juro para saber em quantos anos duplicas o dinheiro.
• 7% → 72/7 = ~10 anos para duplicar

**Conclusão:** Quanto mais cedo começares, mais os juros compostos trabalham por ti!`
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
