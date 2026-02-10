import type { Account, Transaction, Category, Goal } from "@/components/providers/finance-provider"

interface EmailSummaryData {
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  goals: Goal[]
  period: "daily" | "weekly" | "monthly"
}

export function generateEmailSummary(data: EmailSummaryData): string {
  const { accounts, transactions, categories, goals, period } = data

  // Calcular período
  const now = new Date()
  const startDate = new Date()
  const periodName = period === "daily" ? "Hoje" : period === "weekly" ? "Esta Semana" : "Este Mês"

  if (period === "daily") startDate.setDate(startDate.getDate() - 1)
  else if (period === "weekly") startDate.setDate(startDate.getDate() - 7)
  else startDate.setMonth(startDate.getMonth() - 1)

  // Filtrar transações do período
  const periodTransactions = transactions.filter((t) => new Date(t.date) >= startDate)

  // Calcular totais
  const totalIncome = periodTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = periodTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  // Top categories
  const topCategories = periodTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>,
    )

  const sortedCategories = Object.entries(topCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Goals progress
  const goalsProgress = goals.map((goal) => ({
    name: goal.name,
    progress: goal.currentAmount / goal.targetAmount,
    remaining: goal.targetAmount - goal.currentAmount,
  }))

  // Montar HTML do email
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
        .amount { font-size: 24px; font-weight: bold; color: #667eea; }
        .category-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .progress-bar { background: #eee; height: 8px; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { background: #667eea; height: 100%; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Resumo Financeiro - ${periodName}</h1>
          <p>Seu dashboard de finanças pessoais</p>
        </div>

        <div class="section">
          <h2>Visão Geral</h2>
          <div class="card">
            <p>Receitas: <span class="amount">€${totalIncome.toFixed(2)}</span></p>
            <p>Despesas: <span class="amount">€${totalExpense.toFixed(2)}</span></p>
            <p>Saldo: <span class="amount">€${(accounts.reduce((sum, a) => sum + a.balance, 0)).toFixed(2)}</span></p>
          </div>
        </div>

        <div class="section">
          <h2>Top Categorias de Despesa</h2>
          ${sortedCategories
            .map(
              ([cat, amount]) => `
            <div class="category-item">
              <span>${cat}</span>
              <strong>€${amount.toFixed(2)}</strong>
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="section">
          <h2>Progresso de Metas</h2>
          ${goalsProgress
            .map(
              (goal) => `
            <div class="card">
              <p><strong>${goal.name}</strong></p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${goal.progress * 100}%"></div>
              </div>
              <small>€${(goal.progress * 100).toFixed(0)}% | Faltam €${goal.remaining.toFixed(2)}</small>
            </div>
          `,
            )
            .join("")}
        </div>

        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>Este é um resumo automatizado. Faça login na plataforma para mais detalhes.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}
