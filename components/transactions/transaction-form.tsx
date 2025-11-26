"use client"

import type React from "react"
import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { getCurrencySymbol } from "@/lib/currency"
import type { TransactionType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface TransactionFormProps {
  onSuccess?: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { addTransaction, categories, accounts } = useFinance()
  const { currency } = useCurrency()
  const [type, setType] = useState<TransactionType>("expense")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [category, setCategory] = useState("")
  const [accountId, setAccountId] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!amount) {
      setError("Por favor insira um valor.")
      setIsSubmitting(false)
      return
    }
    if (!description) {
      setError("Por favor insira uma descrição.")
      setIsSubmitting(false)
      return
    }
    if (!category) {
      setError("Por favor selecione uma categoria.")
      setIsSubmitting(false)
      return
    }
    if (!accountId) {
      setError("Por favor selecione uma conta.")
      setIsSubmitting(false)
      return
    }

    try {
      await addTransaction({
        amount: Number.parseFloat(amount),
        description,
        date: new Date(date).toISOString(),
        type,
        category,
        accountId,
        isRecurring,
      })

      setAmount("")
      setDescription("")
      setDate(new Date().toISOString().split("T")[0])
      setCategory("")
      setAccountId("")
      setIsRecurring(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("[v0] Error in transaction form:", err)
      setError("Erro ao adicionar transação. Por favor tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableCategories = categories.filter((c) => c.type === type)
  const currencySymbol = getCurrencySymbol(currency)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">{error}</div>}

      {accounts.length === 0 && (
        <div className="text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg">
          Ainda não tem contas criadas. Por favor crie uma conta primeiro.
        </div>
      )}

      {availableCategories.length === 0 && (
        <div className="text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg">
          Não existem categorias para este tipo de transação. Por favor crie uma categoria primeiro nas Definições.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v as TransactionType)
              setCategory("")
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
              <SelectItem value="investment">Investimento</SelectItem>
              <SelectItem value="savings">Poupança</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor ({currencySymbol})</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="font-mono"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Ex: Compras Supermercado"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={category}
            onValueChange={setCategory}
            disabled={isSubmitting || availableCategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={availableCategories.length === 0 ? "Sem categorias" : "Selecione..."} />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">Conta</Label>
        <Select value={accountId} onValueChange={setAccountId} disabled={isSubmitting || accounts.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder={accounts.length === 0 ? "Sem contas" : "Selecione a conta de origem/destino"} />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="recurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          disabled={isSubmitting}
        />
        <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
          Transação Recorrente (Mensal)
        </Label>
      </div>

      <DialogFooter>
        <Button
          type="submit"
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          disabled={isSubmitting || accounts.length === 0 || availableCategories.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />A adicionar...
            </>
          ) : (
            "Adicionar Transação"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
