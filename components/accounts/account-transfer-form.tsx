"use client"

import type React from "react"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Loader2 } from "lucide-react"

interface AccountTransferFormProps {
  onSuccess?: () => void
}

export function AccountTransferForm({ onSuccess }: AccountTransferFormProps) {
  const { accounts, addTransaction, updateAccount } = useFinance()
  const { formatCurrency } = useCurrency()
  const [fromAccountId, setFromAccountId] = useState("")
  const [toAccountId, setToAccountId] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toAccount = accounts.find((a) => a.id === toAccountId)
  const transferAmount = Number.parseFloat(amount) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!fromAccountId || !toAccountId) {
      setError("Selecione as contas de origem e destino")
      return
    }

    if (fromAccountId === toAccountId) {
      setError("As contas de origem e destino têm de ser diferentes")
      return
    }

    if (transferAmount <= 0) {
      setError("O valor tem de ser maior que zero")
      return
    }

    if (fromAccount && transferAmount > fromAccount.balance) {
      setError("Saldo insuficiente na conta de origem")
      return
    }

    setIsSubmitting(true)

    try {
      // Update source account (subtract)
      if (fromAccount) {
        await updateAccount(fromAccountId, {
          balance: fromAccount.balance - transferAmount,
        })
      }

      // Update destination account (add)
      if (toAccount) {
        await updateAccount(toAccountId, {
          balance: toAccount.balance + transferAmount,
        })
      }

      // Create transfer transaction for tracking
      await addTransaction({
        date: new Date().toISOString(),
        description: description || `Transferência: ${fromAccount?.name} → ${toAccount?.name}`,
        amount: transferAmount,
        type: "transfer",
        category: "transfer",
        accountId: fromAccountId,
      })

      onSuccess?.()
    } catch (err) {
      console.error("[v0] Transfer error:", err)
      setError("Erro ao processar transferência. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
        <div className="space-y-2">
          <Label>Conta de Origem</Label>
          <Select value={fromAccountId} onValueChange={setFromAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                    <span>{account.name}</span>
                    <span className="text-muted-foreground ml-auto">{formatCurrency(account.balance)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fromAccount && (
            <p className="text-xs text-muted-foreground">Disponível: {formatCurrency(fromAccount.balance)}</p>
          )}
        </div>

        <div className="flex items-center justify-center pb-6">
          <div className="p-2 rounded-full bg-primary/10">
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Conta de Destino</Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.id !== fromAccountId)
                .map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                      <span>{account.name}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor a Transferir</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input
          id="description"
          placeholder="Ex: Transferência para poupança"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {fromAccount && toAccount && transferAmount > 0 && (
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium">Resumo da Transferência</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: fromAccount.color }}>
              {fromAccount.name}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: toAccount.color }}>
              {toAccount.name}
            </span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(transferAmount)}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />A processar...
          </>
        ) : (
          "Transferir"
        )}
      </Button>
    </form>
  )
}
