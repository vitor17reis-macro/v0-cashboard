"use client"
import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
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
  Calculator,
  RefreshCw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@supabase/ssr"

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
    "Simula investir 200€/mês durante 20 anos a 7%",
  ],
  poupar: [
    "Onde posso cortar despesas?",
    "Como aplicar a regra 50/30/20?",
    "Quanto devo ter em fundo de emergência?",
    "Quais despesas posso eliminar?",
    "Analisa as minhas despesas por categoria",
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
  const [userId, setUserId] = useState<string | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append, reload, error } = useChat({
    api: "/api/chat",
    body: { userId },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `Olá! Sou o **CashBot**, o teu assistente financeiro inteligente.

Tenho acesso aos teus dados financeiros e posso:
• **Analisar** as tuas finanças em tempo real
• **Calcular** juros compostos e poupanças
• **Sugerir** onde cortar despesas
• **Planear** como atingir metas mais rápido
• **Ensinar** conceitos de investimento

Escolhe um tema acima ou pergunta-me qualquer coisa!`,
      },
    ],
    onError: (err) => {
      console.error("[v0] Chat error:", err)
    },
  })

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

  const sendQuickMessage = async (text: string) => {
    if (isLoading) return
    await append({
      role: "user",
      content: text,
    })
  }

  const quickActions = [
    { icon: Wallet, label: "Saldo", topic: "saldo", color: "text-emerald-500" },
    { icon: Target, label: "Metas", topic: "metas", color: "text-blue-500" },
    { icon: TrendingUp, label: "Investir", topic: "investir", color: "text-purple-500" },
    { icon: Lightbulb, label: "Poupar", topic: "poupar", color: "text-amber-500" },
    { icon: GraduationCap, label: "Aprender", topic: "aprender", color: "text-pink-500" },
    { icon: HelpCircle, label: "Ajuda", topic: "ajuda", color: "text-gray-500" },
  ]

  const renderMessageContent = (message: any) => {
    // AI SDK v5 uses parts
    if (message.parts && message.parts.length > 0) {
      return message.parts.map((part: any, index: number) => {
        if (part.type === "text") {
          return <div key={index}>{renderFormattedText(part.text)}</div>
        }
        if (part.type === "tool-invocation") {
          const { toolName, state, result, args } = part.toolInvocation
          if (state === "result" && result) {
            return (
              <div key={index} className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-xs text-primary mb-2">
                  <Calculator className="h-3 w-3" />
                  <span className="font-medium">Cálculo: {toolName}</span>
                </div>
                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )
          }
          if (state === "call") {
            return (
              <div key={index} className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>A executar {toolName}...</span>
              </div>
            )
          }
        }
        return null
      })
    }

    // Fallback to content
    if (message.content) {
      return renderFormattedText(message.content)
    }

    return null
  }

  const renderFormattedText = (text: string) => {
    if (!text) return null
    return text.split("\n").map((line, i) => {
      // Handle bullet points
      if (line.startsWith("• ") || line.startsWith("- ")) {
        const content = line.slice(2)
        return (
          <p key={i} className="mb-1 last:mb-0 pl-2 flex gap-2">
            <span className="text-primary">•</span>
            <span>{content.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}</span>
          </p>
        )
      }
      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={i} className="mb-1 last:mb-0 pl-2">
            {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
          </p>
        )
      }
      // Regular paragraph
      return (
        <p key={i} className="mb-1 last:mb-0">
          {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
        </p>
      )
    })
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
            <h3 className="font-semibold">CashBot</h3>
            <p className="text-xs text-muted-foreground">Assistente Financeiro IA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => reload()}
              className="rounded-xl"
              title="Tentar novamente"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
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
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  <span className="text-xs flex items-center gap-1">
                    {action.label}
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {topicQuestions[action.topic as keyof typeof topicQuestions].map((question, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => sendQuickMessage(question)}
                    className="cursor-pointer text-sm"
                  >
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{renderMessageContent(message)}</div>
                {message.role === "assistant" &&
                  isLoading &&
                  message.id === messages[messages.length - 1]?.id &&
                  !message.content && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">A analisar...</span>
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

          {/* Error message */}
          {error && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                <XIcon className="h-4 w-4 text-destructive" />
              </div>
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-bl-md">
                <p className="text-sm text-destructive">
                  Ocorreu um erro ao processar o teu pedido. Clica no botão de atualizar para tentar novamente.
                </p>
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
            onChange={handleInputChange}
            placeholder="Pergunta-me qualquer coisa sobre finanças..."
            disabled={isLoading}
            className="rounded-xl"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-xl shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          CashBot pode cometer erros. Verifica sempre informações importantes.
        </p>
      </div>
    </div>
  )
}

export default AIChatbot
