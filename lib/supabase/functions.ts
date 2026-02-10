// Supabase helper functions for agents
import { createClient } from "./server"

export async function executeUserQuery(userId: string, queryType: string, params: Record<string, any> = {}) {
  const supabase = await createClient()

  switch (queryType) {
    case "transactions": {
      let query = supabase
        .from("transactions")
        .select("*, accounts(name, type)")
        .eq("user_id", userId)
        .order("date", { ascending: false })

      if (params.type && params.type !== "all") {
        query = query.eq("type", params.type)
      }
      if (params.category) {
        query = query.ilike("category", `%${params.category}%`)
      }
      if (params.startDate) {
        query = query.gte("date", params.startDate)
      }
      if (params.endDate) {
        query = query.lte("date", params.endDate)
      }
      if (params.limit) {
        query = query.limit(params.limit)
      }

      return query
    }

    case "accounts": {
      return supabase.from("accounts").select("*").eq("user_id", userId)
    }

    case "goals": {
      return supabase.from("goals").select("*").eq("user_id", userId)
    }

    case "categories": {
      return supabase.from("categories").select("*").eq("user_id", userId)
    }

    case "stats": {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .gte("date", params.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      const stats = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        byCategory: {} as Record<string, number>,
        count: transactions?.length || 0,
      }

      transactions?.forEach((t) => {
        if (t.type === "income") {
          stats.totalIncome += t.amount
        } else if (t.type === "expense") {
          stats.totalExpense += t.amount
          stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + t.amount
        }
      })

      stats.balance = stats.totalIncome - stats.totalExpense

      return { data: stats, error: null }
    }

    default:
      return { data: null, error: new Error("Unknown query type") }
  }
}

export async function getFinancialSummary(userId: string) {
  const supabase = await createClient()

  // Get all accounts
  const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", userId)

  // Get current month transactions
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startOfMonth)

  // Get goals
  const { data: goals } = await supabase.from("goals").select("*").eq("user_id", userId)

  // Calculate totals
  const totals = {
    checking: 0,
    savings: 0,
    investment: 0,
    cash: 0,
    total: 0,
  }

  accounts?.forEach((acc) => {
    const type = acc.type as keyof typeof totals
    if (type in totals) {
      totals[type] += acc.balance
    }
    totals.total += acc.balance
  })

  const monthlyStats = {
    income: 0,
    expense: 0,
    balance: 0,
    byCategory: {} as Record<string, number>,
  }

  transactions?.forEach((t) => {
    if (t.type === "income") {
      monthlyStats.income += t.amount
    } else if (t.type === "expense") {
      monthlyStats.expense += t.amount
      monthlyStats.byCategory[t.category] = (monthlyStats.byCategory[t.category] || 0) + t.amount
    }
  })

  monthlyStats.balance = monthlyStats.income - monthlyStats.expense

  const goalsProgress =
    goals?.map((g) => ({
      name: g.name,
      current: g.current_amount,
      target: g.target_amount,
      progress: g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0,
      remaining: g.target_amount - g.current_amount,
    })) || []

  return {
    accounts: totals,
    monthly: monthlyStats,
    goals: goalsProgress,
    accountCount: accounts?.length || 0,
    transactionCount: transactions?.length || 0,
    goalCount: goals?.length || 0,
  }
}
