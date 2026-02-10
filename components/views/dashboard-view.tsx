"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { ArrowUpIcon, ArrowDownIcon, WalletIcon, PiggyBankIcon, TrendingUpIcon } from "lucide-react"
import { OverviewCharts } from "@/components/analytics/overview-charts"
import { AccountCards } from "@/features/accounts/components/account-cards"
import { GoalsList } from "@/features/goals/components/goals-list"
import { TransactionList } from "@/features/transactions/components/transaction-list"
import { AIInsights } from "@/components/insights/ai-insights"

const PERIODS = [
  { id: "day", label: "Hoje" },
  { id: "week", label: "Esta Semana" },
  { id: "month", label: "Este Mês" },
  { id: "year", label: "Este Ano" },
] as const

export function DashboardView() {
  const { getSummary, period, setPeriod, accounts = [] } = useFinance()
  const { formatCurrency } = useCurrency()
  const summary = getSummary()

  const totalSavings = accounts.filter((a) => a.type === "savings").reduce((sum, a) => sum + a.balance, 0)

  const totalInvestments = accounts.filter((a) => a.type === "investment").reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe suas finanças em tempo real</p>
        </div>
        <div className="flex gap-1 bg-secondary/30 p-1.5 rounded-xl self-start sm:self-auto backdrop-blur-sm border border-border/50">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                period === p.id
                  ? "bg-primary/20 text-primary font-semibold shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Saldo Líquido */}
        <div className="metric-card group hover-lift">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-y-8 translate-x-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saldo Líquido</p>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <WalletIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h2 className={`text-2xl font-bold mt-2 tracking-tight ${summary.balance >= 0 ? "text-foreground gradient-text" : "text-expense"}`}>
              {formatCurrency(summary.balance)}
            </h2>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Período atual</p>
          </div>
        </div>

        {/* Receitas */}
        <div className="metric-card group hover-lift border-income/30 hover:border-income/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-income/15 to-transparent rounded-full -translate-y-8 translate-x-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receitas</p>
              <div className="h-10 w-10 rounded-lg bg-income/10 flex items-center justify-center group-hover:bg-income/20 transition-colors">
                <ArrowUpIcon className="h-5 w-5 text-income" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-income mt-2 tracking-tight">{formatCurrency(summary.totalIncome)}</h2>
            <p className="text-xs text-income/60 mt-2 uppercase tracking-wider">+ Entrada</p>
          </div>
        </div>

        {/* Despesas */}
        <div className="metric-card group hover-lift border-expense/30 hover:border-expense/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-expense/15 to-transparent rounded-full -translate-y-8 translate-x-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Despesas</p>
              <div className="h-10 w-10 rounded-lg bg-expense/10 flex items-center justify-center group-hover:bg-expense/20 transition-colors">
                <ArrowDownIcon className="h-5 w-5 text-expense" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-expense mt-2 tracking-tight">{formatCurrency(summary.totalExpense)}</h2>
            <p className="text-xs text-expense/60 mt-2 uppercase tracking-wider">- Saída</p>
          </div>
        </div>

        {/* Poupança */}
        <div className="metric-card group hover-lift border-savings/30 hover:border-savings/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-savings/15 to-transparent rounded-full -translate-y-8 translate-x-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poupança</p>
              <div className="h-10 w-10 rounded-lg bg-savings/10 flex items-center justify-center group-hover:bg-savings/20 transition-colors">
                <PiggyBankIcon className="h-5 w-5 text-savings" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-savings mt-2 tracking-tight">{formatCurrency(totalSavings)}</h2>
            <p className="text-xs text-savings/60 mt-2 uppercase tracking-wider">Reserva</p>
          </div>
        </div>

        {/* Investimentos */}
        <div className="metric-card group hover-lift border-investment/30 hover:border-investment/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-investment/15 to-transparent rounded-full -translate-y-8 translate-x-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Investimentos</p>
              <div className="h-10 w-10 rounded-lg bg-investment/10 flex items-center justify-center group-hover:bg-investment/20 transition-colors">
                <TrendingUpIcon className="h-5 w-5 text-investment" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-investment mt-2 tracking-tight">{formatCurrency(totalInvestments)}</h2>
            <p className="text-xs text-investment/60 mt-2 uppercase tracking-wider">Ativos</p>
          </div>
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
