"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrendingDownIcon, AlertTriangleIcon, CheckCircle2Icon, Target, Sparkles } from "lucide-react"

export function BudgetManager() {
  const { categories = [], updateBudget, getBudgetStatus } = useFinance()
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const getStatusInfo = (percentage: number) => {
    if (percentage >= 100) {
      return {
        icon: AlertTriangleIcon,
        color: "text-red-500",
        bgColor: "bg-red-500",
        bgLight: "bg-red-500/10",
        borderColor: "border-red-500/30",
        label: "Excedido",
        gradient: "from-red-500/20 via-red-500/10 to-transparent",
      }
    }
    if (percentage >= 80) {
      return {
        icon: TrendingDownIcon,
        color: "text-amber-500",
        bgColor: "bg-amber-500",
        bgLight: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        label: "Atenção",
        gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
      }
    }
    return {
      icon: CheckCircle2Icon,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500",
      bgLight: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      label: "OK",
      gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    }
  }

  // Calculate totals
  const totalBudget = expenseCategories.reduce((acc, c) => acc + (getBudgetStatus(c.id).limit || 0), 0)
  const totalSpent = expenseCategories.reduce((acc, c) => acc + getBudgetStatus(c.id).spent, 0)
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const overallStatus = getStatusInfo(overallPercentage)

  return (
    <div className="space-y-6">
      {totalBudget > 0 && (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${overallStatus.gradient} p-6 border ${overallStatus.borderColor}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16 blur-xl" />

          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl ${overallStatus.bgLight} flex items-center justify-center`}>
                <Target className={`h-6 w-6 ${overallStatus.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Resumo Geral</h3>
                <p className="text-sm text-muted-foreground">
                  {totalSpent.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} de{" "}
                  {totalBudget.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${overallStatus.bgLight} ${overallStatus.color} font-bold`}
            >
              <overallStatus.icon className="h-4 w-4" />
              {overallPercentage.toFixed(0)}%
            </div>
          </div>

          <div className="h-3 bg-background/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${overallStatus.bgColor}`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-380px)] pr-2">
        <div className="space-y-3">
          {expenseCategories.map((category, index) => {
            const status = getBudgetStatus(category.id)
            const statusInfo = getStatusInfo(status.percentage)
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={category.id}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r ${statusInfo.gradient} border ${statusInfo.borderColor} p-5 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 animate-in`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-12 translate-x-12 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Label className="font-bold text-base">{category.name}</Label>
                        {status.limit > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {status.spent.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} /{" "}
                            {status.limit.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                          </p>
                        )}
                      </div>
                    </div>

                    {status.limit > 0 && (
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.bgLight} ${statusInfo.color} shadow-sm`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {status.limit > 0 && (
                    <div className="mb-4">
                      <div className="h-2.5 bg-background/60 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${statusInfo.bgColor}`}
                          style={{ width: `${Math.min(status.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">0%</span>
                        <span className={`text-xs font-bold ${statusInfo.color}`}>{status.percentage.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">100%</span>
                      </div>
                    </div>
                  )}

                  {/* Limit Input */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/30">
                    <Label
                      htmlFor={`budget-${category.id}`}
                      className="text-xs text-muted-foreground whitespace-nowrap uppercase tracking-wider"
                    >
                      Limite
                    </Label>
                    <div className="relative flex-1">
                      <Input
                        id={`budget-${category.id}`}
                        type="number"
                        className="h-10 pr-8 text-right bg-background/50 border-0 focus:ring-2 focus:ring-primary/20 rounded-lg font-medium"
                        placeholder="0,00"
                        defaultValue={status.limit || ""}
                        onBlur={(e) => {
                          const val = Number.parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0) {
                            updateBudget(category.id, val)
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {expenseCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-2">Sem categorias de despesa</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Adicione categorias de despesa primeiro para poder definir orçamentos mensais.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
