"use client"

import { useEffect, useRef } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useToast } from "@/hooks/use-toast"

export function BudgetToastNotifications() {
  const { categories, getBudgetStatus, transactions } = useFinance()
  const { toast } = useToast()
  const notifiedBudgets = useRef<Set<string>>(new Set())

  useEffect(() => {
    const expenseCategories = categories.filter((c) => c.type === "expense")

    expenseCategories.forEach((category) => {
      const status = getBudgetStatus(category.id)

      if (status.limit > 0) {
        // Alert at 80% threshold
        const warningKey = `${category.id}-80`
        if (status.percentage >= 80 && status.percentage < 100 && !notifiedBudgets.current.has(warningKey)) {
          notifiedBudgets.current.add(warningKey)
          toast({
            title: `Atenção: ${category.name}`,
            description: `Já gastou ${status.percentage.toFixed(0)}% do orçamento mensal.`,
            variant: "default",
          })
        }

        // Alert at 100% threshold
        const dangerKey = `${category.id}-100`
        if (status.percentage >= 100 && !notifiedBudgets.current.has(dangerKey)) {
          notifiedBudgets.current.add(dangerKey)
          toast({
            title: `Orçamento Excedido: ${category.name}`,
            description: `Ultrapassou o limite em ${(status.percentage - 100).toFixed(0)}%.`,
            variant: "destructive",
          })
        }
      }
    })
  }, [transactions, categories, getBudgetStatus, toast])

  return null
}
