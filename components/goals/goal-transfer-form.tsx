"use client"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Loader2, Wallet, Target } from "lucide-react"

interface GoalTransferFormProps {
  goalId?: string
  onSuccess?: () => void
}

export function GoalTransferForm({ goalId, onSuccess }: GoalTransferFormProps) {
  const { accounts, goals, updateAccount, updateGoal, addTransaction, userId } = useFinance()
  const { formatCurrency } = useCurrency()
  const [selectedAccount, setSelectedAccount] = useState("")
  const [selectedGoal, setSelectedGoal] = useState(goalId || "")
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTransfer = async () => {
    if (!selectedAccount || !selectedGoal || !amount) {
      setError("Preencha todos os campos")
      return
    }

    const transferAmount = Number.parseFloat(amount)
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError("Introduza um valor válido")
      return
    }

    const account = accounts.find((a) => a.id === selectedAccount)
    const goal = goals.find((g) => g.id === selectedGoal)

    if (!account || !goal) {
      setError("Conta ou meta não encontrada")
      return
    }

    if (account.balance < transferAmount) {
      setError(`Saldo insuficiente. Disponível: ${formatCurrency(account.balance)}`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Update account balance (subtract)
      await updateAccount(selectedAccount, {
        balance: account.balance - transferAmount,
      })

      // Update goal current amount (add)
      await updateGoal(selectedGoal, {
        currentAmount: goal.currentAmount + transferAmount,
      })

      await addTransaction({
        date: new Date().toISOString().split("T")[0],
        description: `Transferência para meta: ${goal.name}`,
        amount: transferAmount,
        type: "savings",
        category: "goals",
        accountId: selectedAccount,
        goalId: selectedGoal,
      })

      setAmount("")
      setSelectedAccount("")
      if (!goalId) setSelectedGoal("")
      onSuccess?.()
    } catch (err) {
      console.error("[v0] Transfer error:", err)
      setError("Erro ao processar transferência. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedAccountData = accounts.find((a) => a.id === selectedAccount)
  const selectedGoalData = goals.find((g) => g.id === selectedGoal)

  return (
    <div className="space-y-4">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="account">De (Conta)</Label>
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

        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <ArrowRight className="h-4 w-4" />
            <Target className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Para (Meta)</Label>
          <Select value={selectedGoal} onValueChange={setSelectedGoal} disabled={isSubmitting || !!goalId}>
            <SelectTrigger id="goal">
              <SelectValue placeholder="Selecionar meta" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => {
                const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                const remaining = goal.targetAmount - goal.currentAmount
                return (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
                      <span>{goal.name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">
                        {percentage.toFixed(0)}% - Falta {formatCurrency(remaining)}
                      </span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor a transferir</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
          />
          {selectedAccountData && (
            <p className="text-xs text-muted-foreground">
              Saldo disponível: {formatCurrency(selectedAccountData.balance)}
            </p>
          )}
        </div>

        {selectedGoalData && amount && Number.parseFloat(amount) > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm">
            <p className="text-emerald-700 dark:text-emerald-300">
              Após transferência: {formatCurrency(selectedGoalData.currentAmount + Number.parseFloat(amount))} de{" "}
              {formatCurrency(selectedGoalData.targetAmount)} (
              {Math.min(
                ((selectedGoalData.currentAmount + Number.parseFloat(amount)) / selectedGoalData.targetAmount) * 100,
                100,
              ).toFixed(0)}
              %)
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handleTransfer}
        disabled={isSubmitting || !selectedAccount || !selectedGoal || !amount}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />A processar...
          </>
        ) : (
          <>
            <ArrowRight className="mr-2 h-4 w-4" />
            Transferir para Meta
          </>
        )}
      </Button>
    </div>
  )
}
