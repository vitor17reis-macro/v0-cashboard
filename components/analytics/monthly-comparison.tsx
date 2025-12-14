"use client"

import { useMemo, useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingUp,
  Zap,
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns"
import { pt } from "date-fns/locale"
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts"

const CHART_COLORS = {
  income: "#34d399",
  expense: "#f87171",
  savings: "#fbbf24",
  investment: "#60a5fa",
}

export function MonthlyComparison() {
  const { transactions, categories, accounts = [] } = useFinance()
  const { formatCurrency } = useCurrency()
  const [monthOffset, setMonthOffset] = useState(0)
  const [viewMode, setViewMode] = useState<"comparison" | "trends" | "insights">("comparison")

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

    const calculate = (txs: typeof transactions) => ({
      income: txs.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
      expense: txs.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    })

    const current = calculate(currentTx)
    const previous = calculate(previousTx)

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

  const advancedAnalysis = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i)
      const start = startOfMonth(month)
      const end = endOfMonth(month)

      const monthTx = transactions.filter((t) => {
        const date = parseISO(t.date)
        return isWithinInterval(date, { start, end })
      })

      const income = monthTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      const expense = monthTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
      const savings = income - expense

      return {
        month: format(month, "MMM", { locale: pt }),
        income,
        expense,
        savings,
        savingsRate: income > 0 ? (savings / income) * 100 : 0,
      }
    })

    const avgIncome = last6Months.reduce((sum, m) => sum + m.income, 0) / 6
    const avgExpense = last6Months.reduce((sum, m) => sum + m.expense, 0) / 6
    const avgSavings = last6Months.reduce((sum, m) => sum + m.savings, 0) / 6

    const incomeTrend = last6Months[5].income - last6Months[0].income
    const expenseTrend = last6Months[5].expense - last6Months[0].expense

    const savingsRate = last6Months[5].savingsRate
    const healthScore = Math.min(100, Math.max(0, 50 + savingsRate * 10))

    return {
      last6Months,
      avgIncome,
      avgExpense,
      avgSavings,
      incomeTrend,
      expenseTrend,
      savingsRate,
      healthScore,
      forecast: Array.from({ length: 3 }, (_, i) => ({
        month: format(subMonths(new Date(), -i - 1), "MMM", { locale: pt }),
        income: avgIncome,
        expense: avgExpense,
        savings: avgSavings,
      })),
    }
  }, [transactions])

  const recurringAnalysis = useMemo(() => {
    // Find transactions that repeat on similar dates across months
    const txByDateAndAmount: Record<string, Array<{ date: string; amount: number; category: string }>> = {}

    transactions.forEach((tx) => {
      const date = parseISO(tx.date)
      const dayOfMonth = date.getDate()
      const key = `${dayOfMonth}-${Math.round(tx.amount / 10)}-${tx.category}`

      if (!txByDateAndAmount[key]) txByDateAndAmount[key] = []
      txByDateAndAmount[key].push({ date: tx.date, amount: tx.amount, category: tx.category })
    })

    // Filter to only recurring transactions (appear 3+ times)
    const recurring = Object.entries(txByDateAndAmount)
      .filter(([, txs]) => txs.length >= 3)
      .map(([key, txs]) => {
        const category = categories.find((c) => c.id === txs[0].category || c.name === txs[0].category)
        const avgAmount = txs.reduce((sum, t) => sum + t.amount, 0) / txs.length
        return {
          key,
          name: category?.name || txs[0].category,
          amount: avgAmount,
          frequency: txs.length,
          confidence: Math.min(100, txs.length * 20),
          color: category?.color || "#888",
        }
      })
      .sort((a, b) => b.amount - a.amount)

    return recurring
  }, [transactions, categories])

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
          <h3 className="text-2xl font-serif font-bold gradient-text">Comparação Mensal</h3>
          <p className="text-sm text-muted-foreground">
            {comparisonData.previousMonth} vs {comparisonData.currentMonth}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthOffset((prev) => prev + 1)}
            className="h-8 w-8 hover-lift"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthOffset(0)}
            disabled={monthOffset === 0}
            className="hover-lift"
          >
            Atual
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
            disabled={monthOffset === 0}
            className="h-8 w-8 hover-lift"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs for different analysis views */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-600/5 border-emerald-500/30 hover-lift shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/30">
                    <PiggyBank className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground/80">Total em Poupança</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">{formatCurrency(totalSavings)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Saldo atual das contas poupança</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-blue-600/5 border-cyan-500/30 hover-lift shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-cyan-500/20 flex items-center justify-center ring-1 ring-cyan-500/30">
                    <TrendingUp className="h-7 w-7 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground/80">Total Investido</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-1">{formatCurrency(totalInvestments)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Saldo atual das contas investimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border-purple-500/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wide">Saldo do Mês</p>
                  <p
                    className={`text-4xl font-bold mt-3 ${(comparisonData.current.income - comparisonData.current.expense) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {formatCurrency(comparisonData.current.income - comparisonData.current.expense)}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    Mês anterior: {formatCurrency(comparisonData.previous.income - comparisonData.previous.expense)}
                  </p>
                </div>
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-full ${balanceChange.color} bg-opacity-10`}
                >
                  {balanceChange.icon}
                  <span className="font-bold text-lg mt-1">{Math.abs(balanceChange.change).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {summaryCards.map((card) => {
              const change = getChangeIndicator(card.current, card.previous, card.inverse)
              return (
                <Card
                  key={card.label}
                  className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md border-border/50 hover-lift shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-medium text-muted-foreground/80">{card.label}</p>
                      <div
                        className={`flex items-center gap-1 text-xs font-semibold ${change.color} bg-opacity-10 px-2 py-1 rounded-md`}
                      >
                        {change.icon}
                        <span>{Math.abs(change.change).toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${card.color}`}>{formatCurrency(card.current)}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">vs {formatCurrency(card.previous)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-md border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Comparativo Visual</CardTitle>
              <CardDescription className="text-muted-foreground/70">Receitas e despesas lado a lado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#a8a29e" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a8a29e" }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1c1917cc",
                        border: "1px solid #44403c",
                        borderRadius: "12px",
                        backdropFilter: "blur(24px)",
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
                    <Bar dataKey="Receitas" fill={CHART_COLORS.income} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Despesas" fill={CHART_COLORS.expense} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

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
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div>
            <h3 className="text-xl font-serif font-bold">Tendências (Últimos 6 Meses)</h3>
            <p className="text-sm text-muted-foreground">Evolução das receitas, despesas e poupança</p>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Evolução Mensal</CardTitle>
              <CardDescription className="text-muted-foreground">Linha do tempo das suas finanças</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={advancedAnalysis.last6Months}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280" }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke={CHART_COLORS.income}
                      strokeWidth={2}
                      name="Receitas"
                      dot={{ fill: CHART_COLORS.income }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke={CHART_COLORS.expense}
                      strokeWidth={2}
                      name="Despesas"
                      dot={{ fill: CHART_COLORS.expense }}
                    />
                    <Bar dataKey="savings" fill={CHART_COLORS.savings} radius={[4, 4, 0, 0]} name="Poupança" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Receita Média</p>
                <p className="text-2xl font-bold text-green-500 mt-1">{formatCurrency(advancedAnalysis.avgIncome)}</p>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {advancedAnalysis.incomeTrend > 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">+{advancedAnalysis.incomeTrend.toFixed(0)}€</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">{Math.abs(advancedAnalysis.incomeTrend).toFixed(0)}€</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Despesa Média</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(advancedAnalysis.avgExpense)}</p>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {advancedAnalysis.expenseTrend < 0 ? (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">{Math.abs(advancedAnalysis.expenseTrend).toFixed(0)}€</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">+{advancedAnalysis.expenseTrend.toFixed(0)}€</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Poupança Média</p>
                <p className="text-2xl font-bold text-blue-500 mt-1">{formatCurrency(advancedAnalysis.avgSavings)}</p>
                <p className="text-xs text-muted-foreground mt-2">Taxa: {advancedAnalysis.savingsRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div>
            <h3 className="text-xl font-serif font-bold">Insights e Previsões</h3>
            <p className="text-sm text-muted-foreground">Análise da saúde financeira e projeções futuras</p>
          </div>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saúde Financeira</p>
                  <p className="text-4xl font-bold mt-2">{advancedAnalysis.healthScore.toFixed(0)}/100</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {advancedAnalysis.healthScore >= 75
                      ? "Excelente! Continue assim."
                      : advancedAnalysis.healthScore >= 50
                        ? "Bom. Há espaço para melhorias."
                        : "Precisa atenção. Reduza despesas."}
                  </p>
                </div>
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Zap
                        className={`h-8 w-8 mx-auto mb-1 ${advancedAnalysis.healthScore >= 75 ? "text-emerald-500" : advancedAnalysis.healthScore >= 50 ? "text-yellow-500" : "text-red-500"}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Previsão (Próximos 3 Meses)</CardTitle>
              <CardDescription>Baseado nas tendências dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...advancedAnalysis.last6Months.slice(-2), ...advancedAnalysis.forecast]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280" }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      fill={CHART_COLORS.income}
                      radius={[4, 4, 0, 0]}
                      name="Receita Proj."
                      opacity={0.5}
                    />
                    <Bar
                      dataKey="expense"
                      fill={CHART_COLORS.expense}
                      radius={[4, 4, 0, 0]}
                      name="Despesa Proj."
                      opacity={0.5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
