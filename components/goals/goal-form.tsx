"use client"

import type React from "react"
import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface GoalFormProps {
  onSuccess?: () => void
  editGoal?: {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline?: string
    color: string
  }
}

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

export function GoalForm({ onSuccess, editGoal }: GoalFormProps) {
  const { addGoal, updateGoal } = useFinance()
  const [name, setName] = useState(editGoal?.name || "")
  const [targetAmount, setTargetAmount] = useState(editGoal?.targetAmount?.toString() || "")
  const [currentAmount, setCurrentAmount] = useState(editGoal?.currentAmount?.toString() || "0")
  const [deadline, setDeadline] = useState(editGoal?.deadline?.split("T")[0] || "")
  const [color, setColor] = useState(editGoal?.color || "#10B981")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!name.trim()) {
      setError("Por favor insira um nome para a meta.")
      setIsSubmitting(false)
      return
    }

    if (!targetAmount || Number.parseFloat(targetAmount) <= 0) {
      setError("Por favor insira um valor objetivo válido.")
      setIsSubmitting(false)
      return
    }

    const goalData = {
      name: name.trim(),
      targetAmount: Number.parseFloat(targetAmount),
      currentAmount: Number.parseFloat(currentAmount) || 0,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      color,
      icon: "target",
    }

    try {
      if (editGoal) {
        await updateGoal(editGoal.id, goalData)
      } else {
        await addGoal(goalData)
      }
      onSuccess?.()
    } catch (err) {
      console.error("[v0] Error in goal form:", err)
      setError("Erro ao guardar a meta. Por favor tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const percentage =
    targetAmount && Number.parseFloat(targetAmount) > 0
      ? Math.min((Number.parseFloat(currentAmount) / Number.parseFloat(targetAmount)) * 100, 100)
      : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Meta</Label>
        <Input
          id="name"
          placeholder="Ex: Viagem a Itália"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetAmount">Objetivo (€)</Label>
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            placeholder="5000.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="font-mono"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentAmount">Valor Atual (€)</Label>
          <Input
            id="currentAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            className="font-mono"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {targetAmount && Number.parseFloat(targetAmount) > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="deadline">Data Limite (Opcional)</Label>
        <Input
          id="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.id)}
              disabled={isSubmitting}
              className={`h-8 w-8 rounded-full transition-all ${
                color === c.id ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ backgroundColor: c.id }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />A guardar...
            </>
          ) : editGoal ? (
            "Guardar Alterações"
          ) : (
            "Criar Meta"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
