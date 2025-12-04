"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  SendIcon,
  XIcon,
  Sparkles,
  UserIcon,
  Wallet,
  TrendingUp,
  GraduationCap,
  Calculator,
  HelpCircle,
  Database,
  Bot,
  Loader2,
} from "lucide-react"
import { useCurrency } from "@/components/providers/currency-provider"
import { cn } from "@/lib/utils"
import { useFinance } from "@/components/providers/finance-provider"

interface FinanceContextData {
  userId: string | null
  accounts: any[]
  transactions: any[]
  goals: any[]
  categories: any[]
  rules: any[]
}

interface MultiAgentChatbotProps {
  onClose?: () => void
}

const AGENT_INFO = {
  sql: {
    name: "SQL Agent",
    icon: Database,
    color: "text-blue-500",
    description: "Consultas à base de dados",
  },
  finance: {
    name: "Finance Agent",
    icon: TrendingUp,
    color: "text-green-500",
    description: "Análise de investimentos",
  },
  education: {
    name: "Education Agent",
    icon: GraduationCap,
    color: "text-purple-500",
    description: "Literacia financeira",
  },
  planner: {
    name: "Planner Agent",
    icon: Calculator,
    color: "text-orange-500",
    description: "Planos financeiros",
  },
  support: {
    name: "Support Agent",
    icon: HelpCircle,
    color: "text-cyan-500",
    description: "Ajuda com o CashBoard",
  },
  rag: {
    name: "RAG Agent",
    icon: Bot,
    color: "text-pink-500",
    description: "Pesquisa de informação",
  },
  orchestrator: {
    name: "Orchestrator",
    icon: Sparkles,
    color: "text-amber-500",
    description: "Coordenação de agentes",
  },
}

// Safe finance context hook that doesn't throw
function useSafeFinance(): FinanceContextData {
  const financeContext = useFinance()
  return {
    userId: financeContext?.userId || null,
    accounts: financeContext?.accounts || [],
    transactions: financeContext?.transactions || [],
    goals: financeContext?.goals || [],
    categories: financeContext?.categories || [],
    rules: financeContext?.rules || [],
  }
}

