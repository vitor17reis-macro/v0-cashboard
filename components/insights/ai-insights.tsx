"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval, differenceInDays } from "date-fns"

interface Insight {
  id: string
  type: "positive" | "warning" | "tip" | "achievement"
  title: string
  description: string
  value?: string
  change?: number
  icon: React.ReactNode
}

export function AIInsights() {
  const { transactions, categories, goals, accounts, getSummary } = useFinance()
  const { formatCurrency } = useCurrency()
  const [showAll, setShowAll] = useState(false)

  const insights = useMemo(() => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const thisMonthTx = transactions.filter((t) => {
      const date = parseISO(t.date)
      return isWithinInterval(date, { start: thisMonthStart, end: thisMonthEnd })
    })

    const lastMonthTx = transactions.filter((t) => {
      const date = parseISO(t.date)
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd })
    })

    const result: Insight[] = []

    // 1. Compare spending by category
    const categorySpending: Record<string, { this: number; last: number }> = {}

    thisMonthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (!categorySpending[t.category]) {
          categorySpending[t.category] = { this: 0, last: 0 }
        }
        categorySpending[t.category].this += t.amount
      })

    lastMonthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (!categorySpending[t.category]) {
          categorySpending[t.category] = { this: 0, last: 0 }
        }
        categorySpending[t.category].last += t.amount
      })

    // Find biggest increase/decrease
    Object.entries(categorySpending).forEach(([catId, spending]) => {
      if (spending.last > 0) {
        const change = ((spending.this - spending.last) / spending.last) * 100
        const category = categories.find((c) => c.id === catId || c.name === catId)
        const categoryName = category?.name || catId

        if (change > 30 && spending.this > 50) {
          result.push({
            id: `cat-increase-${catId}`,
            type: "warning",
            title: `Aumento em ${categoryName}`,
            description: `Gastaste ${change.toFixed(0)}% mais em ${categoryName} este mês comparado ao mês anterior.`,
            value: formatCurrency(spending.this),
            change: change,
            icon: <TrendingUp className="h-5 w-5" />,
          })
        } else if (change < -20 && spending.last > 50) {
          result.push({
            id: `cat-decrease-${catId}`,
            type: "positive",
            title: `Poupaste em ${categoryName}`,
            description: `Reduziste ${Math.abs(change).toFixed(0)}% em ${categoryName}. Continua assim!`,
            value: formatCurrency(spending.last - spending.this),
            change: change,
            icon: <TrendingDown className="h-5 w-5" />,
          })
        }
      }
    })

    // 2. Savings Rate Analysis
    const thisMonthIncome = thisMonthTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const thisMonthExpense = thisMonthTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const savingsRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100 : 0

    if (savingsRate >= 20) {
      result.push({
        id: "savings-good",
        type: "achievement",
        title: "Taxa de Poupança Excelente",
        description: `Estás a poupar ${savingsRate.toFixed(0)}% do teu rendimento. A regra dos 50/30/20 recomenda 20%!`,
        value: `${savingsRate.toFixed(0)}%`,
        icon: <PiggyBank className="h-5 w-5" />,
      })
    } else if (savingsRate < 10 && thisMonthIncome > 0) {
      result.push({
        id: "savings-low",
        type: "warning",
        title: "Taxa de Poupança Baixa",
        description: `Estás a poupar apenas ${savingsRate.toFixed(0)}% do rendimento. Tenta reduzir despesas não essenciais.`,
        value: `${savingsRate.toFixed(0)}%`,
        icon: <AlertTriangle className="h-5 w-5" />,
      })
    }

    // 3. Goal Progress
    goals.forEach((goal) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100

      if (progress >= 90 && progress < 100) {
        result.push({
          id: `goal-almost-${goal.id}`,
          type: "positive",
          title: `Quase lá: ${goal.name}`,
          description: `Faltam apenas ${formatCurrency(goal.targetAmount - goal.currentAmount)} para atingires a tua meta!`,
          value: `${progress.toFixed(0)}%`,
          icon: <Target className="h-5 w-5" />,
        })
      } else if (progress >= 100) {
        result.push({
          id: `goal-complete-${goal.id}`,
          type: "achievement",
          title: `Meta Atingida: ${goal.name}`,
          description: `Parabéns! Conseguiste atingir a tua meta de ${formatCurrency(goal.targetAmount)}!`,
          value: formatCurrency(goal.currentAmount),
          icon: <Sparkles className="h-5 w-5" />,
        })
      }

      // Deadline warning
      if (goal.deadline && progress < 100) {
        const daysLeft = differenceInDays(parseISO(goal.deadline), now)
        if (daysLeft <= 30 && daysLeft > 0 && progress < 80) {
          const remaining = goal.targetAmount - goal.currentAmount
          const dailyNeeded = remaining / daysLeft
          result.push({
            id: `goal-deadline-${goal.id}`,
            type: "tip",
            title: `Acelera: ${goal.name}`,
            description: `Faltam ${daysLeft} dias para o prazo. Precisas de poupar ${formatCurrency(dailyNeeded)}/dia para atingir a meta.`,
            icon: <Lightbulb className="h-5 w-5" />,
          })
        }
      }
    })

    // 4. Smart Tips based on patterns
    const subscriptionExpense = thisMonthTx
      .filter((t) => t.type === "expense" && (t.category === "subscriptions" || t.isRecurring))
      .reduce((sum, t) => sum + t.amount, 0)

    if (subscriptionExpense > thisMonthIncome * 0.1 && thisMonthIncome > 0) {
      result.push({
        id: "subscriptions-high",
        type: "tip",
        title: "Subscrições Elevadas",
        description: `Gastas ${formatCurrency(subscriptionExpense)} em subscrições (${((subscriptionExpense / thisMonthIncome) * 100).toFixed(0)}% do rendimento). Revê se precisas de todas.`,
        value: formatCurrency(subscriptionExpense),
        icon: <Lightbulb className="h-5 w-5" />,
      })
    }

    // 5. Emergency Fund Status
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
    const avgMonthlyExpense =
      thisMonthExpense || lastMonthTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const emergencyMonths = avgMonthlyExpense > 0 ? totalBalance / avgMonthlyExpense : 0

    if (emergencyMonths >= 6) {
      result.push({
        id: "emergency-good",
        type: "achievement",
        title: "Fundo de Emergência Sólido",
        description: `Tens ${emergencyMonths.toFixed(1)} meses de despesas em reserva. Excelente segurança financeira!`,
        value: `${emergencyMonths.toFixed(1)} meses`,
        icon: <PiggyBank className="h-5 w-5" />,
      })
    } else if (emergencyMonths < 3 && avgMonthlyExpense > 0) {
      result.push({
        id: "emergency-low",
        type: "warning",
        title: "Fundo de Emergência Baixo",
        description: `Tens apenas ${emergencyMonths.toFixed(1)} meses de reserva. O ideal são 3-6 meses de despesas.`,
        value: `${emergencyMonths.toFixed(1)} meses`,
        icon: <AlertTriangle className="h-5 w-5" />,
      })
    }

    // 6. Income growth
    const lastMonthIncome = lastMonthTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    if (lastMonthIncome > 0 && thisMonthIncome > lastMonthIncome * 1.1) {
      const incomeGrowth = ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100
      result.push({
        id: "income-growth",
        type: "positive",
        title: "Rendimento em Crescimento",
        description: `Os teus rendimentos aumentaram ${incomeGrowth.toFixed(0)}% este mês. Boa altura para aumentar poupanças!`,
        value: formatCurrency(thisMonthIncome - lastMonthIncome),
        change: incomeGrowth,
        icon: <ArrowUpRight className="h-5 w-5" />,
      })
    }

    return result
  }, [transactions, categories, goals, accounts, formatCurrency])

  const getTypeStyles = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "border-l-emerald-500 bg-emerald-500/5"
      case "warning":
        return "border-l-amber-500 bg-amber-500/5"
      case "tip":
        return "border-l-blue-500 bg-blue-500/5"
      case "achievement":
        return "border-l-purple-500 bg-purple-500/5"
    }
  }

  const getIconStyles = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "text-emerald-500 bg-emerald-500/10"
      case "warning":
        return "text-amber-500 bg-amber-500/10"
      case "tip":
        return "text-blue-500 bg-blue-500/10"
      case "achievement":
        return "text-purple-500 bg-purple-500/10"
    }
  }

  const getBadgeVariant = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "default"
      case "warning":
        return "destructive"
      case "tip":
        return "secondary"
      case "achievement":
        return "outline"
    }
  }

  const displayedInsights = showAll ? insights : insights.slice(0, 4)

  if (insights.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Sem Insights Disponíveis</h3>
          <p className="text-muted-foreground max-w-sm">
            Adiciona mais transações para receber insights personalizados sobre os teus hábitos financeiros.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-serif font-bold">Insights Inteligentes</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          <span>{insights.length}</span>
          <span className="hidden sm:inline">sugestões</span>
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {displayedInsights.map((insight, index) => (
          <Card
            key={insight.id}
            className={`border-l-4 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 ${getTypeStyles(insight.type)}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className={`p-2.5 rounded-xl h-fit ${getIconStyles(insight.type)}`}>{insight.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {insight.value && <span className="text-sm font-bold whitespace-nowrap">{insight.value}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                  {insight.change !== undefined && (
                    <div className="flex items-center gap-1 mt-2">
                      {insight.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-red-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${insight.change > 0 ? "text-red-500" : "text-emerald-500"}`}
                      >
                        {Math.abs(insight.change).toFixed(0)}% vs mês anterior
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {insights.length > 4 && (
        <Button variant="ghost" className="w-full group" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Mostrar Menos" : `Ver Mais ${insights.length - 4} Insights`}
          <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showAll ? "rotate-90" : ""}`} />
        </Button>
      )}
    </div>
  )
}
