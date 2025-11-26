"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { ArrowUpIcon, ArrowDownIcon, WalletIcon, PiggyBankIcon, TrendingUpIcon } from "lucide-react"
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
  const { getSummary, period, setPeriod, accounts = [] } = useFinance()
  const { formatCurrency } = useCurrency()
  const summary = getSummary()

  const totalSavings = accounts.filter((a) => a.type === "savings").reduce((sum, a) => sum + a.balance, 0)

  const totalInvestments = accounts.filter((a) => a.type === "investment").reduce((sum, a) => sum + a.balance, 0)

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

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Saldo Líquido */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-card/80 p-5 shadow-sm hover:shadow-lg transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-10 translate-x-10 blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Líquido</p>
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <WalletIcon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <h2 className={`text-xl font-bold mt-2 ${summary.balance >= 0 ? "text-foreground" : "text-expense"}`}>
              {formatCurrency(summary.balance)}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">No período</p>
          </div>
        </div>

        {/* Receitas */}
        <div className="relative overflow-hidden rounded-2xl border border-income/20 bg-gradient-to-br from-income/5 via-card to-card/80 p-5 shadow-sm hover:shadow-lg hover:border-income/40 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-income/20 to-transparent rounded-full -translate-y-10 translate-x-10 blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receitas</p>
              <div className="h-8 w-8 rounded-xl bg-income/10 flex items-center justify-center">
                <ArrowUpIcon className="h-4 w-4 text-income" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-income mt-2">{formatCurrency(summary.totalIncome)}</h2>
          </div>
        </div>

        {/* Despesas */}
        <div className="relative overflow-hidden rounded-2xl border border-expense/20 bg-gradient-to-br from-expense/5 via-card to-card/80 p-5 shadow-sm hover:shadow-lg hover:border-expense/40 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-expense/20 to-transparent rounded-full -translate-y-10 translate-x-10 blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesas</p>
              <div className="h-8 w-8 rounded-xl bg-expense/10 flex items-center justify-center">
                <ArrowDownIcon className="h-4 w-4 text-expense" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-expense mt-2">{formatCurrency(summary.totalExpense)}</h2>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-savings/20 bg-gradient-to-br from-savings/5 via-card to-card/80 p-5 shadow-sm hover:shadow-lg hover:border-savings/40 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-savings/20 to-transparent rounded-full -translate-y-10 translate-x-10 blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Poupança</p>
              <div className="h-8 w-8 rounded-xl bg-savings/10 flex items-center justify-center">
                <PiggyBankIcon className="h-4 w-4 text-savings" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-savings mt-2">{formatCurrency(totalSavings)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Total acumulado</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-investment/20 bg-gradient-to-br from-investment/5 via-card to-card/80 p-5 shadow-sm hover:shadow-lg hover:border-investment/40 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-investment/20 to-transparent rounded-full -translate-y-10 translate-x-10 blur-xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Investido</p>
              <div className="h-8 w-8 rounded-xl bg-investment/10 flex items-center justify-center">
                <TrendingUpIcon className="h-4 w-4 text-investment" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-investment mt-2">{formatCurrency(totalInvestments)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Total acumulado</p>
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
