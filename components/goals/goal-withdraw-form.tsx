"use client"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Loader2, Wallet, Target, Banknote } from "lucide-react"

interface GoalWithdrawFormProps {
  goalId: string
  onSuccess?: () => void
}

export function GoalWithdrawForm({ goalId, onSuccess }: GoalWithdrawFormProps) {
  const { accounts, goals, updateAccount, updateGoal, addTransaction } = useFinance()
  const { formatCurrency } = useCurrency()
  const [selectedAccount, setSelectedAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const goal = goals.find((g) => g.id === goalId)

  const handleWithdraw = async () => {
    if (!selectedAccount || !amount || !goal) {
      setError("Preencha todos os campos")
      return
    }

    const withdrawAmount = Number.parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Introduza um valor válido")
      return
    }

    if (goal.currentAmount < withdrawAmount) {
      setError(`Saldo insuficiente na meta. Disponível: ${formatCurrency(goal.currentAmount)}`)
      return
    }

    const account = accounts.find((a) => a.id === selectedAccount)
    if (!account) {
      setError("Conta não encontrada")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Update goal current amount (subtract)
      await updateGoal(goalId, {
        currentAmount: goal.currentAmount - withdrawAmount,
      })

      // Update account balance (add)
      await updateAccount(selectedAccount, {
        balance: account.balance + withdrawAmount,
      })

      // Record the transaction
      await addTransaction({
        date: new Date().toISOString().split("T")[0],
        description: `Levantamento da meta: ${goal.name}`,
        amount: withdrawAmount,
        type: "income",
        category: "goals",
        accountId: selectedAccount,
        goalId: goalId,
      })

      setAmount("")
      setSelectedAccount("")
      onSuccess?.()
    } catch (err) {
      console.error("[v0] Withdraw error:", err)
      setError("Erro ao processar levantamento. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdrawAll = () => {
    if (goal) {
      setAmount(goal.currentAmount.toString())
    }
  }

  const selectedAccountData = accounts.find((a) => a.id === selectedAccount)

  if (!goal) {
    return <div className="text-center text-muted-foreground">Meta não encontrada</div>
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

      {/* Goal Info Card */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-medium">{goal.name}</p>
            <p className="text-sm text-muted-foreground">
              Saldo disponível:{" "}
              <span className="font-semibold text-amber-600">{formatCurrency(goal.currentAmount)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <ArrowRight className="h-4 w-4" />
            <Wallet className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account">Para (Conta de Destino)</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount} disabled={isSubmitting}>
            <SelectTrigger id="account">
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Valor a levantar</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-100"
              onClick={handleWithdrawAll}
            >
              <Banknote className="h-3 w-3 mr-1" />
              Levantar Tudo
            </Button>
          </div>
          <Input
            id="amount"
            type="number"
            min="0"
            max={goal.currentAmount}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">Disponível na meta: {formatCurrency(goal.currentAmount)}</p>
        </div>

        {selectedAccountData && amount && Number.parseFloat(amount) > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm space-y-1">
            <p className="text-emerald-700 dark:text-emerald-300">
              Novo saldo da conta: {formatCurrency(selectedAccountData.balance + Number.parseFloat(amount))}
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Novo saldo da meta: {formatCurrency(goal.currentAmount - Number.parseFloat(amount))}
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handleWithdraw}
        disabled={isSubmitting || !selectedAccount || !amount || Number.parseFloat(amount) <= 0}
        className="w-full bg-amber-600 hover:bg-amber-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />A processar...
          </>
        ) : (
          <>
            <ArrowRight className="mr-2 h-4 w-4" />
            Levantar para Conta
          </>
        )}
      </Button>
    </div>
  )
}
