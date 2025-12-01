"use client"

import type React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, XIcon, Sparkles, UserIcon, Wallet, Target, ArrowRightLeft, HelpCircle } from "lucide-react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  suggestions?: string[]
}

interface ChatbotProps {
  onClose?: () => void
}

export function Chatbot({ onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const financeContext = useFinance()
  const { formatCurrency } = useCurrency()

  const transactions = financeContext?.transactions || []
  const accounts = financeContext?.accounts || []
  const goals = financeContext?.goals || []
  const categories = financeContext?.categories || []
  const getSummary = financeContext?.getSummary

  // Calculate financial metrics
  const metrics = useMemo(() => {
    const summary = getSummary
      ? getSummary()
      : { totalIncome: 0, totalExpense: 0, balance: 0, totalNetWorth: 0, savingsRate: 0 }
    const totalSavings = accounts.filter((a) => a.type === "savings").reduce((sum, a) => sum + a.balance, 0)
    const totalInvestments = accounts.filter((a) => a.type === "investment").reduce((sum, a) => sum + a.balance, 0)
    const totalChecking = accounts.filter((a) => a.type === "checking").reduce((sum, a) => sum + a.balance, 0)
    const totalCash = accounts.filter((a) => a.type === "cash").reduce((sum, a) => sum + a.balance, 0)

    // Category spending
    const categorySpending: Record<string, number> = {}
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const catName = categories.find((c) => c.id === t.category)?.name || t.category
        categorySpending[catName] = (categorySpending[catName] || 0) + t.amount
      })

    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0]

    // Goals progress
    const goalsProgress = goals.map((g) => ({
      name: g.name,
      progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
      remaining: g.targetAmount - g.currentAmount,
    }))

    return {
      ...summary,
      totalSavings,
      totalInvestments,
      totalChecking,
      totalCash,
      topCategory,
      goalsProgress,
      transactionCount: transactions.length,
      accountCount: accounts.length,
      goalCount: goals.length,
    }
  }, [transactions, accounts, goals, categories, getSummary])

  // Initialize with welcome message
  useEffect(() => {
    const greeting = getTimeGreeting()
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `${greeting}! Sou o assistente inteligente do CashBoard. Posso ajudar-te a analisar as tuas finanças, responder a perguntas sobre o teu património, e guiar-te nas funcionalidades da aplicação. O que gostarias de saber?`,
        timestamp: new Date().toISOString(),
        suggestions: ["Qual é o meu saldo?", "Resumo das minhas contas", "Como poupar mais?", "Ajuda"],
      },
    ])
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  function getTimeGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 19) return "Boa tarde"
    return "Boa noite"
  }

  function processQuery(query: string): { response: string; suggestions?: string[] } {
    const q = query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    // Saldo e património
    if (q.includes("saldo") || q.includes("patrimonio") || q.includes("quanto tenho") || q.includes("dinheiro")) {
      const totalPatrimony = metrics.totalChecking + metrics.totalCash + metrics.totalSavings + metrics.totalInvestments
      return {
        response: `O teu património total é de **${formatCurrency(totalPatrimony)}**.\n\nDistribuição:\n- Conta à Ordem: ${formatCurrency(metrics.totalChecking)}\n- Dinheiro: ${formatCurrency(metrics.totalCash)}\n- Poupança: ${formatCurrency(metrics.totalSavings)}\n- Investimentos: ${formatCurrency(metrics.totalInvestments)}\n\nEste mês: Receitas ${formatCurrency(metrics.totalIncome)} | Despesas ${formatCurrency(metrics.totalExpense)}`,
        suggestions: ["Ver metas", "Transferir dinheiro", "Histórico"],
      }
    }

    // Contas
    if (
      q.includes("conta") &&
      (q.includes("quais") || q.includes("minhas") || q.includes("listar") || q.includes("resumo"))
    ) {
      if (accounts.length === 0) {
        return {
          response:
            "Ainda não tens contas registadas. Vai à secção 'Visão Geral' e clica no '+' para criar a tua primeira conta.",
          suggestions: ["Como criar conta?", "Ajuda"],
        }
      }
      const accountList = accounts
        .map(
          (a) =>
            `- **${a.name}** (${a.type === "checking" ? "À Ordem" : a.type === "savings" ? "Poupança" : a.type === "investment" ? "Investimento" : "Dinheiro"}): ${formatCurrency(a.balance)}`,
        )
        .join("\n")
      return {
        response: `Tens **${accounts.length} conta(s)** registadas:\n\n${accountList}`,
        suggestions: ["Transferir entre contas", "Criar nova conta"],
      }
    }

    // Metas
    if (q.includes("meta") || q.includes("objetivo") || q.includes("goal")) {
      if (goals.length === 0) {
        return {
          response:
            "Ainda não definiste metas financeiras. As metas ajudam-te a poupar para objetivos específicos como férias, um carro, ou um fundo de emergência.",
          suggestions: ["Como criar meta?", "Dicas de poupança"],
        }
      }
      const goalsList = metrics.goalsProgress
        .map((g) => `- **${g.name}**: ${g.progress.toFixed(0)}% concluído (faltam ${formatCurrency(g.remaining)})`)
        .join("\n")
      return {
        response: `Tens **${goals.length} meta(s)** definidas:\n\n${goalsList}\n\nPodes depositar dinheiro diretamente nas metas através do botão 'Depositar'.`,
        suggestions: ["Depositar numa meta", "Criar nova meta"],
      }
    }

    // Transferências
    if (q.includes("transferir") || q.includes("transferencia") || q.includes("mover dinheiro")) {
      return {
        response: `Para transferir dinheiro entre contas:\n\n1. Vai à secção **'Visão Geral'**\n2. Na área **'As Minhas Contas'**, clica no botão **'Transferir'**\n3. Escolhe a conta de origem e destino\n4. Define o valor e confirma\n\nPara depositar numa meta, clica no botão **'Depositar'** junto à meta desejada.`,
        suggestions: ["Ver contas", "Ver metas", "Voltar"],
      }
    }

    // Automações
    if (q.includes("automacao") || q.includes("automatizar") || q.includes("regra")) {
      return {
        response: `As **Automações** permitem criar regras como:\n\n- "Quando receber salário, transferir 10% para poupança"\n- "Categorizar despesas Netflix automaticamente"\n\nPara criar:\n1. Vai a **'Automações'** no menu lateral\n2. Clica em **'Nova Regra'**\n3. Define o gatilho (quando) e a ação (o quê)\n4. Usa o botão ▶️ para executar manualmente`,
        suggestions: ["Criar automação", "Ver automações", "Voltar"],
      }
    }

    // Comparação mensal
    if (q.includes("comparacao") || q.includes("comparar") || q.includes("mes anterior") || q.includes("evolucao")) {
      return {
        response: `A secção **'Comparação'** permite analisar a evolução das tuas finanças mês a mês.\n\nMostra:\n- Variação de receitas e despesas\n- Totais em Poupança e Investimento\n- Gráficos comparativos\n- Análise por categoria\n\nAcede pelo menu lateral clicando em **'Comparação'**.`,
        suggestions: ["Ver comparação", "Ver relatórios", "Voltar"],
      }
    }

    // Despesas e gastos
    if (q.includes("despesa") || q.includes("gasto") || q.includes("gastei") || q.includes("categoria")) {
      if (metrics.topCategory) {
        return {
          response: `Este período gastaste **${formatCurrency(metrics.totalExpense)}** no total.\n\nA tua maior categoria de despesa é **${metrics.topCategory[0]}** com ${formatCurrency(metrics.topCategory[1])}.\n\nDica: Define orçamentos para cada categoria em **'Orçamentos'** para controlar melhor os gastos.`,
          suggestions: ["Ver categorias", "Definir orçamento", "Voltar"],
        }
      }
      return {
        response: `Este período tens ${formatCurrency(metrics.totalExpense)} em despesas registadas.`,
        suggestions: ["Adicionar despesa", "Ver histórico"],
      }
    }

    // Poupança
    if (q.includes("poupar") || q.includes("poupanca") || q.includes("economizar") || q.includes("dicas")) {
      const savingsRate =
        metrics.totalIncome > 0 ? ((metrics.totalIncome - metrics.totalExpense) / metrics.totalIncome) * 100 : 0
      return {
        response: `**Dicas para poupar mais:**\n\n1. **Regra 50/30/20**: 50% necessidades, 30% desejos, 20% poupança\n2. **Automações**: Cria uma regra para transferir automaticamente parte do salário\n3. **Metas visuais**: Define metas com prazos para te motivar\n4. **Revê subscrições**: Verifica serviços que não usas\n\nA tua taxa de poupança atual: **${savingsRate.toFixed(1)}%**\n\nTotal em poupança: ${formatCurrency(metrics.totalSavings)}`,
        suggestions: ["Criar meta", "Criar automação", "Ver subscrições"],
      }
    }

    // Investimentos
    if (q.includes("investimento") || q.includes("investir") || q.includes("investido")) {
      return {
        response: `Tens **${formatCurrency(metrics.totalInvestments)}** em contas de investimento.\n\nNo CashBoard podes:\n- Registar diferentes contas de investimento\n- Acompanhar a evolução do património\n- Transferir dinheiro para investir\n\nDica: Cria uma automação para investir automaticamente uma percentagem das tuas receitas.`,
        suggestions: ["Transferir para investir", "Criar automação", "Voltar"],
      }
    }

    // Adicionar transação
    if (q.includes("adicionar") || q.includes("registar") || q.includes("nova transacao")) {
      return {
        response: `Para adicionar uma transação:\n\n1. Clica no botão **'+ Nova Transação'** na sidebar\n2. Escolhe o tipo: Receita, Despesa, Investimento ou Poupança\n3. Preenche valor, descrição e categoria\n4. Seleciona a conta e data\n5. Clica em **'Adicionar'**`,
        suggestions: ["Tipos de transação", "Ver histórico", "Voltar"],
      }
    }

    // Exportar
    if (q.includes("exportar") || q.includes("download") || q.includes("csv")) {
      return {
        response: `Para exportar os teus dados:\n\n1. Na sidebar, clica no ícone de **download** (⬇️)\n2. Os dados serão exportados em formato CSV\n3. Podes abrir no Excel ou Google Sheets\n\nO ficheiro inclui todas as transações com data, valor, categoria e descrição.`,
        suggestions: ["Ver histórico", "Voltar"],
      }
    }

    // Histórico
    if (q.includes("historico") || q.includes("transacoes") || q.includes("reverter")) {
      return {
        response: `A secção **'Histórico'** mostra todas as tuas transações.\n\nFuncionalidades:\n- **Pesquisa**: Filtra por descrição\n- **Filtro por tipo**: Receitas, Despesas, etc.\n- **Reverter**: Anula transações (o dinheiro volta à origem)\n- **Drag & Drop**: Arrasta para reclassificar\n\nAcede pelo menu lateral.`,
        suggestions: ["Ver histórico", "Voltar"],
      }
    }

    // Ajuda geral
    if (q.includes("ajuda") || q.includes("help") || q.includes("o que podes fazer") || q.includes("funcionalidades")) {
      return {
        response: `Posso ajudar-te com:\n\n📊 **Consultas**\n- Saldo e património\n- Contas e metas\n- Despesas por categoria\n\n🔧 **Funcionalidades**\n- Como transferir dinheiro\n- Como criar automações\n- Como exportar dados\n\n💡 **Dicas**\n- Estratégias de poupança\n- Gestão de orçamento\n\nPergunta-me o que quiseres!`,
        suggestions: ["Qual é o meu saldo?", "Como transferir?", "Dicas de poupança"],
      }
    }

    // Saudações
    if (
      q.includes("ola") ||
      q.includes("oi") ||
      q.includes("bom dia") ||
      q.includes("boa tarde") ||
      q.includes("boa noite")
    ) {
      return {
        response: `${getTimeGreeting()}! Em que posso ajudar-te hoje?`,
        suggestions: ["Qual é o meu saldo?", "Ver metas", "Ajuda"],
      }
    }

    // Obrigado
    if (q.includes("obrigado") || q.includes("obrigada") || q.includes("thanks")) {
      return {
        response: "De nada! Estou sempre aqui para ajudar. Tens mais alguma questão?",
        suggestions: ["Ajuda", "Ver saldo", "Voltar"],
      }
    }

    // Fallback
    return {
      response: `Não consegui entender completamente a tua pergunta. Posso ajudar com:\n\n- Consultar saldo e contas\n- Explicar funcionalidades\n- Dicas de poupança\n- Transferências e metas\n\nTenta reformular ou escolhe uma das sugestões abaixo.`,
      suggestions: ["Qual é o meu saldo?", "Como funciona?", "Ajuda"],
    }
  }

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: Message = {
      id: `${Date.now()}_u`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    // Simulate thinking delay
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600))

    const { response, suggestions } = processQuery(trimmed)

    const assistantMsg: Message = {
      id: `${Date.now()}_a`,
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
      suggestions,
    }
    setMessages((prev) => [...prev, assistantMsg])
    setIsTyping(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSend(input)
  }

  const quickActions = [
    { icon: <Wallet className="h-4 w-4" />, label: "Saldo", query: "Qual é o meu saldo?" },
    { icon: <Target className="h-4 w-4" />, label: "Metas", query: "Ver minhas metas" },
    { icon: <ArrowRightLeft className="h-4 w-4" />, label: "Transferir", query: "Como transferir dinheiro?" },
    { icon: <HelpCircle className="h-4 w-4" />, label: "Ajuda", query: "Ajuda" },
  ]

  return (
    <div className="flex flex-col h-full bg-background" role="dialog" aria-label="Assistente do CashBoard">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Assistente CashBoard</h3>
            <p className="text-xs text-muted-foreground">Sempre disponível para ajudar</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Fechar assistente"
          className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="shrink-0 gap-2 rounded-full text-xs h-8 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              onClick={() => handleSend(action.query)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef as any}>
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary/80 text-secondary-foreground rounded-bl-sm border border-border/50"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split("\n").map((line, i) => (
                        <p key={i} className="mb-1 last:mb-0">
                          {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
                        </p>
                      ))}
                    </div>
                  </div>
                  {message.suggestions && message.role === "assistant" && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {message.suggestions.map((s) => (
                        <button
                          key={s}
                          className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                          onClick={() => handleSend(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="bg-secondary/80 rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50">
                  <div className="flex gap-1.5">
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
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreve a tua pergunta..."
            disabled={isTyping}
            className="rounded-xl bg-background border-border/50 focus-visible:ring-primary/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Assistente local - os teus dados nunca saem do dispositivo
        </p>
      </div>
    </div>
  )
}

export default Chatbot
