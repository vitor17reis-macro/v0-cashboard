"use client"

import type React from "react"
import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { CreditCard, PiggyBank, TrendingUp, Banknote, Loader2 } from "lucide-react"

interface AccountFormProps {
  onSuccess?: () => void
  editAccount?: {
    id: string
    name: string
    type: string
    balance: number
    color: string
    icon?: string
  }
}

const ACCOUNT_TYPES = [
  { id: "checking", name: "Conta à Ordem", icon: CreditCard },
  { id: "savings", name: "Conta Poupança", icon: PiggyBank },
  { id: "investment", name: "Investimentos", icon: TrendingUp },
  { id: "cash", name: "Dinheiro", icon: Banknote },
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

export function AccountForm({ onSuccess, editAccount }: AccountFormProps) {
  const { addAccount, updateAccount } = useFinance()
  const [name, setName] = useState(editAccount?.name || "")
  const [type, setType] = useState(editAccount?.type || "checking")
  const [balance, setBalance] = useState(editAccount?.balance?.toString() || "0")
  const [color, setColor] = useState(editAccount?.color || "#10B981")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!name.trim()) {
      setError("Por favor insira um nome para a conta.")
      setIsSubmitting(false)
      return
    }

    const accountData = {
      name: name.trim(),
      type: type as "checking" | "savings" | "investment" | "cash",
      balance: Number.parseFloat(balance) || 0,
      color,
      icon: type,
    }

    try {
      if (editAccount) {
        await updateAccount(editAccount.id, accountData)
      } else {
        await addAccount(accountData)
      }
      onSuccess?.()
    } catch (err) {
      console.error("[v0] Error in account form:", err)
      setError("Erro ao guardar a conta. Por favor tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Conta</Label>
        <Input
          id="name"
          placeholder="Ex: Conta Millennium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Conta</Label>
        <Select value={type} onValueChange={setType} disabled={isSubmitting}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex items-center gap-2">
                  <t.icon className="h-4 w-4" />
                  {t.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">Saldo Inicial (€)</Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="font-mono"
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
          ) : editAccount ? (
            "Guardar Alterações"
          ) : (
            "Criar Conta"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
