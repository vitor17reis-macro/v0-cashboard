"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

export function BudgetManager() {
  const { categories, updateBudget, getBudgetStatus } = useFinance()
  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">Defina limites mensais para suas categorias de despesa.</div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {expenseCategories.map((category) => {
            const status = getBudgetStatus(category.id)
            return (
              <div key={category.id} className="space-y-3 border-b border-border/40 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <Label className="font-medium font-serif text-base">{category.name}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Limite:</span>
                    <Input
                      type="number"
                      className="w-24 h-8 text-right"
                      placeholder="0.00"
                      defaultValue={status.limit || ""}
                      onBlur={(e) => {
                        const val = Number.parseFloat(e.target.value)
                        if (!isNaN(val)) {
                          updateBudget(category.id, val)
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                  </div>
                </div>

                {status.limit > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={status.percentage > 100 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        Gasto: {status.spent.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                      </span>
                      <span className="text-muted-foreground">{status.percentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={Math.min(status.percentage, 100)}
                      className={`h-2 ${status.percentage > 100 ? "bg-red-100" : ""}`}
                      // Note: shadcn Progress uses root color, custom coloring via class is tricky depending on impl.
                      // We can assume standard shadcn progress usage.
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
