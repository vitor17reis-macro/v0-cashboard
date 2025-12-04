import { streamText, tool, convertToModelMessages, type UIMessage } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { classifyIntent, getAgentSystemPrompt } from "@/lib/agents/orchestrator"
import type { AgentContext } from "@/lib/agents/types"

export const maxDuration = 60

// SQL Agent Tools
const sqlQueryTool = tool({
  description: "Execute a SQL query on the financial database to answer user questions about their finances",
  inputSchema: z.object({
    query: z.string().describe("The SQL query to execute. Use proper PostgreSQL syntax."),
    explanation: z.string().describe("Brief explanation of what this query does in Portuguese"),
  }),
  execute: async ({ query, explanation }, { userId }: { userId: string }) => {
    const supabase = await createClient()

    // Safety check - only allow SELECT queries
    if (!query.trim().toLowerCase().startsWith("select")) {
      return { error: "Apenas consultas SELECT são permitidas", explanation }
    }

    // Add user_id filter for security
    const safeQuery = query.replace(/FROM\s+(\w+)/gi, `FROM $1 WHERE user_id = '${userId}' AND`).replace(/AND\s*$/i, "")

    try {
      const { data, error } = await supabase.rpc("execute_safe_query", {
        query_text: safeQuery,
      })

      if (error) {
        // Fallback: try direct query on allowed tables
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .limit(100)

        return {
          result: fallbackData || [],
          explanation,
          note: "Consulta simplificada executada",
        }
      }

      return { result: data, explanation }
    } catch (e) {
      return { error: "Erro ao executar consulta", explanation }
    }
  },
})

const getTransactionsTool = tool({
  description: "Get transactions with optional filters",
  inputSchema: z.object({
    type: z.enum(["income", "expense", "all"]).optional(),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().optional().default(50),
  }),
  execute: async ({ type, category, startDate, endDate, limit }, { userId }: { userId: string }) => {
    const supabase = await createClient()

    let query = supabase
      .from("transactions")
      .select("*, accounts(name)")
      .eq("user_id", userId)
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
  inputSchema: z.object({}),
  execute: async (_, { userId }: { userId: string }) => {
    const supabase = await createClient()

    const { data, error } = await supabase.from("accounts").select("*").eq("user_id", userId)

    if (error) return { error: error.message }

    const totals = {
      checking: 0,
      savings: 0,
      investment: 0,
      cash: 0,
      total: 0,
    }

    data?.forEach((acc) => {
      totals[acc.type as keyof typeof totals] = (totals[acc.type as keyof typeof totals] || 0) + acc.balance
      totals.total += acc.balance
    })

    return { accounts: data, totals }
  },
})

const getGoalsTool = tool({
  description: "Get all user financial goals with progress",
  inputSchema: z.object({}),
  execute: async (_, { userId }: { userId: string }) => {
    const supabase = await createClient()

    const { data, error } = await supabase.from("goals").select("*").eq("user_id", userId)

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
  inputSchema: z.object({
    period: z.enum(["week", "month", "quarter", "year", "all"]),
    compareWithPrevious: z.boolean().optional().default(false),
  }),
  execute: async ({ period, compareWithPrevious }, { userId }: { userId: string }) => {
    const supabase = await createClient()

    const now = new Date()
    let startDate: Date
    let previousStartDate: Date | null = null

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7))
        if (compareWithPrevious) {
          previousStartDate = new Date(now.setDate(now.getDate() - 14))
        }
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        if (compareWithPrevious) {
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        }
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

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString())

    if (error) return { error: error.message }

    const stats = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: data?.length || 0,
      avgTransaction: 0,
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
    stats.avgTransaction =
      stats.transactionCount > 0 ? (stats.totalIncome + stats.totalExpense) / stats.transactionCount : 0

    return { stats, period }
  },
})

// Finance Agent Tools
const getMarketDataTool = tool({
  description: "Get market data and stock information",
  inputSchema: z.object({
    symbols: z.array(z.string()).optional(),
    type: z.enum(["stocks", "crypto", "etf", "all"]).optional(),
  }),
  execute: async ({ symbols, type }) => {
    // Simulated market data (in production, would call real API)
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
    if (symbols?.length) {
      filtered = filtered.filter((m) => symbols.includes(m.symbol))
    }

    return { data: filtered, lastUpdated: new Date().toISOString() }
  },
})

