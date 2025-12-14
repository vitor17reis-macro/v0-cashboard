import type { Message } from "@/lib/types"
import type { Transaction, Account, Goal } from "@/lib/types"

export interface ConversationAnalysis {
  mainTopics: string[]
  userIntents: string[]
  concerns: string[]
  recommendedActions: string[]
  sentimentScore: number
}

export interface ProactiveRecommendation {
  type: "savings" | "investment" | "budget" | "goal" | "automation" | "alert"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  actionable: boolean
  suggestedAction?: string
}

// Enhanced NLP matching with semantic understanding
export function analyzeUserIntent(query: string): {
  intent: string
  confidence: number
  entities: Record<string, string>
} {
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  const intents = {
    spending_analysis: {
      keywords: ["quanto gastei", "gastos", "despesas", "categoria", "maior despesa", "onde vou gastar"],
      confidence: 0,
    },
    savings_inquiry: {
      keywords: ["poupar", "poupança", "economizar", "economias", "fundo de emergência"],
      confidence: 0,
    },
    goal_progress: {
      keywords: ["meta", "objetivo", "progresso", "alcançar", "quanto falta"],
      confidence: 0,
    },
    investment_advice: {
      keywords: ["investir", "investimento", "ações", "etf", "fundo", "carteira", "diversif"],
      confidence: 0,
    },
    budget_management: {
      keywords: ["orçamento", "budget", "limite", "controlar gastos", "50/30/20"],
      confidence: 0,
    },
    income_inquiry: {
      keywords: ["recebi", "receitas", "rendimento", "salário", "ganho", "entrada"],
      confidence: 0,
    },
    wealth_status: {
      keywords: ["saldo", "patrimonio", "quanto tenho", "total", "valor"],
      confidence: 0,
    },
    automation_request: {
      keywords: ["automação", "automático", "regra", "transferência automática"],
      confidence: 0,
    },
    financial_education: {
      keywords: ["como funciona", "explica", "o que é", "conceito", "juros compostos", "diversif"],
      confidence: 0,
    },
  }

  // Score each intent
  Object.entries(intents).forEach(([intent, data]) => {
    data.confidence = data.keywords.filter((k) => q.includes(k)).length
  })

  // Find best match
  const best = Object.entries(intents).sort((a, b) => b[1].confidence - a[1].confidence)[0]

  return {
    intent: best[0],
    confidence: Math.min(best[1].confidence / 3, 1), // Normalize to 0-1
    entities: extractEntities(query),
  }
}

function extractEntities(query: string): Record<string, string> {
  const entities: Record<string, string> = {}

  // Extract amounts (€123, 123€, 123 euros)
  const amountMatch = query.match(/([€$]?\s*\d+(?:[.,]\d{2})?\s*(?:euros?|€|$)?)/i)
  if (amountMatch) entities.amount = amountMatch[1].replace(/\D/g, "")

  // Extract time periods
  if (query.match(/(?:este|próximo|último)\s+(mês|ano|trimestre|semana)/i)) {
    const timeMatch = query.match(/(?:este|próximo|último)\s+(mês|ano|trimestre|semana)/i)
    entities.period = timeMatch?.[1] || "month"
  }

  // Extract categories
  const categories = ["alimentação", "transporte", "habitação", "saúde", "lazer", "educação", "subscrições"]
  const matchedCat = categories.find((c) => query.toLowerCase().includes(c))
  if (matchedCat) entities.category = matchedCat

  return entities
}

// Analyze conversation history for patterns
export function analyzeConversation(messages: Message[]): ConversationAnalysis {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content)

  const mainTopics = extractMainTopics(userMessages)
  const userIntents = userMessages.map((msg) => analyzeUserIntent(msg).intent)
  const concerns = identifyConcerns(userMessages)
  const recommendedActions = suggestActions(mainTopics, concerns)
  const sentimentScore = calculateSentiment(userMessages)

  return {
    mainTopics: [...new Set(mainTopics)],
    userIntents: [...new Set(userIntents)],
    concerns,
    recommendedActions,
    sentimentScore,
  }
}

function extractMainTopics(messages: string[]): string[] {
  const topicKeywords: Record<string, string[]> = {
    savings: ["poupar", "poupança", "economizar", "fundo de emergência"],
    spending: ["gastar", "despesas", "custos", "categoria"],
    goals: ["meta", "objetivo", "alcançar", "progresso"],
    investments: ["investir", "ações", "etf", "carteira"],
    budgets: ["orçamento", "limite", "controlar", "50/30/20"],
    income: ["receita", "rendimento", "salário", "ganho"],
  }

  const topics: string[] = []
  messages.forEach((msg) => {
    const lower = msg.toLowerCase()
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some((k) => lower.includes(k))) {
        topics.push(topic)
      }
    })
  })

  return topics
}

function identifyConcerns(messages: string[]): string[] {
  const concerns: string[] = []

  messages.forEach((msg) => {
    const lower = msg.toLowerCase()

    if (lower.match(/(?:preciso|preciso de|falta|não tenho|como|quando)/)) {
      if (lower.includes("poupar")) concerns.push("savings_difficulty")
      if (lower.includes("investir")) concerns.push("investment_uncertainty")
      if (lower.includes("meta")) concerns.push("goal_progress_slow")
      if (lower.includes("gasto")) concerns.push("spending_control")
      if (lower.includes("orçamento")) concerns.push("budget_management")
    }
  })

  return [...new Set(concerns)]
}

