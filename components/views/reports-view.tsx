"use client"

import { useFinance } from "@/components/providers/finance-provider"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { useMemo, useState } from "react"
import { eachMonthOfInterval, format, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth } from "date-fns"
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
  PieChartIcon,
  LineChartIcon,
  Download,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const COLORS = {
  income: "#22c55e",
  expense: "#ef4444",
  investment: "#3b82f6",
  savings: "#f59e0b",
  primary: "#14b8a6",
  categories: ["#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"],
}

export function ReportsView() {
  const { transactions, accounts, goals } = useFinance()
  const [period, setPeriod] = useState("year")

  // Calculate yearly data
  const yearlyData = useMemo(() => {
    const now = new Date()
    const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) })

    return months.map((month) => {
      const monthTrans = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
      })

      const income = monthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
      const expenses = monthTrans.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)

      return {
        name: format(month, "MMM", { locale: pt }),
        fullName: format(month, "MMMM", { locale: pt }),
        Receitas: income,
        Despesas: expenses,
        Poupança: income - expenses,
        Investimentos: monthTrans.filter((t) => t.type === "investment").reduce((acc, t) => acc + t.amount, 0),
      }
    })
  }, [transactions])

  // Calculate category breakdown for current month
  const categoryData = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    const monthExpenses = transactions.filter((t) => {
      const d = new Date(t.date)
      return t.type === "expense" && d >= start && d <= end
    })

    const totalExpenses = monthExpenses.reduce((acc, t) => acc + t.amount, 0)
    const byCategory: Record<string, number> = {}
    monthExpenses.forEach((t) => {
      const cat = t.category || "Outros"
      byCategory[cat] = (byCategory[cat] || 0) + t.amount
    })

    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS.categories[index % COLORS.categories.length],
        percentage: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : "0",
      }))
  }, [transactions])

  // Calculate trends (last 6 months)
  const trendData = useMemo(() => {
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i)
      const start = startOfMonth(month)
      const end = endOfMonth(month)

      const monthTrans = transactions.filter((t) => {
        const d = new Date(t.date)
        return d >= start && d <= end
      })

      const income = monthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
      const expenses = monthTrans.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)

      months.push({
        name: format(month, "MMM", { locale: pt }),
        Receitas: income,
        Despesas: expenses,
        Saldo: income - expenses,
      })
    }

    return months
  }, [transactions])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date()
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const lastMonth = transactions.filter((t) => {
      const d = new Date(t.date)
      const lastM = subMonths(now, 1)
      return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear()
    })

    const thisIncome = thisMonth.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
    const thisExpenses = thisMonth.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
    const lastIncome = lastMonth.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
    const lastExpenses = lastMonth.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)

    const incomeChange = lastIncome > 0 ? ((thisIncome - lastIncome) / lastIncome) * 100 : 0
    const expenseChange = lastExpenses > 0 ? ((thisExpenses - lastExpenses) / lastExpenses) * 100 : 0
    const savingsRate = thisIncome > 0 ? ((thisIncome - thisExpenses) / thisIncome) * 100 : 0

    const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0)
    const totalSavings = accounts
      .filter((a) => a.type === "savings" || a.type === "poupanca")
      .reduce((acc, a) => acc + (a.balance || 0), 0)
    const totalInvestments = accounts
      .filter((a) => a.type === "investment" || a.type === "investimento")
      .reduce((acc, a) => acc + (a.balance || 0), 0)

    const goalsProgress =
      goals.length > 0
        ? goals.reduce((acc, g) => acc + (g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0), 0) /
          goals.length
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
  }, [transactions, accounts, goals])

  // Top expenses
  const topExpenses = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    return transactions
      .filter((t) => {
        const d = new Date(t.date)
        return t.type === "expense" && d >= start && d <= end
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [transactions])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: €{entry.value?.toFixed(2) || "0.00"}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">Análise detalhada da sua saúde financeira</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
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
                <p className="text-2xl font-bold text-emerald-500">€{kpis.thisIncome.toFixed(2)}</p>
              </div>
              <div
                className={`flex items-center gap-1 text-xs ${kpis.incomeChange >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {kpis.incomeChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(kpis.incomeChange).toFixed(1)}%
              </div>
            </div>
            <div className="mt-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas do Mês</p>
                <p className="text-2xl font-bold text-red-500">€{kpis.thisExpenses.toFixed(2)}</p>
              </div>
              <div
                className={`flex items-center gap-1 text-xs ${kpis.expenseChange <= 0 ? "text-emerald-500" : "text-red-500"}`}
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
                <p className="text-2xl font-bold text-amber-500">{kpis.savingsRate.toFixed(1)}%</p>
              </div>
              <Badge variant={kpis.savingsRate >= 20 ? "default" : "secondary"} className="text-xs">
                {kpis.savingsRate >= 20 ? "Excelente" : kpis.savingsRate >= 10 ? "Bom" : "Melhorar"}
              </Badge>
            </div>
            <div className="mt-2">
              <PiggyBank className="h-4 w-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso Metas</p>
                <p className="text-2xl font-bold text-blue-500">{kpis.goalsProgress.toFixed(0)}%</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {goals.length} metas
              </Badge>
            </div>
            <div className="mt-2">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Tendências</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
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
                <CardDescription>Comparativo mensal de receitas, despesas e investimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(val) => `€${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Receitas" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Despesas" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Investimentos" fill={COLORS.investment} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Património</CardTitle>
                <CardDescription>Distribuição atual dos seus ativos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold">€{kpis.totalBalance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <PiggyBank className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Poupança</p>
                        <p className="font-bold text-amber-500">€{kpis.totalSavings.toFixed(2)}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {kpis.totalBalance > 0 ? ((kpis.totalSavings / kpis.totalBalance) * 100).toFixed(0) : 0}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Investimentos</p>
                        <p className="font-bold text-blue-500">€{kpis.totalInvestments.toFixed(2)}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {kpis.totalBalance > 0 ? ((kpis.totalInvestments / kpis.totalBalance) * 100).toFixed(0) : 0}%
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Transações este mês</p>
                  <p className="text-3xl font-bold">{kpis.transactionsCount}</p>
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
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(val) => `€${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Receitas"
                      stroke={COLORS.income}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Despesas"
                      stroke={COLORS.expense}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição das despesas deste mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Sem despesas registadas este mês
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ranking de Categorias</CardTitle>
                <CardDescription>Ordenado por valor gasto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData.map((cat, index) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: cat.color + "20", color: cat.color }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-sm text-muted-foreground">€{cat.value.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {cat.percentage}%
                      </Badge>
                    </div>
                  ))}
                  {categoryData.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Sem despesas registadas este mês</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
                  {topExpenses.map((expense, index) => (
                    <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.category} • {format(new Date(expense.date), "d MMM", { locale: pt })}
                        </p>
                      </div>
                      <p className="font-bold text-red-500">€{expense.amount.toFixed(2)}</p>
                    </div>
                  ))}
                  {topExpenses.length === 0 && (
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
                  {goals.map((goal) => {
                    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-sm text-muted-foreground">
                            €{goal.current_amount.toFixed(2)} / €{goal.target_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(1)}% concluído</span>
                          <span>Faltam €{(goal.target_amount - goal.current_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {goals.length === 0 && (
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
