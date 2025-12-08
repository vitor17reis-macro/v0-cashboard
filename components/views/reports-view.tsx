"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { useMemo, useState } from "react"
import { format, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const COLORS = ["#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"]

export function ReportsView() {
  const { transactions, accounts, goals, categories } = useFinance()
  const [selectedPeriod, setSelectedPeriod] = useState("year")

  // Safe category name lookup
  const getCategoryName = (categoryId: string | null | undefined): string => {
    if (!categoryId) return "Outros"
    const category = categories?.find((c) => c.id === categoryId)
    return category?.name || "Outros"
  }

  // Calculate yearly data with safety checks
  const yearlyData = useMemo(() => {
    try {
      const now = new Date()
      const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) })

      return months.map((month) => {
        const monthTrans = (transactions || []).filter((t) => {
          const d = new Date(t.date)
          return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
        })

        const income = monthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + (t.amount || 0), 0)
        const expenses = monthTrans.filter((t) => t.type === "expense").reduce((acc, t) => acc + (t.amount || 0), 0)

        return {
          name: format(month, "MMM", { locale: pt }),
          receitas: income,
          despesas: expenses,
        }
      })
    } catch {
      return []
    }
  }, [transactions])

  // Calculate category breakdown with safety checks
  const categoryData = useMemo(() => {
    try {
      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)

      const monthExpenses = (transactions || []).filter((t) => {
        const d = new Date(t.date)
        return t.type === "expense" && d >= start && d <= end
      })

      const totalExpenses = monthExpenses.reduce((acc, t) => acc + (t.amount || 0), 0)
      const byCategory: Record<string, { amount: number; name: string }> = {}

      monthExpenses.forEach((t) => {
        const catId = t.category || "outros"
        const catName = getCategoryName(catId)
        if (!byCategory[catId]) {
          byCategory[catId] = { amount: 0, name: catName }
        }
        byCategory[catId].amount += t.amount || 0
      })

      return Object.entries(byCategory)
        .sort(([, a], [, b]) => b.amount - a.amount)
        .map(([id, data], index) => ({
          id,
          name: data.name,
          value: data.amount,
          color: COLORS[index % COLORS.length],
          percentage: totalExpenses > 0 ? ((data.amount / totalExpenses) * 100).toFixed(1) : "0",
        }))
    } catch {
      return []
    }
  }, [transactions, categories])

  // Calculate trends with safety checks
  const trendData = useMemo(() => {
    try {
      const now = new Date()
      const months = []

      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i)
        const start = startOfMonth(month)
        const end = endOfMonth(month)

        const monthTrans = (transactions || []).filter((t) => {
          const d = new Date(t.date)
          return d >= start && d <= end
        })

        const income = monthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + (t.amount || 0), 0)
        const expenses = monthTrans.filter((t) => t.type === "expense").reduce((acc, t) => acc + (t.amount || 0), 0)

        months.push({
          name: format(month, "MMM", { locale: pt }),
          receitas: income,
          despesas: expenses,
          saldo: income - expenses,
        })
      }

      return months
    } catch {
      return []
    }
  }, [transactions])

  // Calculate KPIs with safety checks
  const kpis = useMemo(() => {
    try {
      const now = new Date()
      const thisMonth = (transactions || []).filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })

      const lastMonth = (transactions || []).filter((t) => {
        const d = new Date(t.date)
        const lastM = subMonths(now, 1)
        return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear()
      })

      const thisIncome = thisMonth.filter((t) => t.type === "income").reduce((acc, t) => acc + (t.amount || 0), 0)
      const thisExpenses = thisMonth.filter((t) => t.type === "expense").reduce((acc, t) => acc + (t.amount || 0), 0)
      const lastIncome = lastMonth.filter((t) => t.type === "income").reduce((acc, t) => acc + (t.amount || 0), 0)
      const lastExpenses = lastMonth.filter((t) => t.type === "expense").reduce((acc, t) => acc + (t.amount || 0), 0)

      const incomeChange = lastIncome > 0 ? ((thisIncome - lastIncome) / lastIncome) * 100 : 0
      const expenseChange = lastExpenses > 0 ? ((thisExpenses - lastExpenses) / lastExpenses) * 100 : 0
      const savingsRate = thisIncome > 0 ? ((thisIncome - thisExpenses) / thisIncome) * 100 : 0

      const totalBalance = (accounts || []).reduce((acc, a) => acc + (a.balance || 0), 0)
      const totalSavings = (accounts || [])
        .filter((a) => a.type === "savings" || a.type === "poupanca")
        .reduce((acc, a) => acc + (a.balance || 0), 0)
      const totalInvestments = (accounts || [])
        .filter((a) => a.type === "investment" || a.type === "investimento")
        .reduce((acc, a) => acc + (a.balance || 0), 0)

      const goalsProgress =
        (goals || []).length > 0
          ? (goals || []).reduce(
              (acc, g) => acc + (g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0),
              0,
            ) / goals.length
          : 0

      return {
        thisIncome,
        thisExpenses,
        incomeChange,
        expenseChange,
        savingsRate,
        totalBalance,
        totalSavings,
        totalInvestments,
        goalsProgress,
        transactionsCount: thisMonth.length,
      }
    } catch {
      return {
        thisIncome: 0,
        thisExpenses: 0,
        incomeChange: 0,
        expenseChange: 0,
        savingsRate: 0,
        totalBalance: 0,
        totalSavings: 0,
        totalInvestments: 0,
        goalsProgress: 0,
        transactionsCount: 0,
      }
    }
  }, [transactions, accounts, goals])

  // Top expenses with safety checks
  const topExpenses = useMemo(() => {
    try {
      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)

      return (transactions || [])
        .filter((t) => {
          const d = new Date(t.date)
          return t.type === "expense" && d >= start && d <= end
        })
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 5)
        .map((t) => ({
          ...t,
          categoryName: getCategoryName(t.category),
        }))
    } catch {
      return []
    }
  }, [transactions, categories])

  // Calculate max values for charts with safety
  const maxYearlyValue = Math.max(...yearlyData.flatMap((d) => [d.receitas, d.despesas]), 1)
  const maxTrendValue = Math.max(...trendData.flatMap((d) => [d.receitas, d.despesas]), 1)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">Análise detalhada da sua saúde financeira</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas do Mês</p>
                <p className="text-2xl font-bold text-emerald-600">{kpis.thisIncome.toFixed(2)} €</p>
              </div>
              <div
                className={`flex items-center gap-1 text-xs ${kpis.incomeChange >= 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                {kpis.incomeChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(kpis.incomeChange).toFixed(1)}%
              </div>
            </div>
            <div className="mt-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas do Mês</p>
                <p className="text-2xl font-bold text-red-500">{kpis.thisExpenses.toFixed(2)} €</p>
              </div>
              <div
                className={`flex items-center gap-1 text-xs ${kpis.expenseChange <= 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                {kpis.expenseChange <= 0 ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                {Math.abs(kpis.expenseChange).toFixed(1)}%
              </div>
            </div>
            <div className="mt-2">
              <CreditCard className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Poupança</p>
                <p className="text-2xl font-bold text-amber-600">{kpis.savingsRate.toFixed(1)}%</p>
              </div>
              <Badge variant={kpis.savingsRate >= 20 ? "default" : "secondary"} className="text-xs">
                {kpis.savingsRate >= 20 ? "Excelente" : kpis.savingsRate >= 10 ? "Bom" : "Melhorar"}
              </Badge>
            </div>
            <div className="mt-2">
              <PiggyBank className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso Metas</p>
                <p className="text-2xl font-bold text-blue-600">{kpis.goalsProgress.toFixed(0)}%</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {(goals || []).length} metas
              </Badge>
            </div>
            <div className="mt-2">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Tendências</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Detalhes</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Evolução Anual</CardTitle>
                <CardDescription>Comparativo mensal de receitas e despesas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {yearlyData.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium w-12">{item.name}</span>
                        <div className="flex gap-4 text-xs">
                          <span className="text-emerald-600">+{item.receitas.toFixed(0)}€</span>
                          <span className="text-red-500">-{item.despesas.toFixed(0)}€</span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-5">
                        <div
                          className="bg-emerald-500 rounded-sm transition-all duration-500"
                          style={{ width: `${(item.receitas / maxYearlyValue) * 50}%` }}
                        />
                        <div
                          className="bg-red-500 rounded-sm transition-all duration-500"
                          style={{ width: `${(item.despesas / maxYearlyValue) * 50}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-muted-foreground">Receitas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-muted-foreground">Despesas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Património</CardTitle>
                <CardDescription>Distribuição atual dos seus ativos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold">{kpis.totalBalance.toFixed(2)} €</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <PiggyBank className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Poupança</p>
                      <p className="font-bold text-amber-600">{kpis.totalSavings.toFixed(2)} €</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {kpis.totalBalance > 0 ? ((kpis.totalSavings / kpis.totalBalance) * 100).toFixed(0) : 0}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Investimentos</p>
                      <p className="font-bold text-blue-600">{kpis.totalInvestments.toFixed(2)} €</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {kpis.totalBalance > 0 ? ((kpis.totalInvestments / kpis.totalBalance) * 100).toFixed(0) : 0}%
                  </Badge>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Transações este mês</p>
                  <p className="text-2xl font-bold">{kpis.transactionsCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tendência dos Últimos 6 Meses</CardTitle>
              <CardDescription>Evolução das receitas, despesas e saldo líquido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendData.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-sm font-bold ${item.saldo >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {item.saldo >= 0 ? "+" : ""}
                        {item.saldo.toFixed(0)} €
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Receitas: {item.receitas.toFixed(0)} €</div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.receitas / maxTrendValue) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Despesas: {item.despesas.toFixed(0)} €</div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.despesas / maxTrendValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
              <CardDescription>Distribuição das despesas deste mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryData.length > 0 ? (
                  categoryData.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.value.toFixed(2)} €</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {item.percentage}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem despesas registadas este mês</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 5 Maiores Despesas</CardTitle>
                <CardDescription>Transações de maior valor este mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topExpenses.length > 0 ? (
                    topExpenses.map((expense, index) => (
                      <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {expense.categoryName} • {format(new Date(expense.date), "d MMM", { locale: pt })}
                          </p>
                        </div>
                        <p className="font-bold text-red-500">{expense.amount.toFixed(2)} €</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Sem despesas registadas este mês</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso das Metas</CardTitle>
                <CardDescription>Estado atual de cada objetivo financeiro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(goals || []).length > 0 ? (
                    (goals || []).map((goal) => {
                      const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{goal.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {goal.current_amount.toFixed(2)} € / {goal.target_amount.toFixed(2)} €
                            </span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{progress.toFixed(1)}% concluído</span>
                            <span>Faltam {Math.max(goal.target_amount - goal.current_amount, 0).toFixed(2)} €</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma meta definida</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
