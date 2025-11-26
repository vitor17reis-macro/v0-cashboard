"use client"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2Icon, PlusIcon, TagIcon, Loader2 } from "lucide-react"
import type { TransactionType } from "@/lib/types"

const TYPES: { value: TransactionType; label: string; color: string }[] = [
  { value: "income", label: "Receita", color: "text-income" },
  { value: "expense", label: "Despesa", color: "text-expense" },
  { value: "investment", label: "Investimento", color: "text-investment" },
  { value: "savings", label: "Poupança", color: "text-savings" },
]

const COLORS = [
  { id: "#10B981", name: "Verde" },
  { id: "#3B82F6", name: "Azul" },
  { id: "#F59E0B", name: "Amarelo" },
  { id: "#EF4444", name: "Vermelho" },
  { id: "#8B5CF6", name: "Roxo" },
  { id: "#EC4899", name: "Rosa" },
  { id: "#06B6D4", name: "Ciano" },
  { id: "#F97316", name: "Laranja" },
]

export function CategoryManager() {
  const { categories, addCategory, deleteCategory } = useFinance()
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>("expense")
  const [newCategoryColor, setNewCategoryColor] = useState("#10B981")
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")

  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      setError("Por favor insira um nome para a categoria.")
      return
    }

    setIsAdding(true)
    setError("")

    try {
      await addCategory({
        name: newCategoryName.trim(),
        type: newCategoryType,
        color: newCategoryColor,
        icon: "tag",
      })
      setNewCategoryName("")
    } catch (err) {
      console.error("[v0] Error adding category:", err)
      setError("Erro ao adicionar categoria. Por favor tente novamente.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="font-medium flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Nova Categoria
        </h3>

        {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              placeholder="Ex: Ginásio, Dividendos..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={newCategoryType}
              onValueChange={(v) => setNewCategoryType(v as TransactionType)}
              disabled={isAdding}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setNewCategoryColor(c.id)}
                disabled={isAdding}
                className={`h-7 w-7 rounded-full transition-all ${
                  newCategoryColor === c.id ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                } ${isAdding ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: c.id }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full" disabled={!newCategoryName.trim() || isAdding}>
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />A adicionar...
            </>
          ) : (
            "Adicionar Categoria"
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Categorias Existentes
        </h3>

        <div className="space-y-6">
          {TYPES.map((type) => {
            const typeCategories = categories.filter((c) => c.type === type.value)
            if (typeCategories.length === 0) return null

            return (
              <div key={type.value} className="space-y-2">
                <h4 className={`text-sm font-semibold uppercase tracking-wider ${type.color}`}>{type.label}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {typeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between rounded-md border border-border bg-background/50 p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                        )}
                        <span>{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