function suggestActions(topics: string[], concerns: string[]): string[] {
  const actions: string[] = []

  if (topics.includes("savings") && concerns.includes("savings_difficulty")) {
    actions.push("Cria uma automação para poupar automaticamente")
  }
  if (topics.includes("spending")) {
    actions.push("Define orçamentos para categorias principais")
  }
  if (topics.includes("goals")) {
    actions.push("Analisa o progresso das metas regularmente")
  }
  if (concerns.includes("spending_control")) {
    actions.push("Revê as top 5 categorias de gastos este mês")
  }

  return actions
}

function calculateSentiment(messages: string[]): number {
  let score = 0.5 // Neutral by default

  const positiveWords = ["excelente", "ótimo", "bom", "consegui", "melhorou", "atingi"]
  const negativeWords = ["pior", "problema", "dificuldade", "preocupado", "gastei muito", "não consigo"]

  messages.forEach((msg) => {
    const lower = msg.toLowerCase()
    const positiveCount = positiveWords.filter((w) => lower.includes(w)).length
    const negativeCount = negativeWords.filter((w) => lower.includes(w)).length

    score += (positiveCount - negativeCount) * 0.1
  })

  return Math.max(0, Math.min(1, score))
}

// Generate proactive recommendations based on financial data
export function generateProactiveRecommendations(
  transactions: Transaction[],
  accounts: Account[],
  goals: Goal[],
  analysis: ConversationAnalysis,
): ProactiveRecommendation[] {
  const recommendations: ProactiveRecommendation[] = []

  // Calculate metrics
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthTransactions = transactions.filter((t) => new Date(t.date) >= startOfMonth)

  const monthlyIncome = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const monthlyExpenses = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
  const totalSavings = accounts.filter((a) => a.type === "savings").reduce((sum, a) => sum + (a.balance || 0), 0)

  // RECOMMENDATION 1: Low savings rate
  if (savingsRate < 10 && analysis.mainTopics.includes("savings")) {
    recommendations.push({
      type: "savings",
      title: "Taxa de poupança baixa",
      description: `A tua taxa de poupança é ${savingsRate.toFixed(0)}%, quando o recomendado é 20%. Considera reduzir despesas.`,
      priority: "high",
      actionable: true,
      suggestedAction: "Revê as tuas despesas por categoria e identifica áreas para cortar",
    })
  }

  // RECOMMENDATION 2: Emergency fund
  const avgMonthlyExpenses = monthlyExpenses || 1000
  const recommendedEmergencyFund = avgMonthlyExpenses * 6
  if (totalSavings < recommendedEmergencyFund && !analysis.mainTopics.includes("goals")) {
    recommendations.push({
      type: "savings",
      title: "Fundo de emergência incompleto",
      description: `Tens €${totalSavings.toFixed(0)} de um recomendado de €${recommendedEmergencyFund.toFixed(0)}.`,
      priority: "high",
      actionable: true,
      suggestedAction: "Prioriza a criação de um fundo de emergência de 6 meses de despesas",
    })
  }

  // RECOMMENDATION 3: Investment opportunity
  if (totalBalance > 5000 && !analysis.mainTopics.includes("investments")) {
    recommendations.push({
      type: "investment",
      title: "Oportunidade de investimento",
      description: "Com um saldo disponível, podes começar a investir para crescimento a longo prazo.",
      priority: "medium",
      actionable: true,
      suggestedAction: "Explora ETFs com baixas taxas de gestão",
    })
  }

  // RECOMMENDATION 4: Goal automation
  if (goals.length > 0 && !analysis.mainTopics.includes("automation_request")) {
    const slowGoals = goals.filter((g) => {
      const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
      return progress < 50
    })
    if (slowGoals.length > 0) {
      recommendations.push({
        type: "automation",
        title: "Acelera o progresso das metas",
        description: `${slowGoals.length} meta(s) está(ão) a avançar lentamente. Automatiza as contribuições.`,
        priority: "medium",
        actionable: true,
        suggestedAction: "Cria uma automação para depositar um valor fixo mensalmente nas metas",
      })
    }
  }

  // RECOMMENDATION 5: Spending alert
  const topExpense = monthTransactions.filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount)[0]
  if (topExpense && topExpense.amount > monthlyExpenses * 0.2) {
    recommendations.push({
      type: "alert",
      title: "Despesa significativa detectada",
      description: `${topExpense.description} (€${topExpense.amount.toFixed(0)}) representa 20%+ do total de despesas.`,
      priority: "medium",
      actionable: true,
    })
  }

  // RECOMMENDATION 6: Budget setup
  if (analysis.mainTopics.includes("budget_management") && goals.length === 0) {
    recommendations.push({
      type: "budget",
      title: "Configura orçamentos por categoria",
      description: "Orçamentos ajudam a controlar gastos e alcançar metas mais rapidamente.",
      priority: "low",
      actionable: true,
      suggestedAction: "Usa a regra 50/30/20 como base para estabelecer os teus orçamentos",
    })
  }

  // Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// Format recommendations for display
export function formatRecommendations(recs: ProactiveRecommendation[]): string {
  if (recs.length === 0) return "Estás no bom caminho financeiramente!"

  let output = "💡 **Recomendações Personalizadas para Ti:**\n\n"

  recs.slice(0, 3).forEach((rec, i) => {
    const icons: Record<string, string> = {
      savings: "💰",
      investment: "📈",
      budget: "📊",
      goal: "🎯",
      automation: "🤖",
      alert: "⚠️",
    }
    output += `${i + 1}. ${icons[rec.type]} **${rec.title}**\n`
    output += `   ${rec.description}\n`
    if (rec.suggestedAction) output += `   → ${rec.suggestedAction}\n`
    output += "\n"
  })

  return output
}
