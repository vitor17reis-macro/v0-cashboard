import { streamText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { classifyIntent, getAgentSystemPrompt } from "@/lib/agents/orchestrator"
import type { AgentContext } from "@/lib/agents/types"

export const maxDuration = 60

// SQL Agent Tools
const getTransactionsTool = tool({
  description: "Get transactions with optional filters",
  parameters: z.object({
    type: z.enum(["income", "expense", "all"]).optional(),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().optional().default(50),
  }),
  execute: async ({ type, category, startDate, endDate, limit }) => {
    const supabase = await createClient()

    let query = supabase
      .from("transactions")
      .select("*, accounts(name)")
      .order("date", { ascending: false })
      .limit(limit)

    if (type && type !== "all") {
      query = query.eq("type", type)
    }
    if (category) {
      query = query.ilike("category", `%${category}%`)
    }
    if (startDate) {
      query = query.gte("date", startDate)
    }
    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query

    if (error) return { error: error.message }
    return { transactions: data, count: data?.length || 0 }
  },
})

const getAccountsTool = tool({
  description: "Get all user accounts with balances",
  parameters: z.object({}),
  execute: async () => {
    const supabase = await createClient()

    const { data, error } = await supabase.from("accounts").select("*")

    if (error) return { error: error.message }

    const totals = {
      checking: 0,
      savings: 0,
      investment: 0,
      cash: 0,
      total: 0,
    }

    data?.forEach((acc) => {
      const accType = acc.type as keyof typeof totals
      if (accType in totals) {
        totals[accType] = (totals[accType] || 0) + acc.balance
      }
      totals.total += acc.balance
    })

    return { accounts: data, totals }
  },
})

const getGoalsTool = tool({
  description: "Get all user financial goals with progress",
  parameters: z.object({}),
  execute: async () => {
    const supabase = await createClient()

    const { data, error } = await supabase.from("goals").select("*")

    if (error) return { error: error.message }

    const goalsWithProgress = data?.map((goal) => ({
      ...goal,
      progress: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
      remaining: goal.target_amount - goal.current_amount,
    }))

    return { goals: goalsWithProgress }
  },
})

const calculateStatsTool = tool({
  description: "Calculate financial statistics for a period",
  parameters: z.object({
    period: z.enum(["week", "month", "quarter", "year", "all"]),
  }),
  execute: async ({ period }) => {
    const supabase = await createClient()

    const now = new Date()
    let startDate: Date

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "quarter":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0)
    }

    const { data, error } = await supabase.from("transactions").select("*").gte("date", startDate.toISOString())

    if (error) return { error: error.message }

    const stats = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: data?.length || 0,
      byCategory: {} as Record<string, number>,
    }

    data?.forEach((t) => {
      if (t.type === "income") {
        stats.totalIncome += t.amount
      } else if (t.type === "expense") {
        stats.totalExpense += t.amount
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + t.amount
      }
    })

    stats.balance = stats.totalIncome - stats.totalExpense

    return { stats, period }
  },
})

// Finance Agent Tools
const getMarketDataTool = tool({
  description: "Get market data and stock information",
  parameters: z.object({
    type: z.enum(["stocks", "crypto", "etf", "all"]).optional(),
  }),
  execute: async ({ type }) => {
    const marketData = [
      { symbol: "SPY", name: "S&P 500 ETF", price: 450.23, change: 1.2, type: "etf" },
      { symbol: "AAPL", name: "Apple Inc.", price: 178.5, change: -0.5, type: "stocks" },
      { symbol: "MSFT", name: "Microsoft", price: 378.2, change: 0.8, type: "stocks" },
      { symbol: "BTC", name: "Bitcoin", price: 43500, change: 2.1, type: "crypto" },
      { symbol: "ETH", name: "Ethereum", price: 2280, change: 1.5, type: "crypto" },
      { symbol: "IWDA", name: "iShares World", price: 82.5, change: 0.3, type: "etf" },
    ]

    let filtered = marketData
    if (type && type !== "all") {
      filtered = filtered.filter((m) => m.type === type)
    }

    return { data: filtered, lastUpdated: new Date().toISOString() }
  },
})

const getInvestmentAdviceTool = tool({
  description: "Get personalized investment advice based on user profile",
  parameters: z.object({
    riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    timeHorizon: z.enum(["short", "medium", "long"]).optional(),
  }),
  execute: async ({ riskProfile = "moderate", timeHorizon = "medium" }) => {
    const advice = {
      conservative: {
        allocation: { bonds: 60, stocks: 30, cash: 10 },
        recommendations: ["Obrigações do Tesouro Português", "ETFs de obrigações globais", "Depósitos a prazo"],
        expectedReturn: "3-5% ao ano",
      },
      moderate: {
        allocation: { bonds: 40, stocks: 50, cash: 10 },
        recommendations: ["ETF World (IWDA/VWCE)", "ETF S&P 500", "Obrigações diversificadas"],
        expectedReturn: "6-8% ao ano",
      },
      aggressive: {
        allocation: { bonds: 20, stocks: 70, cash: 10 },
        recommendations: ["ETF World", "ETF mercados emergentes", "Ações de crescimento"],
        expectedReturn: "8-12% ao ano",
      },
    }

    return {
      profile: riskProfile,
      timeHorizon,
      ...advice[riskProfile],
      disclaimer: "Informação educacional, não é aconselhamento financeiro.",
    }
  },
})

