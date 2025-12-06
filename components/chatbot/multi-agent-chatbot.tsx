"use client"
import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SendIcon,
  XIcon,
  Sparkles,
  UserIcon,
  TrendingUp,
  GraduationCap,
  Calculator,
  HelpCircle,
  Database,
  Loader2,
  ChevronDown,
  PiggyBank,
  BookOpen,
  Shield,
  Target,
} from "lucide-react"
import { useCurrency } from "@/components/providers/currency-provider"
import { cn } from "@/lib/utils"
import { useFinance } from "@/components/providers/finance-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

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

const AGENTS = [
  {
    id: "auto",
    name: "Automático",
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500",
    description: "Escolhe o melhor agente",
  },
  {
    id: "sql",
    name: "Dados",
    icon: Database,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-500",
    description: "Consulta transações e saldos",
  },
  {
    id: "finance",
    name: "Investir",
    icon: TrendingUp,
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-500",
    description: "Análise e conselhos",
  },
  {
    id: "education",
    name: "Aprender",
    icon: GraduationCap,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500",
    description: "Literacia financeira",
  },
  {
    id: "planner",
    name: "Planear",
    icon: Target,
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-500",
    description: "Planos financeiros",
  },
  {
    id: "support",
    name: "Ajuda",
    icon: HelpCircle,
    color: "from-slate-500 to-gray-600",
    bgColor: "bg-slate-500",
    description: "Suporte CashBoard",
  },
]

const QUICK_ACTIONS = [
  { label: "Resumo do mês", query: "Qual é o meu resumo financeiro deste mês?", icon: Calculator },
  { label: "Onde poupar", query: "Onde posso reduzir despesas?", icon: PiggyBank },
  { label: "Juros compostos", query: "Explica-me como funcionam os juros compostos", icon: BookOpen },
  { label: "Plano poupança", query: "Cria um plano para poupar 500€ por mês", icon: Target },
  { label: "Fundo emergência", query: "Como criar um fundo de emergência?", icon: Shield },
  { label: "Investir ETFs", query: "Devo investir em ETFs?", icon: TrendingUp },
]

export function MultiAgentChatbot({ onClose }: MultiAgentChatbotProps) {
  const [selectedAgent, setSelectedAgent] = useState("auto")
  const [activeAgent, setActiveAgent] = useState<string>("support")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const financeContext = useFinance()
  const currencyContext = useCurrency()
  const currency = currencyContext?.currency || "EUR"

  const financeData = useMemo(
    () => ({
      userId: financeContext?.userId || null,
      accounts: financeContext?.accounts || [],
      transactions: financeContext?.transactions || [],
      goals: financeContext?.goals || [],
      categories: financeContext?.categories || [],
      rules: financeContext?.rules || [],
    }),
    [financeContext],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat({
    api: "/api/agents",
    body: {
      context: agentContext,
      selectedAgent,
    },
    onResponse: (response) => {
      const agentType = response.headers.get("X-Agent-Type")
      if (agentType) {
        setActiveAgent(agentType)
      }
    },
    onError: (err) => {
      console.error("[v0] Chat error:", err)
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleQuickAction = (query: string) => {
    if (isLoading) return
    setInput(query)
    setTimeout(() => {
      const form = document.getElementById("chat-form") as HTMLFormElement
      if (form) form.requestSubmit()
    }, 50)
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

  const currentAgent = AGENTS.find((a) => a.id === selectedAgent) || AGENTS[0]
  const CurrentIcon = currentAgent.icon

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background" role="dialog" aria-label="Assistente Multi-Agente">
      <div className={cn("p-4 text-white bg-gradient-to-r", currentAgent.color)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Assistente IA</h3>
              <p className="text-xs text-white/80">Sistema Multi-Agente</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-xl">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl h-11"
            >
              <div className="flex items-center gap-2">
                <CurrentIcon className="w-4 h-4" />
                <span className="font-medium">{currentAgent.name}</span>
                <span className="text-xs text-white/70">- {currentAgent.description}</span>
              </div>
              <ChevronDown className="w-4 h-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[calc(100%-2rem)]"
            style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
          >
            <DropdownMenuLabel>Escolhe um Agente</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {AGENTS.map((agent) => {
              const Icon = agent.icon
              return (
                <DropdownMenuItem
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer",
                    selectedAgent === agent.id && "bg-accent",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                      agent.color,
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.description}</p>
                  </div>
                  {selectedAgent === agent.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef as any}>
          <div className="flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-3",
                      currentAgent.color,
                    )}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg">Olá! Como posso ajudar?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolhe uma ação rápida ou escreve a tua pergunta
                  </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, i) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action.query)}
                        disabled={isLoading}
                        className={cn(
                          "p-3 rounded-xl text-left transition-all",
                          "bg-accent/50 hover:bg-accent",
                          "border border-transparent hover:border-border",
                          "disabled:opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-xs font-medium">{action.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Agent List */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Agentes Disponíveis:</p>
                  <div className="space-y-1">
                    {AGENTS.filter((a) => a.id !== "auto").map((agent) => {
                      const Icon = agent.icon
                      return (
                        <div
                          key={agent.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedAgent(agent.id)}
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                              agent.color,
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-sm font-medium flex-1">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Existing messages rendering */}
            {messages.map((message) => {
              const agentInfo = AGENTS.find((a) => a.id === activeAgent) || AGENTS[0]
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "assistant" && (
                    <div
                      className={cn(
                        "h-8 w-8 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                        agentInfo.color,
                      )}
                    >
                      <agentInfo.icon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={cn("max-w-[85%]", message.role === "user" ? "items-end" : "items-start")}>
                    {message.role === "assistant" && (
                      <p className="text-xs text-muted-foreground mb-1 ml-1">{agentInfo.name}</p>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary/80 text-secondary-foreground rounded-bl-sm border border-border/50",
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {typeof message.content === "string" ? renderMessageContent(message.content) : null}
                      </div>
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                      <UserIcon className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-8 w-8 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                    currentAgent.color,
                  )}
                >
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

      {/* Input - Fixed form submission */}
      <div className="p-4 border-t bg-background">
        <form id="chat-form" onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreve a tua pergunta..."
            disabled={isLoading}
            className="flex-1 rounded-xl bg-accent/50 border-0 focus-visible:ring-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className={cn("rounded-xl w-11 h-11 bg-gradient-to-r", currentAgent.color)}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">Powered by Claude + Multi-Agent System</p>
      </div>
    </div>
  )
}
