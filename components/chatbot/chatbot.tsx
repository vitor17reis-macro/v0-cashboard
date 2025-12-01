"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
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
  timestamp: string
}

interface ChatbotProps {
  onClose?: () => void
}

// NLU Helpers
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

function levenshtein(a: string, b: string) {
  const al = a.length
  const bl = b.length
  if (al === 0) return bl
  if (bl === 0) return al
  const matrix: number[][] = []
  for (let i = 0; i <= bl; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= al; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= bl; i++) {
    for (let j = 1; j <= al; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }
  return matrix[bl][al]
}

function similarityScore(a: string, b: string) {
  if (!a || !b) return 0
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  const dist = levenshtein(na, nb)
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  return 1 - dist / maxLen
}

type IntentId =
  | "BALANCE"
  | "TRANSACTIONS_COUNT"
  | "ACCOUNTS_OVERVIEW"
  | "GOALS_OVERVIEW"
  | "HOW_TO_ADD_TRANSACTION"
  | "HOW_TO_CREATE_CATEGORY"
  | "HOW_TO_TRANSFER"
  | "HOW_TO_CREATE_GOAL"
  | "HOW_TO_AUTOMATION"
  | "EXPORT_DATA"
  | "FALLBACK"
  | "HELP"

interface IntentPattern {
  id: IntentId
  patterns: string[]
  threshold?: number
  priority?: number
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    id: "BALANCE",
    patterns: ["qual o meu saldo", "saldo", "patrimonio", "quanto tenho", "tenho quanto"],
    threshold: 0.55,
    priority: 10,
  },
  {
    id: "TRANSACTIONS_COUNT",
    patterns: ["quantas transacoes", "numero de transacoes", "quantas registadas"],
    threshold: 0.5,
    priority: 8,
  },
  {
    id: "ACCOUNTS_OVERVIEW",
    patterns: ["contas", "que contas tenho", "minhas contas", "quantas contas"],
    threshold: 0.5,
    priority: 6,
  },
  {
    id: "GOALS_OVERVIEW",
    patterns: ["meta", "metas", "objetivos", "metas financeiras"],
    threshold: 0.5,
    priority: 6,
  },
  {
    id: "HOW_TO_ADD_TRANSACTION",
    patterns: ["adicionar transacao", "como adicionar transacao", "nova transacao", "registar transacao"],
    threshold: 0.5,
    priority: 5,
  },
  {
    id: "HOW_TO_CREATE_CATEGORY",
    patterns: ["criar categoria", "nova categoria", "como criar categoria"],
    threshold: 0.5,
    priority: 5,
  },
  {
    id: "HOW_TO_TRANSFER",
    patterns: ["transferir", "transferencia", "como transferir", "mover dinheiro", "transferir entre contas"],
    threshold: 0.5,
    priority: 5,
  },
  {
    id: "HOW_TO_CREATE_GOAL",
    patterns: ["criar meta", "nova meta", "como criar meta", "objetivo financeiro"],
    threshold: 0.5,
    priority: 5,
  },
  {
    id: "HOW_TO_AUTOMATION",
    patterns: ["automacao", "regra automatica", "como automatizar", "automatizar"],
    threshold: 0.5,
    priority: 5,
  },
  {
    id: "EXPORT_DATA",
    patterns: ["exportar", "exportar dados", "csv", "download dados"],
    threshold: 0.5,
    priority: 4,
  },
  {
    id: "HELP",
    patterns: ["ajuda", "help", "o que podes fazer", "comandos"],
    threshold: 0.4,
    priority: 1,
  },
]

function detectIntent(userQuery: string): { intent: IntentId; score: number } {
  const q = normalize(userQuery)
  const candidates: { id: IntentId; score: number; priority: number }[] = []

  for (const p of INTENT_PATTERNS) {
    let best = 0
    for (const pat of p.patterns) {
      const sc = similarityScore(q, pat)
      if (sc > best) best = sc
    }
    const threshold = p.threshold ?? 0.45
    if (best >= threshold) {
      candidates.push({ id: p.id, score: best, priority: p.priority ?? 0 })
    }
  }

  if (candidates.length === 0) {
    return { intent: "FALLBACK", score: 0 }
  }

  candidates.sort((a, b) => b.priority - a.priority || b.score - a.score)
  return { intent: candidates[0].id, score: candidates[0].score }
}