// Planner Agent Tools
const createFinancialPlanTool = tool({
  description: "Create a personalized financial plan to achieve a goal",
  parameters: z.object({
    goalName: z.string(),
    targetAmount: z.number(),
    currentAmount: z.number().optional().default(0),
    targetMonths: z.number(),
  }),
  execute: async ({ goalName, targetAmount, currentAmount, targetMonths }) => {
    const remaining = targetAmount - currentAmount
    const monthlyRequired = remaining / targetMonths

    return {
      goal: goalName,
      targetAmount,
      currentAmount,
      remaining,
      targetMonths,
      monthlyRequired: Math.round(monthlyRequired * 100) / 100,
      weeklyRequired: Math.round((monthlyRequired / 4) * 100) / 100,
      steps: [
        { step: 1, action: "Criar meta no CashBoard", description: `Adiciona "${goalName}" com ${targetAmount}€` },
        { step: 2, action: "Configurar automação", description: `Transferir ${Math.round(monthlyRequired)}€/mês` },
        { step: 3, action: "Definir orçamento", description: "Revê categorias e define limites" },
        { step: 4, action: "Acompanhar", description: "Verifica progresso semanalmente" },
      ],
    }
  },
})

// Education Agent Tool
const getFinancialEducationTool = tool({
  description: "Get educational content about financial topics",
  parameters: z.object({
    topic: z.string(),
  }),
  execute: async ({ topic }) => {
    const topics: Record<string, { title: string; content: string }> = {
      "juros compostos": {
        title: "Juros Compostos",
        content: `Os juros compostos são "juros sobre juros". Exemplo: 1.000€ a 5% ao ano = 1.628,89€ em 10 anos. Regra dos 72: divide 72 pela taxa para saber quantos anos demora a duplicar.`,
      },
      etf: {
        title: "ETFs",
        content: `ETFs são cestas de investimentos. Vantagens: diversificação, custos baixos, fácil negociação. Recomendados: IWDA, VWCE, SPY.`,
      },
      orcamento: {
        title: "Orçamento 50/30/20",
        content: `50% Necessidades (renda, comida), 30% Desejos (lazer), 20% Poupança. Regista tudo no CashBoard.`,
      },
      poupanca: {
        title: "Fundo de Emergência",
        content: `Guarda 3-6 meses de despesas numa conta separada. Usa só para emergências reais.`,
      },
    }

    const key = Object.keys(topics).find((k) => topic.toLowerCase().includes(k))
    if (key) {
      return topics[key]
    }

    return {
      title: topic,
      content: `Posso ajudar com: juros compostos, ETFs, orçamento, poupança. Qual preferes?`,
    }
  },
})

export async function POST(req: Request) {
  try {
    const { messages, context, selectedAgent } = (await req.json()) as {
      messages: Array<{ role: string; content: string }>
      context: AgentContext
      selectedAgent?: string
    }

    const lastMessage = messages[messages.length - 1]
    const userQuery = lastMessage?.content || ""

    // Classify intent to route to appropriate agent
    const classification = classifyIntent(userQuery, context)

    // Use selected agent if specified and not "auto"
    const agentType = selectedAgent && selectedAgent !== "auto" ? selectedAgent : classification.intent

    // Get agent-specific system prompt
    const systemPrompt = getAgentSystemPrompt(agentType as any, context)

    // Select tools based on agent type
    const agentTools: Record<string, ReturnType<typeof tool>> = {}

    switch (agentType) {
      case "sql":
        agentTools.getTransactions = getTransactionsTool
        agentTools.getAccounts = getAccountsTool
        agentTools.getGoals = getGoalsTool
        agentTools.calculateStats = calculateStatsTool
        break
      case "finance":
        agentTools.getMarketData = getMarketDataTool
        agentTools.getInvestmentAdvice = getInvestmentAdviceTool
        agentTools.getAccounts = getAccountsTool
        break
      case "planner":
        agentTools.createFinancialPlan = createFinancialPlanTool
        agentTools.getGoals = getGoalsTool
        agentTools.calculateStats = calculateStatsTool
        break
      case "education":
        agentTools.getFinancialEducation = getFinancialEducationTool
        break
      default:
        agentTools.getAccounts = getAccountsTool
        agentTools.getGoals = getGoalsTool
        agentTools.getTransactions = getTransactionsTool
    }

    const result = streamText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `${systemPrompt}

Responde sempre em português de Portugal.
Formata as respostas com markdown para melhor legibilidade.
Quando usares ferramentas, explica os resultados de forma clara.
No final, sugere 2-3 ações relevantes.

Agente: ${agentType}`,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      tools: Object.keys(agentTools).length > 0 ? agentTools : undefined,
      maxSteps: 5,
    })

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Agent-Type": agentType,
      },
    })
  } catch (error) {
    console.error("Agent API Error:", error)
    return new Response(
      JSON.stringify({
        error: "Erro ao processar pedido",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
