"use client"

import { useMemo, useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Minus, ArrowUpRight, ArrowDownRight, PiggyBank, TrendingUp } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns"
import { pt } from "date-fns/locale"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const CHART_COLORS = {
  income: "#22c55e", // green-500
  expense: "#ef4444", // red-500
  savings: "#f97316", // orange-500
  investment: "#3b82f6", // blue-500
}

export function MonthlyComparison() {
  const { transactions, categories, accounts = [] } = useFinance()
  const { formatCurrency } = useCurrency()
  const [monthOffset, setMonthOffset] = useState(0)

  const totalSavings = accounts.filter((a) => a.type === "savings").reduce((sum, a) => sum + a.balance, 0)
  const totalInvestments = accounts.filter((a) => a.type === "investment").reduce((sum, a) => sum + a.balance, 0)

  const comparisonData = useMemo(() => {
    const currentMonth = subMonths(new Date(), monthOffset)
    const previousMonth = subMonths(currentMonth, 1)

    const currentStart = startOfMonth(currentMonth)
    const currentEnd = endOfMonth(currentMonth)
    const previousStart = startOfMonth(previousMonth)
    const previousEnd = endOfMonth(previousMonth)

    const currentTx = transactions.filter((t) => {
      const date = parseISO(t.date)
      return isWithinInterval(date, { start: currentStart, end: currentEnd })
    })

    const previousTx = transactions.filter((t) => {
      const date = parseISO(t.date)
      return isWithinInterval(date, { start: previousStart, end: previousEnd })
    })

    // Calculate totals from transactions for income/expense only
    const calculate = (txs: typeof transactions) => ({
      income: txs.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
      expense: txs.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    })

    const current = calculate(currentTx)
    const previous = calculate(previousTx)

    // Category breakdown
    const categoryBreakdown: Record<string, { current: number; previous: number; name: string; color: string }> = {}

    currentTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (!categoryBreakdown[t.category]) {
          const cat = categories.find((c) => c.id === t.category || c.name === t.category)
          categoryBreakdown[t.category] = {
            current: 0,
            previous: 0,
            name: cat?.name || t.category,
            color: cat?.color || "#888",
          }
        }
        categoryBreakdown[t.category].current += t.amount
      })

    previousTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (!categoryBreakdown[t.category]) {
          const cat = categories.find((c) => c.id === t.category || c.name === t.category)
          categoryBreakdown[t.category] = {
            current: 0,
            previous: 0,
            name: cat?.name || t.category,
            color: cat?.color || "#888",
          }
        }
        categoryBreakdown[t.category].previous += t.amount
      })

    return {
      currentMonth: format(currentMonth, "MMMM yyyy", { locale: pt }),
      previousMonth: format(previousMonth, "MMMM yyyy", { locale: pt }),
      current,
      previous,
      categoryBreakdown: Object.entries(categoryBreakdown)
        .map(([id, data]) => ({
          id,
          ...data,
          change: data.previous > 0 ? ((data.current - data.previous) / data.previous) * 100 : 0,
        }))
        .sort((a, b) => b.current - a.current),
    }
  }, [transactions, categories, monthOffset])

  const getChangeIndicator = (current: number, previous: number, inverse = false) => {
    if (previous === 0) return { icon: <Minus className="h-4 w-4" />, color: "text-muted-foreground", change: 0 }

    const change = ((current - previous) / previous) * 100
    const isPositive = inverse ? change < 0 : change > 0

    return {
      icon: change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />,
      color: isPositive ? "text-emerald-500" : "text-red-500",
      change,
    }
  }

  const summaryCards = [
    {
      label: "Receitas",
      current: comparisonData.current.income,
      previous: comparisonData.previous.income,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      inverse: false,
    },
    {
      label: "Despesas",
      current: comparisonData.current.expense,
      previous: comparisonData.previous.expense,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      inverse: true,
    },
  ]

  const chartData = [
    {
      name: comparisonData.previousMonth.split(" ")[0],
      Receitas: comparisonData.previous.income,
      Despesas: comparisonData.previous.expense,
    },
    {
      name: comparisonData.currentMonth.split(" ")[0],
      Receitas: comparisonData.current.income,
      Despesas: comparisonData.current.expense,
    },
  ]

  const currentBalance = comparisonData.current.income - comparisonData.current.expense
  const previousBalance = comparisonData.previous.income - comparisonData.previous.expense
  const balanceChange = getChangeIndicator(currentBalance, previousBalance)

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif font-bold">Comparação Mensal</h3>
          <p className="text-sm text-muted-foreground">
            {comparisonData.previousMonth} vs {comparisonData.currentMonth}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonthOffset((prev) => prev + 1)} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonthOffset(0)} disabled={monthOffset === 0}>
            Atual
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
            disabled={monthOffset === 0}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Poupança</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSavings)}</p>
                <p className="text-xs text-muted-foreground">Saldo atual das contas poupança</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInvestments)}</p>
                <p className="text-xs text-muted-foreground">Saldo atual das contas investimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo do Mês</p>
              <p className={`text-3xl font-bold ${currentBalance >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(currentBalance)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Mês anterior: {formatCurrency(previousBalance)}</p>
            </div>
            <div className={`flex items-center gap-1 ${balanceChange.color}`}>
              {balanceChange.icon}
              <span className="font-bold">{Math.abs(balanceChange.change).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {summaryCards.map((card) => {
          const change = getChangeIndicator(card.current, card.previous, card.inverse)
          return (
            <Card key={card.label} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <div className={`flex items-center gap-0.5 text-xs ${change.color}`}>
                    {change.icon}
                    <span>{Math.abs(change.change).toFixed(0)}%</span>
                  </div>
                </div>
                <p className={`text-xl font-bold ${card.color}`}>{formatCurrency(card.current)}</p>
                <p className="text-xs text-muted-foreground mt-1">vs {formatCurrency(card.previous)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Comparison Chart */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Comparativo Visual</CardTitle>
          <CardDescription>Receitas e despesas lado a lado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: value === "Receitas" ? CHART_COLORS.income : CHART_COLORS.expense }}>
                      {value}
                    </span>
                  )}
                />
                <Bar dataKey="Receitas" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          <CardDescription>Comparação detalhada entre os dois meses</CardDescription>
        </CardHeader>
        <CardContent>
          {comparisonData.categoryBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Sem dados de despesas para comparar.</div>
          ) : (
            <div className="space-y-4">
              {comparisonData.categoryBreakdown.slice(0, 8).map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{formatCurrency(cat.previous)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-bold">{formatCurrency(cat.current)}</span>
                      {cat.previous > 0 && (
                        <Badge
                          variant={cat.change > 0 ? "destructive" : "default"}
                          className={`text-xs ${
                            cat.change > 0
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}
                        >
                          {cat.change > 0 ? "+" : ""}
                          {cat.change.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div
                      className="rounded-l-full opacity-50"
                      style={{
                        backgroundColor: cat.color,
                        width: `${Math.min(50, (cat.previous / Math.max(cat.current, cat.previous, 1)) * 50)}%`,
                      }}
                    />
                    <div
                      className="rounded-r-full"
                      style={{
                        backgroundColor: cat.color,
                        width: `${Math.min(50, (cat.current / Math.max(cat.current, cat.previous, 1)) * 50)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