export function MultiAgentChatbot({ onClose }: MultiAgentChatbotProps) {
  const [inputValue, setInputValue] = useState("")
  const [activeAgent, setActiveAgent] = useState<string>("support")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const financeData = useSafeFinance()

  let currency = "EUR"
  const currencyContext = useCurrency()
  currency = currencyContext?.currency || "EUR"

  useEffect(() => {
    setMounted(true)
  }, [])

  // Build context for agents
  const agentContext = useMemo(
    () => ({
      userId: financeData.userId || "",
      accounts: financeData.accounts,
      transactions: financeData.transactions,
      goals: financeData.goals,
      categories: financeData.categories,
      rules: financeData.rules,
      currency,
    }),
    [financeData, currency],
  )

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agents",
      body: {
        userId: agentContext.userId,
        context: agentContext,
      },
    }),
    onResponse: (response) => {
      const agentType = response.headers.get("X-Agent-Type")
      if (agentType) {
        setActiveAgent(agentType)
      }
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    sendMessage({ text: inputValue })
    setInputValue("")
  }

  const handleQuickAction = (query: string) => {
    if (isLoading) return
    sendMessage({ text: query })
  }

  const quickActions = [
    {
      icon: <Wallet className="h-4 w-4" />,
      label: "Saldo",
      query: "Qual é o meu saldo total e distribuição por contas?",
    },
    { icon: <Database className="h-4 w-4" />, label: "Gastos", query: "Quanto gastei este mês por categoria?" },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Investir",
      query: "Dá-me conselhos de investimento para o meu perfil",
    },
    { icon: <GraduationCap className="h-4 w-4" />, label: "Aprender", query: "Explica-me o que são juros compostos" },
    {
      icon: <Calculator className="h-4 w-4" />,
      label: "Planear",
      query: "Quero poupar 5000€ em 12 meses, cria um plano",
    },
    { icon: <HelpCircle className="h-4 w-4" />, label: "Ajuda", query: "O que posso fazer no CashBoard?" },
  ]

  const AgentBadge = ({ agentType }: { agentType: string }) => {
    const agent = AGENT_INFO[agentType as keyof typeof AGENT_INFO] || AGENT_INFO.support
    const Icon = agent.icon

    return (
      <Badge variant="outline" className={cn("text-xs gap-1", agent.color)}>
        <Icon className="h-3 w-3" />
        {agent.name}
      </Badge>
    )
  }

  const renderMessageContent = (content: string) => {
    if (!content) return null
    const lines = content.split("\n")

    return lines.map((line, i) => {
      if (line.startsWith("###")) {
        return (
          <h4 key={i} className="font-semibold text-sm mt-2 mb-1">
            {line.replace(/^###\s*/, "")}
          </h4>
        )
      }
      if (line.startsWith("##")) {
        return (
          <h3 key={i} className="font-semibold text-base mt-2 mb-1">
            {line.replace(/^##\s*/, "")}
          </h3>
        )
      }
      if (line.startsWith("#")) {
        return (
          <h2 key={i} className="font-bold text-lg mt-2 mb-1">
            {line.replace(/^#\s*/, "")}
          </h2>
        )
      }
      if (line.match(/^[-*]\s/)) {
        return (
          <li key={i} className="ml-4 text-sm">
            {formatTextWithBold(line.replace(/^[-*]\s/, ""))}
          </li>
        )
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={i} className="ml-4 text-sm list-decimal">
            {formatTextWithBold(line.replace(/^\d+\.\s/, ""))}
          </li>
        )
      }
      if (!line.trim()) {
        return <br key={i} />
      }
      return (
        <p key={i} className="text-sm mb-1">
          {formatTextWithBold(line)}
        </p>
      )
    })
  }

  const formatTextWithBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background" role="dialog" aria-label="Assistente Multi-Agente do CashBoard">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Assistente IA
              {activeAgent && <AgentBadge agentType={activeAgent} />}
            </h3>
            <p className="text-xs text-muted-foreground">Sistema multi-agente inteligente</p>
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

      {/* Agent Selector */}
      <div className="p-2 border-b bg-muted/30">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Object.entries(AGENT_INFO)
            .filter(([key]) => key !== "orchestrator")
            .map(([key, agent]) => {
              const Icon = agent.icon
              const isActive = activeAgent === key
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "shrink-0 gap-1 rounded-full text-xs h-7",
                    isActive && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => setActiveAgent(key)}
                  title={agent.description}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{agent.name.replace(" Agent", "")}</span>
                </Button>
              )
            })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b bg-muted/20">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 rounded-full text-xs h-7 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              onClick={() => handleQuickAction(action.query)}
              disabled={isLoading}
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
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="max-w-[85%] space-y-2">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-secondary/80 text-secondary-foreground border border-border/50">
                    <p className="text-sm mb-2">
                      Olá! Sou o assistente inteligente do CashBoard com múltiplos agentes especializados:
                    </p>
                    <ul className="text-sm space-y-1 mb-2">
                      <li>
                        <strong>SQL Agent</strong> - Consultas sobre os teus dados
                      </li>
                      <li>
                        <strong>Finance Agent</strong> - Análise e conselhos de investimento
                      </li>
                      <li>
                        <strong>Education Agent</strong> - Aprende sobre finanças
                      </li>
                      <li>
                        <strong>Planner Agent</strong> - Cria planos personalizados
                      </li>
                      <li>
                        <strong>Support Agent</strong> - Ajuda com o CashBoard
                      </li>
                    </ul>
                    <p className="text-sm">Pergunta-me o que quiseres!</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={cn("max-w-[85%] space-y-2", message.role === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary/80 text-secondary-foreground rounded-bl-sm border border-border/50",
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.parts?.map((part, index) => {
                        if (part.type === "text") {
                          return <div key={index}>{renderMessageContent(part.text)}</div>
                        }
                        if (part.type === "tool-invocation") {
                          return (
                            <div key={index} className="my-2 p-2 bg-muted/50 rounded-lg text-xs">
                              <span className="text-muted-foreground">A usar ferramenta: </span>
                              <code>{part.toolName}</code>
                            </div>
                          )
                        }
                        return null
                      }) || (typeof message.content === "string" ? renderMessageContent(message.content) : null)}
                    </div>
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <div className="bg-secondary/80 rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>A processar</span>
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-destructive flex items-center justify-center shrink-0">
                  <XIcon className="h-4 w-4 text-destructive-foreground" />
                </div>
                <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 border border-destructive/30">
                  <p className="text-sm">Ocorreu um erro. Por favor tenta novamente.</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escreve a tua pergunta..."
            disabled={isLoading}
            className="flex-1 rounded-full bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">Powered by Claude + Multi-Agent System</p>
      </div>
    </div>
  )
}