const getInvestmentAdviceTool = tool({
  description: "Get personalized investment advice based on user profile",
  inputSchema: z.object({
    riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    investmentGoal: z.string().optional(),
    timeHorizon: z.enum(["short", "medium", "long"]).optional(),
  }),
  execute: async ({ riskProfile = "moderate", investmentGoal, timeHorizon = "medium" }) => {
    const advice = {
      conservative: {
        allocation: { bonds: 60, stocks: 30, cash: 10 },
        recommendations: [
          "Obrigações do Tesouro Português",
          "ETFs de obrigações globais (ex: BND)",
          "Depósitos a prazo com capital garantido",
        ],
        expectedReturn: "3-5% ao ano",
      },
      moderate: {
        allocation: { bonds: 40, stocks: 50, cash: 10 },
        recommendations: ["ETF World (IWDA/VWCE)", "ETF S&P 500 (SPY/VOO)", "Obrigações diversificadas"],
        expectedReturn: "6-8% ao ano",
      },
      aggressive: {
        allocation: { bonds: 20, stocks: 70, cash: 10 },
        recommendations: [
          "ETF World (IWDA/VWCE)",
          "ETF mercados emergentes",
          "Ações individuais de crescimento",
          "Pequena exposição a crypto (max 5%)",
        ],
        expectedReturn: "8-12% ao ano (com maior volatilidade)",
      },
    }

    return {
      profile: riskProfile,
      timeHorizon,
      goal: investmentGoal,
      ...advice[riskProfile],
      disclaimer: "Esta informação é apenas educacional e não constitui aconselhamento financeiro profissional.",
    }
  },
})

// Planner Agent Tools
const createFinancialPlanTool = tool({
  description: "Create a personalized financial plan to achieve a goal",
  inputSchema: z.object({
    goalName: z.string(),
    targetAmount: z.number(),
    currentAmount: z.number().optional().default(0),
    targetMonths: z.number(),
    monthlyIncome: z.number().optional(),
    monthlyExpenses: z.number().optional(),
  }),
  execute: async ({ goalName, targetAmount, currentAmount, targetMonths, monthlyIncome, monthlyExpenses }) => {
    const remaining = targetAmount - currentAmount
    const monthlyRequired = remaining / targetMonths
    const weeklyRequired = monthlyRequired / 4
    const dailyRequired = monthlyRequired / 30

    const savingsCapacity = monthlyIncome && monthlyExpenses ? monthlyIncome - monthlyExpenses : null

    const isFeasible = savingsCapacity ? monthlyRequired <= savingsCapacity : null

    const plan = {
      goal: goalName,
      targetAmount,
      currentAmount,
      remaining,
      targetMonths,
      monthlyRequired,
      weeklyRequired: Math.round(weeklyRequired * 100) / 100,
      dailyRequired: Math.round(dailyRequired * 100) / 100,
      isFeasible,
      savingsCapacity,
      steps: [
        {
          step: 1,
          action: "Criar meta no CashBoard",
          description: `Adiciona uma meta chamada "${goalName}" com valor alvo de ${targetAmount}€`,
        },
        {
          step: 2,
          action: "Configurar automação",
          description: `Cria uma regra para transferir ${Math.round(monthlyRequired)}€ automaticamente quando receberes o salário`,
        },
        {
          step: 3,
          action: "Definir orçamento",
          description: "Revê as tuas categorias de despesa e define limites para poupar mais",
        },
        {
          step: 4,
          action: "Acompanhar progresso",
          description: "Verifica a evolução da meta semanalmente na secção de Metas",
        },
      ],
      tips: [
        "Automatiza as transferências para não te esqueceres",
        "Considera fontes de rendimento extra",
        "Revê subscrições e despesas desnecessárias",
      ],
    }

    if (!isFeasible && savingsCapacity !== null) {
      plan.tips.push(`Precisas de poupar mais ${monthlyRequired - savingsCapacity}€/mês ou aumentar o prazo`)
    }

    return plan
  },
})

