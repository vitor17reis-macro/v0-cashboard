export type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  accountId: string
  toAccountId?: string
  goalId?: string
  isRecurring: boolean
  recurringFrequency?: string
  nextDueDate?: string
  ruleId?: string
}
