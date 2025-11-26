"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { addMonths, format } from "date-fns"
import { pt } from "date-fns/locale"
import { useMemo } from "react"
import { AlertCircleIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context"

export function ForecastView() {
  const { transactions, accounts, getSummary } = useFinance()
  const { totalNetWorth } = getSummary()
  const { formatCurrency } = useCurrency()

  const forecastData = useMemo(() => {
    const monthsToProject = 6
    const today = new Date()
    const data = []
    const currentBalance = totalNetWorth

    const recurringIncome = transactions
      .filter((t) => t.isRecurring && t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0)

    const recurringExpense = transactions
      .filter((t) => t.isRecurring && t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0)

    const estimatedVariableExpense = 500
    const estimatedVariableIncome = 0

    const monthlyNetFlow = recurringIncome + estimatedVariableIncome - (recurringExpense + estimatedVariableExpense)

    let minBalance = currentBalance
    let maxBalance = currentBalance

    for (let i = 0; i <= monthsToProject; i++) {
      const date = addMonths(today, i)
      const balance = currentBalance + monthlyNetFlow * i

      minBalance = Math.min(minBalance, balance)
      maxBalance = Math.max(maxBalance, balance)

      data.push({
        date: format(date, "MMM yyyy", { locale: pt }),
        balance: balance,
        isNegative: balance < 0,
      })
    }

    // Add padding to min/max
    const padding = Math.abs(maxBalance - minBalance) * 0.1 || 500
    minBalance = Math.floor((minBalance - padding) / 100) * 100
    maxBalance = Math.ceil((maxBalance + padding) / 100) * 100

    const finalBalance = data[data.length - 1]?.balance || 0

    return { data, monthlyNetFlow, finalBalance, minBalance, maxBalance }
  }, [totalNetWorth, transactions])

  const formatValue = (value: number) => {
    return formatCurrency(value)
  }

  const yAxisTickFormatter = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000) {
      return `${value < 0 ? "-" : ""}${(absValue / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Simulação Futura</h2>
          <p className="text-muted-foreground">Projeção do seu saldo para os próximos 6 meses.</p>
        </div>

        <div className="flex gap-4">
          <div
            className={`border p-4 rounded-xl backdrop-blur-sm min-w-[150px] ${
              forecastData.monthlyNetFlow >= 0
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {forecastData.monthlyNetFlow >= 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">Fluxo Mensal</p>
            </div>
            <p
              className={`text-lg font-bold ${forecastData.monthlyNetFlow >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {forecastData.monthlyNetFlow > 0 ? "+" : ""}
              {formatValue(forecastData.monthlyNetFlow)}
            </p>
          </div>

          <div
            className={`border p-4 rounded-xl backdrop-blur-sm min-w-[150px] ${
              forecastData.finalBalance >= 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {forecastData.finalBalance >= 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">Saldo em 6 Meses</p>
            </div>
            <p className={`text-lg font-bold ${forecastData.finalBalance >= 0 ? "text-blue-500" : "text-red-500"}`}>
              {formatValue(forecastData.finalBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData.data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNegative" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} className="fill-muted-foreground text-xs" />
            <YAxis
              axisLine={false}
              tickLine={false}
              className="fill-muted-foreground text-xs"
              tickFormatter={yAxisTickFormatter}
              domain={[forecastData.minBalance, forecastData.maxBalance]}
              allowDataOverflow={false}
            />
            <Tooltip
              formatter={(value: number) => [formatValue(value), "Saldo"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={forecastData.finalBalance >= 0 ? "#3b82f6" : "#ef4444"}
              strokeWidth={3}
              fillOpacity={1}
              fill={forecastData.finalBalance >= 0 ? "url(#colorPositive)" : "url(#colorNegative)"}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {forecastData.finalBalance < 0 && (
        <div className="flex gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">Atenção: Saldo Negativo Previsto</p>
            <p>
              Com base nas suas receitas e despesas atuais, prevemos que o seu saldo ficará negativo dentro de 6 meses.
              Considere reduzir despesas ou aumentar as suas fontes de rendimento.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
        <AlertCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold mb-1">Como funciona esta previsão?</p>
          <p>
            Calculamos com base no seu saldo atual ({formatValue(totalNetWorth)}) somado às suas receitas recorrentes e
            subtraindo as despesas fixas. Adicionamos também uma estimativa de gastos variáveis. Valores negativos são
            representados a vermelho.
          </p>
        </div>
      </div>
    </div>
  )
}