// Education Agent Tool
const getFinancialEducationTool = tool({
  description: "Get educational content about financial topics",
  inputSchema: z.object({
    topic: z.string(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
  }),
  execute: async ({ topic, level }) => {
    const topics: Record<string, any> = {
      "juros compostos": {
        title: "Juros Compostos - A 8ª Maravilha do Mundo",
        beginner: `Os juros compostos são "juros sobre juros". Quando investes dinheiro, ganhas juros. No período seguinte, ganhas juros sobre o valor original MAIS os juros anteriores.

**Exemplo prático:**
- Investes 1.000€ a 5% ao ano
- Ano 1: 1.000€ + 50€ = 1.050€
- Ano 2: 1.050€ + 52,50€ = 1.102,50€
- Ano 10: 1.628,89€

A fórmula mágica: **Valor Final = Capital × (1 + taxa)^anos**`,
        intermediate: `Para maximizar os juros compostos:

1. **Começa cedo** - O tempo é o fator mais poderoso
2. **Investe regularmente** - O DCA (Dollar Cost Averaging) reduz o risco
3. **Reinveste os dividendos** - Não gastes os rendimentos
4. **Minimiza custos** - Cada 1% de comissões custa milhares a longo prazo

**Regra dos 72**: Divide 72 pela taxa de juro para saber quantos anos demora a duplicar.
Ex: 72 ÷ 7% = ~10 anos para duplicar`,
        advanced: `Conceitos avançados de capitalização:

- **Capitalização contínua**: A = P × e^(rt)
- **Taxa Efetiva Anual (TAE)**: Considera a frequência de capitalização
- **Impacto da inflação**: Retorno real = retorno nominal - inflação
- **Sequência de retornos**: O timing afeta significativamente o resultado final`,
      },
      etf: {
        title: "ETFs - Investir de Forma Simples e Diversificada",
        beginner: `Um ETF (Exchange Traded Fund) é como uma cesta de investimentos que podes comprar numa única transação.

**Vantagens:**
- Diversificação instantânea
- Custos baixos (TER tipicamente < 0.5%)
- Fácil de comprar/vender

**ETFs recomendados para iniciantes:**
- IWDA/VWCE - Ações mundiais
- VAGF - Obrigações globais
- SPY/VOO - S&P 500`,
        intermediate: `Estratégias com ETFs:

1. **Core-Satellite**: 80% em ETF global + 20% em posições específicas
2. **Factor Investing**: Small Cap, Value, Momentum
3. **Asset Allocation**: Stocks/Bonds baseado na idade

**Custos a considerar:**
- TER (Total Expense Ratio)
- Spread bid-ask
- Comissões da corretora
- Impostos sobre dividendos`,
      },
      orcamento: {
        title: "Orçamento - O Fundamento das Finanças Pessoais",
        beginner: `Um orçamento é um plano para o teu dinheiro. A regra mais popular é a **50/30/20**:

- **50% Necessidades**: Renda, comida, transportes, utilities
- **30% Desejos**: Restaurantes, entretenimento, compras
- **20% Poupança**: Fundo de emergência, investimentos, metas

**Passos para criar:**
1. Regista todas as receitas
2. Lista despesas fixas e variáveis
3. Define limites por categoria
4. Acompanha e ajusta mensalmente`,
        intermediate: `Métodos avançados de orçamentação:

1. **Zero-Based Budget**: Cada euro tem um destino
2. **Envelope System**: Dinheiro físico ou virtual por categoria
3. **Pay Yourself First**: Automatiza poupança antes de gastar
4. **Anti-Budget**: Poupa X%, gasta o resto sem culpa

**No CashBoard:**
- Usa Categorias para classificar despesas
- Define Orçamentos por categoria
- Cria Automações para transferir para poupança`,
      },
      "fundo emergencia": {
        title: "Fundo de Emergência - A Tua Rede de Segurança",
        beginner: `Um fundo de emergência protege-te de imprevistos sem recorrer a dívidas.

**Quanto guardar:**
- Mínimo: 3 meses de despesas
- Ideal: 6 meses de despesas
- Se rendimento variável: 9-12 meses

**Onde guardar:**
- Conta poupança separada
- Acesso imediato (liquidez)
- Sem risco de perda

**Quando usar:**
- Perda de emprego
- Emergências médicas
- Reparações urgentes (carro, casa)
- NÃO para férias ou compras planeadas`,
      },
    }

    const normalizedTopic = topic.toLowerCase()

    for (const [key, content] of Object.entries(topics)) {
      if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
        return {
          topic: content.title,
          level,
          content: content[level] || content.beginner,
          relatedTopics: Object.keys(topics).filter((t) => t !== key),
        }
      }
    }

    return {
      topic,
      level,
      content: `Não tenho informação específica sobre "${topic}", mas posso ajudar com: ${Object.keys(topics).join(", ")}. Qual gostarias de aprender?`,
      relatedTopics: Object.keys(topics),
    }
  },
})

export async function POST(req: Request) {
  try {
    const { messages, userId, context } = (await req.json()) as {
      messages: UIMessage[]
      userId: string
      context: AgentContext
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const lastMessage = messages[messages.length - 1]
    const userQuery =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : lastMessage.parts?.find((p) => p.type === "text")?.text || ""

    // Classify intent to route to appropriate agent
    const classification = classifyIntent(userQuery, context)

    // Get agent-specific system prompt
    const systemPrompt = getAgentSystemPrompt(classification.intent, context)

    // Select tools based on agent type
    const agentTools: Record<string, any> = {}

    switch (classification.intent) {
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
        // Support agent gets all basic tools
        agentTools.getAccounts = getAccountsTool
        agentTools.getGoals = getGoalsTool
        agentTools.getTransactions = getTransactionsTool
    }

    const result = streamText({
      model: "anthropic/claude-sonnet-4",
      system: `${systemPrompt}

Responde sempre em português de Portugal.
Formata as respostas com markdown para melhor legibilidade.
Quando usares ferramentas, explica os resultados de forma clara.
No final, sugere 2-3 ações relevantes que o utilizador pode fazer.

Agente ativo: ${classification.intent} (confiança: ${Math.round(classification.confidence * 100)}%)`,
      messages: convertToModelMessages(messages),
      tools: agentTools,
      toolChoice: "auto",
      stopWhen: (context) => context.steps.length >= 5,
      experimental_toolCallStreaming: true,
    })

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Agent-Type": classification.intent,
        "X-Agent-Confidence": String(classification.confidence),
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
