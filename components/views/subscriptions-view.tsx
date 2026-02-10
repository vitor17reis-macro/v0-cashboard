"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import { CheckCircle2Icon, ArrowUpIcon, ArrowDownIcon, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SubscriptionsView() {
  const { transactions, categories } = useFinance()

  const subscriptions = transactions.filter((t) => t.isRecurring)

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || id
  }

  const totals = subscriptions.reduce(
    (acc, t) => {
      let monthlyAmount = t.amount
      if (t.recurringFrequency === "weekly") monthlyAmount = t.amount * 4
      else if (t.recurringFrequency === "yearly") monthlyAmount = t.amount / 12

      if (t.type === "income") {
        acc.income += monthlyAmount
      } else {
        acc.expense += monthlyAmount
      }
      return acc
    },
    { income: 0, expense: 0 },
  )

  const incomeCount = subscriptions.filter((t) => t.type === "income").length
  const expenseCount = subscriptions.filter((t) => t.type === "expense").length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Transações Recorrentes</h2>
          <p className="text-muted-foreground">Gerencie as suas receitas e despesas fixas.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card/50 border border-border/50 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Receitas Fixas</p>
          </div>
          <p className="text-2xl font-bold text-green-500">
            +{totals.income.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {incomeCount} recorrente{incomeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-card/50 border border-border/50 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
            <p className="text-sm text-muted-foreground">Despesas Fixas</p>
          </div>
          <p className="text-2xl font-bold text-red-500">
            -{totals.expense.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {expenseCount} recorrente{expenseCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-card/50 border border-border/50 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">Balanço Mensal</p>
          </div>
          <p
            className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {(totals.income - totals.expense).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Líquido das recorrentes</p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/20">
          <RefreshCw className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma transação recorrente</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            Adicione uma transação com a opção "Recorrente" para a ver aqui. Pode ser uma receita (salário) ou despesa
            (renda, subscrições).
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const isIncome = sub.type === "income"

            return (
              <div
                key={sub.id}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:shadow-md transition-all hover:bg-card/80"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-2 rounded-full ${isIncome ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    {isIncome ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={
                        isIncome
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {isIncome ? "Receita" : "Despesa"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {sub.recurringFrequency === "monthly"
                        ? "Mensal"
                        : sub.recurringFrequency === "weekly"
                          ? "Semanal"
                          : "Anual"}
                    </Badge>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1">{sub.description}</h3>
                <p className="text-sm text-muted-foreground mb-4">{getCategoryName(sub.category)}</p>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className={`text-xl font-bold font-mono ${isIncome ? "text-green-500" : "text-red-500"}`}>
                      {isIncome ? "+" : "-"}
                      {sub.amount.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                    </p>
                  </div>
                  {sub.nextDueDate && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Próxima data</p>
                      <p className="text-sm font-medium">
                        {format(parseISO(sub.nextDueDate), "d MMM", { locale: pt })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
