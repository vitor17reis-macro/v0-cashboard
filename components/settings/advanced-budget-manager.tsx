"use client"

import { useEffect, useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Brain, CheckCircle2, Zap } from "lucide-react"

interface BudgetInsight {
  categoryId: string
  categoryName: string
  currentBudget: number
  recommendedBudget: number
  confidence: number
  reason: string
  savings: number
}

interface SpendingTrend {
  month: string
  spent: number
  budget: number
}

export function AdvancedBudgetManager() {
  const { categories, transactions, getBudgetStatus, updateBudget } = useFinance()
  const [insights, setInsights] = useState<BudgetInsight[]>([])
  const [trends, setTrends] = useState<SpendingTrend[]>([])
  const [acceptedInsights, setAcceptedInsights] = useState<Set<string>>(new Set())

  // Análise de orçamentos dinâmicos baseado em histórico
  useEffect(() => {
    if (!transactions || transactions.length === 0) return

    const expenseCategories = categories.filter((c) => c.type === "expense")
    const newInsights: BudgetInsight[] = []

    // Agrupar transações por categoria e mês
    const categoryMonthData: Record<string, Record<string, number>> = {}

    transactions.forEach((t) => {
      const month = new Date(t.date).toISOString().slice(0, 7)
      if (!categoryMonthData[t.category]) categoryMonthData[t.category] = {}
      categoryMonthData[t.category][month] = (categoryMonthData[t.category][month] || 0) + t.amount
    })

    expenseCategories.forEach((category) => {
      const monthData = categoryMonthData[category.id] || {}
      const monthValues = Object.values(monthData).filter((v) => v > 0)

      if (monthValues.length >= 3) {
        // Calcular média e desvio padrão dos últimos 3 meses
        const avg = monthValues.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, monthValues.length)
        const currentBudget = getBudgetStatus(category.id).limit || 0

        // Se o orçamento está muito longe da realidade, sugerir ajuste
        if (currentBudget > 0 && Math.abs(avg - currentBudget) > currentBudget * 0.2) {
          const recommended = Math.ceil(avg * 1.15) // 15% buffer
          const confidence = Math.min(100, monthValues.length * 25)

          newInsights.push({
            categoryId: category.id,
            categoryName: category.name,
            currentBudget,
            recommendedBudget: recommended,
            confidence,
            reason:
              avg > currentBudget
                ? `Necessita €${(avg - currentBudget).toFixed(2)} extra (histórico mostra ${avg.toFixed(2)}/mês)`
                : `Pode reduzir para €${recommended.toFixed(2)} (gasta em média ${avg.toFixed(2)}/mês)`,
            savings: currentBudget - recommended,
          })
        }
      }
    })

    setInsights(newInsights)
  }, [categories, transactions, getBudgetStatus])

  // Análise de tendências de 6 meses
  useEffect(() => {
    if (!transactions || transactions.length === 0) return

    const monthlyData: Record<string, { spent: number; budgeted: number }> = {}
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    transactions
      .filter((t) => new Date(t.date) >= sixMonthsAgo)
      .forEach((t) => {
        const month = new Date(t.date).toISOString().slice(0, 7)
        if (!monthlyData[month]) monthlyData[month] = { spent: 0, budgeted: 0 }
        monthlyData[month].spent += t.amount
      })

    // Somar orçamentos por mês
    categories.forEach((cat) => {
      const status = getBudgetStatus(cat.id)
      Object.keys(monthlyData).forEach((month) => {
        monthlyData[month].budgeted += status.limit || 0
      })
    })

    const trendData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" }),
        spent: Math.round(data.spent),
        budget: Math.round(data.budgeted),
      }))

    setTrends(trendData)
  }, [transactions, categories, getBudgetStatus])

  const handleAcceptInsight = (insight: BudgetInsight) => {
    updateBudget(insight.categoryId, insight.recommendedBudget)
    setAcceptedInsights((prev) => new Set([...prev, insight.categoryId]))
  }

  const totalPotentialSavings = insights
    .filter((i) => i.savings > 0 && !acceptedInsights.has(i.categoryId))
    .reduce((acc, i) => acc + i.savings, 0)

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      {insights.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Otimização de Orçamentos com IA
                </CardTitle>
                <CardDescription>
                  Recomendações baseadas em {Math.round(trends.length)} meses de histórico
                </CardDescription>
              </div>
              {totalPotentialSavings > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Economizar: €{totalPotentialSavings.toFixed(2)}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Gráfico de Tendências */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Gastos vs Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value}`} />
                <Bar dataKey="spent" fill="#3b82f6" name="Gasto" />
                <Bar dataKey="budget" fill="#10b981" name="Orçamento" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights de Orçamentos */}
      <div className="space-y-3">
        {insights.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p>Seus orçamentos estão bem calibrados com base no histórico</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          insights.map((insight) => (
            <Card key={insight.categoryId} className={acceptedInsights.has(insight.categoryId) ? "opacity-50" : ""}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{insight.categoryName}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.reason}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {insight.confidence.toFixed(0)}% confiança
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Atual</p>
                      <p className="font-bold">€{insight.currentBudget.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <p className="text-xs font-semibold">Recomendado</p>
                      <p className="font-bold">€{insight.recommendedBudget.toFixed(2)}</p>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${insight.savings > 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-orange-500/10 text-orange-700 dark:text-orange-300"}`}
                    >
                      <p className="text-xs font-semibold">Diferença</p>
                      <p className="font-bold">
                        {insight.savings > 0 ? "+" : ""}€{insight.savings.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {!acceptedInsights.has(insight.categoryId) && (
                    <Button size="sm" className="w-full" onClick={() => handleAcceptInsight(insight)}>
                      <Zap className="h-4 w-4 mr-2" />
                      Aplicar Recomendação
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
