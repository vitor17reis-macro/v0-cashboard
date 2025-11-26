"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { OverviewCharts } from "@/components/analytics/overview-charts"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"
import { eachMonthOfInterval, format, startOfYear, endOfYear } from "date-fns"
import { pt } from "date-fns/locale"

export function ReportsView() {
  const { transactions } = useFinance()

  // Yearly overview data
  const yearlyData = useMemo(() => {
    const now = new Date()
    const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) })

    return months.map((month) => {
      const monthStr = format(month, "MMM", { locale: pt })
      // Filter transactions for this month
      // Note: In real app, optimize this loop
      const monthTrans = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
      })

      return {
        name: monthStr,
        Receitas: monthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0),
        Despesas: monthTrans.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0),
        Investimentos: monthTrans.filter((t) => t.type === "investment").reduce((acc, t) => acc + t.amount, 0),
      }
    })
  }, [transactions])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-serif font-bold">Relatórios Detalhados</h2>
        <p className="text-muted-foreground">Análise profunda dos seus hábitos financeiros.</p>
      </div>

      <div className="grid gap-8">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg h-[400px]">
          <h3 className="text-lg font-bold mb-6">Evolução Anual</h3>
          <ResponsiveContainer width="100%" height="300px">
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#888" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#888" }} tickFormatter={(val) => `€${val}`} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
              />
              <Legend />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Investimentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-6">Análise de Período</h3>
          <div className="h-[400px]">
            <OverviewCharts />
          </div>
        </div>
      </div>
    </div>
  )
}
