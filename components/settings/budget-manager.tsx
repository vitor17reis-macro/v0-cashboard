"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrendingDownIcon, AlertTriangleIcon, CheckCircle2Icon } from "lucide-react"

export function BudgetManager() {
  const { categories, updateBudget, getBudgetStatus } = useFinance()
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const getStatusInfo = (percentage: number) => {
    if (percentage >= 100) {
      return {
        icon: AlertTriangleIcon,
        color: "text-red-500",
        bgColor: "bg-red-500",
        bgLight: "bg-red-500/10",
        label: "Excedido",
      }
    }
    if (percentage >= 80) {
      return {
        icon: TrendingDownIcon,
        color: "text-amber-500",
        bgColor: "bg-amber-500",
        bgLight: "bg-amber-500/10",
        label: "Atenção",
      }
    }
    return {
      icon: CheckCircle2Icon,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500",
      bgLight: "bg-emerald-500/10",
      label: "OK",
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Defina limites mensais para controlar os seus gastos por categoria.
      </p>

      <ScrollArea className="h-[calc(100vh-220px)] pr-4">
        <div className="space-y-4">
          {expenseCategories.map((category, index) => {
            const status = getBudgetStatus(category.id)
            const statusInfo = getStatusInfo(status.percentage)
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={category.id}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 hover:bg-card/80 hover:shadow-lg hover:shadow-black/5 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                      style={{ backgroundColor: category.color + "20", color: category.color }}
                    >
                      {category.icon || "📦"}
                    </div>
                    <div>
                      <Label className="font-semibold text-base">{category.name}</Label>
                      {status.limit > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {status.spent.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} de{" "}
                          {status.limit.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {status.limit > 0 && (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgLight} ${statusInfo.color}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusInfo.label}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {status.limit > 0 && (
                  <div className="mb-4">
                    <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${statusInfo.bgColor}`}
                        style={{ width: `${Math.min(status.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">0%</span>
                      <span className={`text-xs font-medium ${statusInfo.color}`}>{status.percentage.toFixed(0)}%</span>
                      <span className="text-xs text-muted-foreground">100%</span>
                    </div>
                  </div>
                )}

                {/* Limit Input */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <Label htmlFor={`budget-${category.id}`} className="text-sm text-muted-foreground whitespace-nowrap">
                    Limite Mensal
                  </Label>
                  <div className="relative flex-1">
                    <Input
                      id={`budget-${category.id}`}
                      type="number"
                      className="h-10 pr-8 text-right bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                      placeholder="0,00"
                      defaultValue={status.limit || ""}
                      onBlur={(e) => {
                        const val = Number.parseFloat(e.target.value)
                        if (!isNaN(val) && val >= 0) {
                          updateBudget(category.id, val)
                        }
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  </div>
                </div>
              </div>
            )
          })}

          {expenseCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingDownIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Sem categorias de despesa</h3>
              <p className="text-sm text-muted-foreground">Adicione categorias de despesa para definir orçamentos.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
