"use client"

import { useState, useMemo } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Line,
  RadialBarChart,
  RadialBar,
} from "recharts"
import { format, parseISO, startOfDay, eachDayOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from "date-fns"
import { pt } from "date-fns/locale"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, PiggyBankIcon } from "lucide-react"

// Colors matching our theme
const COLORS = {
  income: "#10b981",
  expense: "#ef4444",
  investment: "#3b82f6",
  savings: "#f59e0b",
  text: "#888888",
  grid: "#e5e7eb",
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[150px]">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-mono font-medium">
              {entry.value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function OverviewCharts() {
  const { filteredTransactions, transactions, period, categories, getSummary } = useFinance()
  const [activeTab, setActiveTab] = useState("balance")
  const summary = getSummary()

  // 1. Balance Evolution Data
  const balanceData = useMemo(() => {
    if (transactions.length === 0) return []

    const now = new Date()
    let dateRange
    let formatStr = "dd/MM"
    let isMonthly = false

    if (period === "year") {
      dateRange = eachMonthOfInterval({ start: startOfDay(new Date(now.getFullYear(), 0, 1)), end: now })
      formatStr = "MMM"
      isMonthly = true
    } else {
      const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (sorted.length === 0) return []

      const startDate = parseISO(sorted[0].date)
      const endDate = parseISO(sorted[sorted.length - 1].date)

      dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    }

    const startDate = dateRange[0]
    const startingBalance = transactions
      .filter((t) => new Date(t.date) < startDate)
      .reduce((acc, t) => {
        if (t.type === "income") return acc + t.amount
        if (t.type === "expense") return acc - t.amount
        if (t.type === "investment") return acc - t.amount
        if (t.type === "savings") return acc - t.amount
        return acc
      }, 0)

    let currentBalance = startingBalance

    return dateRange.map((date) => {
      const dayTransactions = transactions.filter((t) =>
        isMonthly ? isSameMonth(parseISO(t.date), date) : isSameDay(parseISO(t.date), date),
      )

      const dailyChange = dayTransactions.reduce((acc, t) => {
        if (t.type === "income") return acc + t.amount
        return acc - t.amount
      }, 0)

      currentBalance += dailyChange

      return {
        date: format(date, formatStr, { locale: pt }),
        balance: currentBalance,
        income: dayTransactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0),
        expense: dayTransactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0),
        investment: dayTransactions.filter((t) => t.type === "investment").reduce((acc, t) => acc + t.amount, 0),
        savings: dayTransactions.filter((t) => t.type === "savings").reduce((acc, t) => acc + t.amount, 0),
      }
    })
  }, [transactions, filteredTransactions, period])

  // 2. Category Breakdown Data (Expenses only)
  const categoryData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter((t) => t.type === "expense")
    const grouped = expenseTransactions.reduce(
      (acc, t) => {
        const cat = categories.find((c) => c.id === t.category)?.name || t.category
        acc[cat] = (acc[cat] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions, categories])

  // 3. Income vs Expense comparison data
  const comparisonData = useMemo(() => {
    return [
      { name: "Receitas", value: summary.totalIncome, fill: COLORS.income },
      { name: "Despesas", value: summary.totalExpense, fill: COLORS.expense },
      { name: "Investimentos", value: summary.totalInvestment, fill: COLORS.investment },
      { name: "Poupança", value: summary.totalSavings, fill: COLORS.savings },
    ].filter((item) => item.value > 0)
  }, [summary])

  // 4. Savings rate radial data
  const savingsRateData = useMemo(() => {
    return [
      {
        name: "Taxa de Poupança",
        value: Math.min(summary.savingsRate, 100),
        fill: summary.savingsRate >= 20 ? COLORS.income : summary.savingsRate >= 10 ? COLORS.savings : COLORS.expense,
      },
    ]
  }, [summary.savingsRate])

  // Colors generator for pie chart
  const PIE_COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
  ]

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="balance">Fluxo</TabsTrigger>
          <TabsTrigger value="breakdown">Despesas</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="trend">Tendência</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 w-full min-h-[350px]">
        {/* Cash Flow Tab - Bar Chart with Income vs Expense */}
        <TabsContent value="balance" className="h-full mt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} opacity={0.5} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11 }}
                tickFormatter={(value) => `€${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
              <Bar dataKey="income" name="Receita" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expense" name="Despesa" fill={COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        {/* Category Breakdown Tab - Donut Chart */}
        <TabsContent value="breakdown" className="h-full mt-0 flex items-center justify-center">
          {categoryData.length > 0 ? (
            <div className="w-full h-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0]
                        const total = categoryData.reduce((acc, item) => acc + item.value, 0)
                        const percentage = (((data.value as number) / total) * 100).toFixed(1)
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                            <p className="text-sm font-medium">{data.name}</p>
                            <p className="text-lg font-bold font-mono">
                              {(data.value as number).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                            </p>
                            <p className="text-xs text-muted-foreground">{percentage}% do total</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value, entry) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <PiggyBankIcon className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Sem dados de despesas para este período</p>
            </div>
          )}
        </TabsContent>

        {/* Comparison Tab - Horizontal Bar Chart with all types */}
        <TabsContent value="comparison" className="h-full mt-0">
          {comparisonData.length > 0 ? (
            <div className="h-full flex flex-col gap-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                      <ArrowUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Receitas</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {summary.totalIncome.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                      <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400 font-mono">
                        {summary.totalExpense.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Radial chart for savings rate */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative">
                  <ResponsiveContainer width={200} height={200}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      barSize={15}
                      data={savingsRateData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        background={{ fill: "hsl(var(--secondary))" }}
                        dataKey="value"
                        cornerRadius={10}
                        animationDuration={1000}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{summary.savingsRate.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground">Taxa de Poupança</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {summary.savingsRate >= 20
                  ? "Excelente! Está a poupar mais de 20% do rendimento."
                  : summary.savingsRate >= 10
                    ? "Bom progresso! Tente aumentar para 20%."
                    : "Considere aumentar a sua taxa de poupança."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <TrendingUpIcon className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Sem dados para comparação neste período</p>
            </div>
          )}
        </TabsContent>

        {/* Trend Tab - Area Chart with balance evolution */}
        <TabsContent value="trend" className="h-full mt-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.investment} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.investment} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} opacity={0.5} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11 }}
                tickFormatter={(value) => `€${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name="Saldo"
                stroke={COLORS.investment}
                fillOpacity={1}
                fill="url(#colorBalance)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Receita"
                stroke={COLORS.income}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>
      </div>
    </Tabs>
  )
}
