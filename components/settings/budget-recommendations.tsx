"use client"

import { useEffect, useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingDown } from "lucide-react"

interface CostReductionSuggestion {
  category: string
  currentMonthlyAvg: number
  suggestedTarget: number
  savingsPotential: number
  reason: string
  difficulty: "easy" | "medium" | "hard"
}

export function BudgetRecommendations() {
  const { categories, transactions, getBudgetStatus } = useFinance()
  const [suggestions, setSuggestions] = useState<CostReductionSuggestion[]>([])

  useEffect(() => {
    if (!transactions || transactions.length === 0) return

    const expenseCategories = categories.filter((c) => c.type === "expense")
    const newSuggestions: CostReductionSuggestion[] = []

    // Analisar cada categoria
    expenseCategories.forEach((category) => {
      const categoryTransactions = transactions.filter((t) => t.category === category.id && t.type === "expense")

      if (categoryTransactions.length >= 3) {
        // Calcular média dos últimos 3 meses
        const now = new Date()
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

        const recentTransactions = categoryTransactions.filter((t) => new Date(t.date) >= threeMonthsAgo)
        const monthlyAvg = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / 3

        // Benchmarks de economia por categoria (redução inteligente)
        const benchmarks: Record<string, { target: number; difficulty: "easy" | "medium" | "hard" }> = {
          Restaurantes: { target: 0.8, difficulty: "medium" },
          Compras: { target: 0.85, difficulty: "medium" },
          Entretenimento: { target: 0.75, difficulty: "easy" },
          Streaming: { target: 0.5, difficulty: "easy" },
          Viagens: { target: 0.9, difficulty: "hard" },
        }

        const benchmark = benchmarks[category.name]
        if (benchmark && monthlyAvg > 30) {
          const suggestedTarget = monthlyAvg * benchmark.target
          const savings = monthlyAvg - suggestedTarget

          if (savings > 10) {
            newSuggestions.push({
              category: category.name,
              currentMonthlyAvg: monthlyAvg,
              suggestedTarget,
              savingsPotential: savings,
              reason: this.getReasonForCategory(category.name),
              difficulty: benchmark.difficulty,
            })
          }
        }
      }
    })

    setSuggestions(newSuggestions.sort((a, b) => b.savingsPotential - a.savingsPotential))
  }, [categories, transactions, getBudgetStatus])

  const getReasonForCategory = (category: string): string => {
    const reasons: Record<string, string> = {
      Restaurantes: "Cozinhar em casa é mais económico que comer fora",
      Compras: "Considera esperar por promoções ou marca própria",
      Entretenimento: "Explora opções gratuitas ou em promoção",
      Streaming: "Partilha subscrições ou cancela as não utilizadas",
      Café: "Fazer café em casa poupa €100+/mês",
      Viagens: "Planeia com antecedência para melhores preços",
    }
    return reasons[category] || "Oportunidade de redução de custos"
  }

  const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.savingsPotential, 0)

  return (
    <div className="space-y-4">
      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma sugestão disponível. Regista mais transações para análises!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <TrendingDown className="h-5 w-5" />
                Potencial de Economia
              </CardTitle>
              <CardDescription>Total em todas as categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                €{totalPotentialSavings.toFixed(2)}/mês
              </p>
            </CardContent>
          </Card>

          {suggestions.map((suggestion, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{suggestion.category}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                    </div>
                    <Badge
                      variant={
                        suggestion.difficulty === "easy"
                          ? "outline"
                          : suggestion.difficulty === "medium"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {suggestion.difficulty === "easy"
                        ? "Fácil"
                        : suggestion.difficulty === "medium"
                          ? "Médio"
                          : "Desafiante"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">Atual</p>
                      <p className="font-bold">€{suggestion.currentMonthlyAvg.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                      <p className="text-xs font-semibold">Sugerido</p>
                      <p className="font-bold">€{suggestion.suggestedTarget.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                      <p className="text-xs font-semibold">Economia</p>
                      <p className="font-bold">€{suggestion.savingsPotential.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
