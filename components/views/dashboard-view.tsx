"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, WalletIcon, PiggyBankIcon } from "lucide-react"
import { OverviewCharts } from "@/components/analytics/overview-charts"
import { AccountCards } from "@/components/accounts/account-cards"
import { GoalsList } from "@/components/goals/goals-list"
import { TransactionList } from "@/components/transactions/transaction-list"
import { AIInsights } from "@/components/insights/ai-insights"

const PERIODS = [
  { id: "day", label: "Hoje" },
  { id: "week", label: "Esta Semana" },
  { id: "month", label: "Este Mês" },
  { id: "year", label: "Este Ano" },
] as const

export function DashboardView() {
  const { getSummary, period, setPeriod } = useFinance()
  const { formatCurrency } = useCurrency()
  const summary = getSummary()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-serif font-bold text-foreground">Visão Geral</h2>
        <div className="flex bg-secondary/50 p-1 rounded-lg self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                period === p.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:bg-card/80 transition-all group">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Saldo Líquido
            </p>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <h2 className={`text-2xl font-bold ${summary.balance >= 0 ? "text-foreground" : "text-expense"}`}>
              {formatCurrency(summary.balance)}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:bg-card/80 transition-all">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Receitas</p>
            <ArrowUpIcon className="h-4 w-4 text-income" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <h2 className="text-2xl font-bold text-income">{formatCurrency(summary.totalIncome)}</h2>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:bg-card/80 transition-all">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Despesas</p>
            <ArrowDownIcon className="h-4 w-4 text-expense" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <h2 className="text-2xl font-bold text-expense">{formatCurrency(summary.totalExpense)}</h2>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:bg-card/80 transition-all">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Investimentos</p>
            <TrendingUpIcon className="h-4 w-4 text-investment" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <h2 className="text-2xl font-bold text-investment">{formatCurrency(summary.totalInvestment)}</h2>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:bg-card/80 transition-all">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Poupança</p>
            <PiggyBankIcon className="h-4 w-4 text-savings" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <h2 className="text-2xl font-bold text-savings">{formatCurrency(summary.totalSavings)}</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Taxa: {summary.savingsRate.toFixed(1)}%</p>
        </div>
      </div>

      <AIInsights />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <AccountCards />
        </div>
        <div className="md:col-span-1">
          <GoalsList />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 min-h-[450px] flex flex-col shadow-lg">
          <h3 className="font-serif font-bold text-xl mb-4">Análise Financeira</h3>
          <div className="flex-1 w-full min-h-[350px]">
            <OverviewCharts />
          </div>
        </div>
        <div className="col-span-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-xl">Transações Recentes</h3>
          </div>
          <TransactionList />
        </div>
      </div>
    </div>
  )
}
