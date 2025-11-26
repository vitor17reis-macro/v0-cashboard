"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, XIcon, BotIcon, UserIcon, Sparkles } from "lucide-react"
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

const PREDEFINED_RESPONSES: Record<string, string> = {
  "como adicionar transação":
    "Para adicionar uma transação, clique no botão verde '+ Nova Transação' na sidebar à esquerda. Pode escolher entre receita, despesa, investimento ou poupança.",
  "como criar categoria":
    "Clique no ícone de etiqueta na sidebar. Abrirá um painel elegante onde pode adicionar novas categorias com cores personalizadas.",
  "como definir orçamento":
    "Clique no ícone de engrenagem na sidebar para aceder aos orçamentos. Verá cards interativos com barras de progresso para cada categoria.",
  "como criar meta":
    "Na secção 'Metas Financeiras' do dashboard, clique no botão '+'. Defina nome, valor alvo, prazo e cor da meta.",
  "como transferir para meta":
    "Em cada meta, clique no botão verde 'Depositar' para transferir dinheiro de uma conta para a meta.",
  "como criar conta":
    "Na secção 'As Minhas Contas', clique no '+' para criar nova conta. Todas as contas (à ordem, poupança, investimentos) funcionam da mesma forma.",
  "como transferir entre contas":
    "Na secção 'As Minhas Contas', clique no botão 'Transferir' para mover dinheiro entre qualquer tipo de conta.",
  "como ver histórico":
    "Clique em 'Histórico' na sidebar para ver todas as transações. Pode arrastar transações para as reclassificar.",
  "como exportar dados": "Clique no ícone de download na sidebar para exportar todas as suas transações em CSV.",
  "como reverter transação":
    "No 'Histórico', encontre a transação e clique em 'Reverter'. O dinheiro será devolvido às contas/metas originais.",
  "o que são automações":
    "As 'Automações' permitem criar regras como 'transferir 10% do salário para poupança' ou 'categorizar Netflix automaticamente'.",
  "como comparar meses": "Clique em 'Comparação' na sidebar para ver gráficos lado-a-lado de dois meses diferentes.",
  "o que são insights":
    "Os 'Insights' na visão geral analisam os seus dados e dão sugestões personalizadas sobre gastos e poupanças.",
  ajuda:
    "Posso ajudar com: transações, categorias, orçamentos, metas, transferências entre contas, histórico, automações, comparação de meses, e muito mais. O que gostaria de saber?",
}

export function Chatbot({ onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o assistente do CashBoard VitoReis. Posso ajudá-lo com transferências entre contas, metas financeiras, automações, e todas as funcionalidades da aplicação. O que precisa?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { getSummary, transactions = [], accounts = [], goals = [] } = useFinance()
  const { formatCurrency } = useCurrency()
  const summary = getSummary()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const findBestResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    // Financial data queries
    if (lowerQuery.includes("saldo") || lowerQuery.includes("tenho")) {
      return `O seu património líquido é de ${formatCurrency(summary.totalNetWorth)}. Receitas: ${formatCurrency(summary.totalIncome)}, Despesas: ${formatCurrency(summary.totalExpenses)} este mês.`
    }

    if (lowerQuery.includes("transaç") && lowerQuery.includes("quant")) {
      return `Tem ${transactions.length} transações registadas.`
    }

    if (lowerQuery.includes("conta") && (lowerQuery.includes("quant") || lowerQuery.includes("tenho"))) {
      if (accounts.length === 0) return "Ainda não tem contas. Crie uma em 'As Minhas Contas'."
      return `Tem ${accounts.length} conta(s): ${accounts.map((a) => `${a.name}: ${formatCurrency(a.balance)}`).join(", ")}.`
    }

    if (lowerQuery.includes("meta") && (lowerQuery.includes("quant") || lowerQuery.includes("tenho"))) {
      if (goals.length === 0) return "Ainda não tem metas. Crie uma em 'Metas Financeiras'."
      return `Tem ${goals.length} meta(s): ${goals.map((g) => `${g.name} (${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)})`).join(", ")}.`
    }

    // Check predefined responses
    for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
      if (lowerQuery.includes(key) || key.split(" ").every((word) => lowerQuery.includes(word))) {
        return response
      }
    }

    return "Não tenho a certeza. Pode perguntar sobre: transferências entre contas, metas, automações, orçamentos, comparação de meses, ou exportar dados. Digite 'ajuda' para ver todas as opções."
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

    await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 400))

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

  const quickQuestions = ["Como transferir entre contas?", "Como criar automação?", "Qual o meu saldo?", "Ajuda"]

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg">Assistente CashBoard</h3>
            <p className="text-xs text-muted-foreground">Sempre pronto a ajudar</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "assistant" && (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                  <BotIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className="text-[10px] opacity-50 mt-1.5">
                  {message.timestamp.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {message.role === "user" && (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shrink-0 shadow-md">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <BotIcon className="h-4 w-4 text-white" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-4">
                <div className="flex gap-1.5">
                  <span
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Questions */}
      <div className="px-4 py-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Perguntas rápidas</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => setInput(question)}
              className="text-xs px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all duration-300 hover:scale-105"
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
            className="flex-1 h-11 rounded-xl"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={!input.trim() || isLoading}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
