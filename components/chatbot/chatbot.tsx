"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, XIcon, BotIcon, UserIcon, SparklesIcon } from "lucide-react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatbotProps {
  onClose: () => void
}

// Predefined responses for common questions (fallback when no API)
const PREDEFINED_RESPONSES: Record<string, string> = {
  "como adicionar transação":
    "Para adicionar uma transação, clique no botão verde '+ Nova Transação' no canto superior direito. Pode escolher entre receita, despesa, investimento ou poupança.",
  "como criar categoria":
    "Clique no ícone de etiqueta (tag) na barra superior. Abrirá um painel onde pode adicionar novas categorias de receita ou despesa com cores personalizadas.",
  "como definir orçamento":
    "Clique no ícone de engrenagem na barra superior para aceder à gestão de orçamentos. Pode definir limites mensais para cada categoria de despesa.",
  "como criar meta":
    "Na secção 'Metas Financeiras' do dashboard, clique no botão '+' para criar uma nova meta. Defina o nome, valor alvo, prazo e cor.",
  "como transferir para meta":
    "Em cada meta financeira, clique no botão verde 'Depositar' ou no menu de 3 pontos e selecione 'Depositar Dinheiro'. Escolha a conta de origem e o valor.",
  "como criar conta":
    "Na secção 'As Minhas Contas' do dashboard, clique no botão '+' para adicionar uma nova conta bancária (conta à ordem, poupança, investimentos, etc.).",
  "como ver histórico":
    "Clique em 'Histórico' na barra de navegação para ver todas as suas transações. Pode filtrar por tipo e pesquisar por descrição.",
  "como exportar dados":
    "Clique no ícone de download na barra superior para exportar todas as suas transações em formato CSV.",
  "como reverter transação":
    "Vá ao 'Histórico', encontre a transação que pretende anular e clique em 'Reverter'. Confirme a ação no diálogo que aparece.",
  "o que são assinaturas":
    "A secção 'Assinaturas' permite gerir pagamentos recorrentes como Netflix, Spotify, etc. Pode adicionar, pausar ou cancelar assinaturas.",
  "como funciona previsão":
    "A 'Previsão' calcula o seu saldo futuro baseado nas receitas e despesas recorrentes. Mostra uma projeção para os próximos 6 meses.",
  ajuda:
    "Posso ajudar com: adicionar transações, criar categorias, definir orçamentos, criar metas financeiras, transferir dinheiro para metas, ver histórico, exportar dados, e muito mais. O que gostaria de saber?",
}

export function Chatbot({ onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o assistente do CashBoard. Posso ajudá-lo a compreender as funcionalidades da aplicação. O que gostaria de saber?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { getSummary, transactions, accounts, goals } = useFinance()
  const { formatCurrency } = useCurrency()
  const summary = getSummary()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const findBestResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    // Check for financial data queries
    if (lowerQuery.includes("saldo") || lowerQuery.includes("tenho")) {
      return `O seu património líquido atual é de ${formatCurrency(summary.totalNetWorth)}. Tem ${formatCurrency(summary.totalIncome)} em receitas e ${formatCurrency(summary.totalExpenses)} em despesas este mês.`
    }

    if (lowerQuery.includes("transaç") && lowerQuery.includes("quant")) {
      return `Tem ${transactions.length} transações registadas no total.`
    }

    if (lowerQuery.includes("conta") && (lowerQuery.includes("quant") || lowerQuery.includes("tenho"))) {
      return `Tem ${accounts.length} conta(s) registada(s). ${accounts.map((a) => `${a.name}: ${formatCurrency(a.balance)}`).join(", ")}.`
    }

    if (lowerQuery.includes("meta") && (lowerQuery.includes("quant") || lowerQuery.includes("tenho"))) {
      if (goals.length === 0) {
        return "Ainda não tem metas financeiras definidas. Pode criar uma na secção 'Metas Financeiras' do dashboard."
      }
      return `Tem ${goals.length} meta(s) financeira(s): ${goals.map((g) => `${g.name} (${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)})`).join(", ")}.`
    }

    // Check predefined responses
    for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
      if (lowerQuery.includes(key) || key.split(" ").every((word) => lowerQuery.includes(word))) {
        return response
      }
    }

    // Default response
    return "Não tenho a certeza de como responder a isso. Pode perguntar sobre: como adicionar transações, criar categorias, definir orçamentos, criar metas, transferir dinheiro, ver histórico, ou exportar dados. Digite 'ajuda' para ver todas as opções."
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate thinking delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

    const response = findBestResponse(input.trim())

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const quickQuestions = ["Como adicionar transação?", "Como criar uma meta?", "Qual o meu saldo?", "Ajuda"]

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Assistente CashBoard</h3>
            <p className="text-xs text-muted-foreground">Sempre disponível para ajudar</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-[10px] opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <BotIcon className="h-4 w-4 text-white" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Questions */}
      <div className="px-4 py-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2">Perguntas rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => setInput(question)}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva a sua pergunta..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
