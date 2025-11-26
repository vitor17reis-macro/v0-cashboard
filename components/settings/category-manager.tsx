"use client"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2Icon, PlusIcon, Loader2, Sparkles } from "lucide-react"
import type { TransactionType } from "@/lib/types"

const TYPES: { value: TransactionType; label: string; color: string; gradient: string }[] = [
  { value: "income", label: "Receita", color: "text-income", gradient: "from-emerald-500/20 to-emerald-500/5" },
  { value: "expense", label: "Despesa", color: "text-expense", gradient: "from-red-500/20 to-red-500/5" },
  {
    value: "investment",
    label: "Investimento",
    color: "text-investment",
    gradient: "from-violet-500/20 to-violet-500/5",
  },
  { value: "savings", label: "Poupança", color: "text-savings", gradient: "from-cyan-500/20 to-cyan-500/5" },
]

const COLORS = [
  { id: "#0d9488", name: "Teal" },
  { id: "#059669", name: "Emerald" },
  { id: "#3b82f6", name: "Azul" },
  { id: "#7c3aed", name: "Violeta" },
  { id: "#ec4899", name: "Rosa" },
  { id: "#f97316", name: "Laranja" },
  { id: "#eab308", name: "Amarelo" },
  { id: "#ef4444", name: "Vermelho" },
]

export function CategoryManager() {
  const { categories = [], addCategory, deleteCategory } = useFinance()
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>("expense")
  const [newCategoryColor, setNewCategoryColor] = useState("#0d9488")
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
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-y-20 translate-x-20 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Nova Categoria</h3>
              <p className="text-xs text-muted-foreground">Organize as suas finanças</p>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl mb-4 border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
                <Input
                  placeholder="Ex: Ginásio, Dividendos..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isAdding}
                  className="h-11 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
                <Select
                  value={newCategoryType}
                  onValueChange={(v) => setNewCategoryType(v as TransactionType)}
                  disabled={isAdding}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className={t.color}>{t.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewCategoryColor(c.id)}
                    disabled={isAdding}
                    className={`h-9 w-9 rounded-xl transition-all duration-300 ${
                      newCategoryColor === c.id
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110 shadow-lg"
                        : "hover:scale-105"
                    } ${isAdding ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: c.id }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleAdd}
              className="h-11 rounded-xl font-semibold"
              disabled={!newCategoryName.trim() || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />A adicionar...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Adicionar Categoria
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {TYPES.map((type) => {
          const typeCategories = categories.filter((c) => c.type === type.value)
          if (typeCategories.length === 0) return null

          return (
            <div key={type.value} className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full bg-gradient-to-r ${type.gradient.replace("/20", "").replace("/5", "")}`}
                  style={{
                    backgroundColor:
                      type.value === "income"
                        ? "#059669"
                        : type.value === "expense"
                          ? "#ef4444"
                          : type.value === "investment"
                            ? "#7c3aed"
                            : "#0891b2",
                  }}
                />
                <h4 className={`text-sm font-bold uppercase tracking-wider ${type.color}`}>{type.label}</h4>
                <span className="text-xs text-muted-foreground">({typeCategories.length})</span>
              </div>

              <div className="grid gap-2">
                {typeCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className={`group flex items-center justify-between rounded-xl bg-gradient-to-r ${type.gradient} p-3 border border-border/30 transition-all duration-300 hover:shadow-md hover:border-border/50 animate-in`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <PlusIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Sem categorias</h3>
            <p className="text-sm text-muted-foreground">Crie a sua primeira categoria acima.</p>
          </div>
        )}
      </div>
    </div>
  )
}