export function Chatbot({ onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o assistente do CashBoard. Posso ajudar com saldo, transações, contas, metas e operações do site. Pergunte-me algo!",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const liveRegionRef = useRef<HTMLDivElement | null>(null)
  const { getSummary, transactions = [], accounts = [], goals = [] } = useFinance()
  const { formatCurrency } = useCurrency()
  const summary = getSummary()

  const quickReplies = ["Como adicionar transação?", "Como transferir?", "Qual o meu saldo?", "Ajuda"]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const getResponse = (intent: IntentId): string => {
    switch (intent) {
      case "BALANCE":
        return `O seu património líquido atual é ${formatCurrency(summary.totalNetWorth)}. Receitas este mês: ${formatCurrency(summary.totalIncome)}; Despesas este mês: ${formatCurrency(summary.totalExpenses)}.`
      case "TRANSACTIONS_COUNT":
        return `Tem ${transactions.length} transações registadas.`
      case "ACCOUNTS_OVERVIEW":
        if (accounts.length === 0) return "Ainda não tem contas registadas. Pode criar uma em 'As Minhas Contas'."
        return `Tem ${accounts.length} conta(s): ${accounts.map((a) => `${a.name}: ${formatCurrency(a.balance)}`).join("; ")}.`
      case "GOALS_OVERVIEW":
        if (goals.length === 0) return "Ainda não tem metas. Crie uma em 'Metas Financeiras'."
        return `Tem ${goals.length} meta(s): ${goals.map((g) => `${g.name} (${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)})`).join("; ")}.`
      case "HOW_TO_ADD_TRANSACTION":
        return "Para adicionar uma transação, clique no botão '+ Nova Transação' na sidebar à esquerda. Escolha o tipo (Receita/Despesa/Investimento/Poupança) e preencha os campos."
      case "HOW_TO_CREATE_CATEGORY":
        return "Clique no ícone de etiqueta na sidebar para abrir o painel de categorias. Pode adicionar novas categorias com cores personalizadas."
      case "HOW_TO_TRANSFER":
        return "Na secção 'As Minhas Contas', clique no botão 'Transferir' para mover dinheiro entre contas (à ordem, poupança, investimentos). Para depositar numa meta, use o botão 'Depositar' na meta."
      case "HOW_TO_CREATE_GOAL":
        return "Na secção 'Metas Financeiras', clique no '+' para criar uma nova meta. Defina nome, valor alvo, prazo e cor."
      case "HOW_TO_AUTOMATION":
        return "Vá a 'Automações' na sidebar. Pode criar regras como 'Quando receber salário, transferir 10% para poupança' ou categorizar transações automaticamente."
      case "EXPORT_DATA":
        return "Para exportar os seus dados, clique no ícone de download na sidebar. Os dados serão exportados em formato CSV."
      case "HELP":
        return "Posso ajudar com: consultar saldo, contas e metas, adicionar transações, transferir dinheiro, criar categorias, exportar dados, e criar automações. Pergunte algo como 'Qual o meu saldo?'"
      case "FALLBACK":
      default:
        return "Desculpe, não consegui compreender. Posso ajudar com saldo, transações, contas, metas, transferências, automações, e mais. Digite 'ajuda' para ver as opções."
    }
  }

  async function handleSend(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return

    const userMsg: Message = {
      id: `${Date.now()}_u`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))

    const { intent, score } = detectIntent(trimmed)
    let reply = getResponse(intent)

    if (score > 0 && score < 0.6) {
      reply += " (Se isto não responder à sua pergunta, tente reformular.)"
    }

    const assistantMsg: Message = {
      id: `${Date.now()}_a`,
      role: "assistant",
      content: reply,
      timestamp: new Date().toISOString(),
    }
    setMessages((m) => [...m, assistantMsg])
    setIsLoading(false)

    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = reply
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSend(input)
  }

  return (
    <div className="flex flex-col h-full bg-background" role="dialog" aria-label="Assistente do CashBoard">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Assistente CashBoard</h3>
            <p className="text-xs text-muted-foreground">Ajuda rápida e consultas</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar assistente" className="rounded-xl">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollRef as any} className="h-full p-4">
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                aria-live={message.role === "assistant" ? "polite" : undefined}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                    <BotIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className="text-[10px] opacity-50 mt-1.5">
                    {new Date(message.timestamp).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                  <BotIcon className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
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
      </div>

      {/* Live region for screen readers */}
      <div aria-live="polite" className="sr-only" ref={liveRegionRef} />

      {/* Quick replies */}
      <div className="p-3 border-t">
        <div className="flex gap-2 mb-2 flex-wrap">
          {quickReplies.map((q) => (
            <button
              key={q}
              className="rounded-full px-3 py-1 text-xs bg-muted/40 hover:bg-muted transition-colors"
              onClick={() => handleSend(q)}
              aria-label={`Pergunta rápida: ${q}`}
            >
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            aria-label="Escreva a sua pergunta"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva a sua pergunta..."
            disabled={isLoading}
            className="rounded-xl"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            aria-label="Enviar pergunta"
            className="rounded-xl"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Chatbot
