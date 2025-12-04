"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  type Transaction,
  type Category,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
  type TransactionType,
  type Period,
  type Budget,
  type Account,
  type Goal,
  type AutoRule,
  type RuleExecution,
} from "@/lib/types"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
} from "date-fns"

interface FinanceContextType {
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  accounts: Account[]
  goals: Goal[]
  period: Period
  setPeriod: (period: Period) => void
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  reverseTransaction: (id: string) => Promise<void>
  updateBudget: (categoryId: string, limit: number) => void
  addAccount: (account: Omit<Account, "id">) => Promise<void>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  addGoal: (goal: Omit<Goal, "id">) => Promise<void>
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  getSummary: () => {
    totalIncome: number
    totalExpense: number
    totalInvestment: number
    totalSavings: number
    balance: number
    totalNetWorth: number
    savingsRate: number
  }
  getBudgetStatus: (categoryId: string) => { spent: number; limit: number; percentage: number }
  isLoading: boolean
  addCategory: (category: Omit<Category, "id">) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  userId: string | null
  refreshData: () => Promise<void>
  rules: AutoRule[]
  addRule: (rule: Omit<AutoRule, "id" | "executionCount">) => void
  updateRule: (id: string, updates: Partial<AutoRule>) => void
  deleteRule: (id: string) => void
  executeRule: (ruleId: string) => Promise<void>
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [period, setPeriod] = useState<Period>("month")
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [rules, setRules] = useState<AutoRule[]>([])
  const [rulesLoaded, setRulesLoaded] = useState(false)

  const supabase = createClient()

  const accountsRef = useRef(accounts)
  const goalsRef = useRef(goals)
  const rulesRef = useRef(rules)
  const userIdRef = useRef(userId)

  useEffect(() => {
    accountsRef.current = accounts
  }, [accounts])

  useEffect(() => {
    goalsRef.current = goals
  }, [goals])

  useEffect(() => {
    rulesRef.current = rules
  }, [rules])

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      setUserId(user.id)

      // Load all data in parallel
      const [categoriesRes, accountsRes, goalsRes, transactionsRes] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", user.id),
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      ])

      // Set categories or initialize with defaults
      if (categoriesRes.data && categoriesRes.data.length > 0) {
        setCategories(
          categoriesRes.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type as TransactionType,
            color: c.color,
            icon: c.icon,
            budget: c.budget || 0,
            isCustom: c.is_custom || false,
          })),
        )
      } else {
        // Initialize default categories
        const defaultCats = DEFAULT_CATEGORIES.map((c) => ({
          user_id: user.id,
          name: c.name,
          type: c.type,
          color: c.color || "#10B981",
          icon: c.icon || "tag",
          budget: c.budget || 0,
          is_custom: false,
        }))
        const { data: createdCats, error: catError } = await supabase.from("categories").insert(defaultCats).select()

        if (catError) {
          console.error("[v0] Error creating default categories:", catError)
        } else if (createdCats) {
          setCategories(
            createdCats.map((c: any) => ({
              id: c.id,
              name: c.name,
              type: c.type as TransactionType,
              color: c.color,
              icon: c.icon,
              budget: c.budget || 0,
              isCustom: false,
            })),
          )
        }
      }

      // Set accounts or initialize with defaults
      if (accountsRes.data && accountsRes.data.length > 0) {
        setAccounts(
          accountsRes.data.map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            balance: Number.parseFloat(a.balance),
            color: a.color,
            icon: a.icon,
          })),
        )
      } else {
        // Initialize default accounts
        const defaultAccs = DEFAULT_ACCOUNTS.map((a) => ({
          user_id: user.id,
          name: a.name,
          type: a.type,
          balance: a.balance,
          color: a.color,
          icon: a.icon,
        }))
        const { data: createdAccounts, error: accError } = await supabase.from("accounts").insert(defaultAccs).select()

        if (accError) {
          console.error("[v0] Error creating default accounts:", accError)
        } else if (createdAccounts) {
          setAccounts(
            createdAccounts.map((a: any) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              balance: Number.parseFloat(a.balance),
              color: a.color,
              icon: a.icon,
            })),
          )
        }
      }

      // Set goals
      if (goalsRes.data && goalsRes.data.length > 0) {
        setGoals(
          goalsRes.data.map((g: any) => ({
            id: g.id,
            name: g.name,
            targetAmount: Number.parseFloat(g.target_amount),
            currentAmount: Number.parseFloat(g.current_amount),
            deadline: g.deadline,
            color: g.color,
            icon: g.icon,
          })),
        )
      }

      // Set transactions
      if (transactionsRes.data) {
        setTransactions(
          transactionsRes.data.map((t: any) => ({
            id: t.id,
            date: t.date,
            description: t.description || "",
            amount: Number.parseFloat(t.amount),
            type: t.type as TransactionType,
            category: t.category,
            accountId: t.account_id,
            goalId: t.goal_id,
            isRecurring: t.is_recurring || false,
            recurringFrequency: t.recurring_interval as "monthly" | "weekly" | "yearly" | undefined,
            ruleId: t.rule_id,
            sourceAccountId: t.source_account_id,
            toAccountId: t.to_account_id,
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Failed to load data from Supabase:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cashboard_auto_rules")
      if (stored) {
        try {
          setRules(JSON.parse(stored))
        } catch (e) {
          console.error("[v0] Failed to parse rules:", e)
        }
      }
      setRulesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (rulesLoaded && typeof window !== "undefined") {
      localStorage.setItem("cashboard_auto_rules", JSON.stringify(rules))
    }
  }, [rules, rulesLoaded])

  // Filter transactions by period
  const filteredTransactions = transactions.filter((t) => {
    const date = parseISO(t.date)
    const now = new Date()

    let start: Date
    let end: Date

    switch (period) {
      case "day":
        start = startOfDay(now)
        end = endOfDay(now)
        break
      case "week":
        start = startOfWeek(now, { weekStartsOn: 1 })
        end = endOfWeek(now, { weekStartsOn: 1 })
        break
      case "month":
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case "year":
        start = startOfYear(now)
        end = endOfYear(now)
        break
      default:
        start = startOfMonth(now)
        end = endOfMonth(now)
    }

    return isWithinInterval(date, { start, end })
  })

  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!userId) {
      console.error("[v0] No user ID for addTransaction")
      return
    }

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: transaction.accountId || null,
          goal_id: transaction.goalId || null,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          is_recurring: transaction.isRecurring || false,
          recurring_interval: transaction.recurringFrequency || null,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding transaction:", error)
        throw error
      }

      const newTransaction: Transaction = {
        id: data.id,
        date: data.date,
        description: data.description || "",
        amount: Number.parseFloat(data.amount),
        type: data.type,
        category: data.category,
        accountId: data.account_id,
        goalId: data.goal_id,
        isRecurring: data.is_recurring,
        recurringFrequency: data.recurring_interval,
        ruleId: transaction.ruleId,
        sourceAccountId: transaction.sourceAccountId,
        toAccountId: transaction.toAccountId,
      }

      setTransactions((prev) => [newTransaction, ...prev])

      // Update account balance
      if (transaction.accountId) {
        const account = accounts.find((a) => a.id === transaction.accountId)
        if (account) {
          let newBalance = account.balance
          if (transaction.type === "income") newBalance += transaction.amount
          else if (transaction.type === "expense") newBalance -= transaction.amount

          await updateAccount(transaction.accountId, { balance: newBalance })

          // Only for income transactions (to trigger savings/investment rules)
          if (transaction.type === "income") {
            // Wait a bit for state to update, then check rules
            setTimeout(() => {
              checkAndExecuteRules(newTransaction)
            }, 500)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error in addTransaction:", error)
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!userId) return

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id)
      if (error) throw error
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("[v0] Failed to delete transaction:", error)
    }
  }

  const reverseTransaction = async (id: string) => {
    if (!userId) return

    const transaction = transactions.find((t) => t.id === id)
    if (!transaction) {
      console.error("[v0] Transaction not found for reversal:", id)
      return
    }

    try {
      const isAutomatedTransaction =
        transaction.ruleId ||
        transaction.description?.includes("Automação:") ||
        transaction.category === "Transferência Automática" ||
        transaction.category === "Poupança Automática"

      if (isAutomatedTransaction) {
        // Find the source account (where money was taken from)
        const sourceAccountId = transaction.sourceAccountId || transaction.accountId
        const sourceAccount = sourceAccountId ? accounts.find((a) => a.id === sourceAccountId) : null

        // Find the destination (account or goal)
        let destinationAccount = null
        let destinationGoal = null

        if (transaction.toAccountId) {
          destinationAccount = accounts.find((a) => a.id === transaction.toAccountId)
        } else if (transaction.goalId) {
          destinationGoal = goals.find((g) => g.id === transaction.goalId)
        } else {
          // Parse from description format: "Automação: RuleName (X% de Description)"
          // Or from transfer format: "Transferência: Source → Destination"
          const transferMatch = transaction.description?.match(/Transferência: (.+) → (.+)/)
          if (transferMatch) {
            const destName = transferMatch[2]
            destinationAccount = accounts.find((a) => a.name === destName)
            if (!destinationAccount) {
              destinationGoal = goals.find((g) => g.name === destName)
            }
          }
        }

        // Reverse the balances
        if (sourceAccount) {
          // Add money back to source account
          await updateAccount(sourceAccount.id, { balance: sourceAccount.balance + transaction.amount })
        }

        if (destinationAccount) {
          // Remove money from destination account
          await updateAccount(destinationAccount.id, { balance: destinationAccount.balance - transaction.amount })
        } else if (destinationGoal) {
          // Remove money from destination goal
          const newAmount = Math.max(0, destinationGoal.currentAmount - transaction.amount)
          await updateGoal(destinationGoal.id, { currentAmount: newAmount })
        }

        if (transaction.ruleId) {
          const rule = rules.find((r) => r.id === transaction.ruleId)
          if (rule && rule.executionCount > 0) {
            // Update rule to decrement execution count and mark execution as reversed
            const updatedExecutions = (rule.executions || []).map((exec) =>
              exec.triggerTransactionId === id || exec.id === id
                ? { ...exec, status: "reversed" as const, reversedAt: new Date().toISOString() }
                : exec,
            )
            updateRuleFunc(transaction.ruleId, {
              executionCount: rule.executionCount - 1,
              executions: updatedExecutions,
            })
          }
        }
      } else if (transaction.type === "transfer" && transaction.description) {
        const transferMatch = transaction.description.match(/Transferência: (.+) → (.+)/)
        if (transferMatch) {
          const sourceAccountName = transferMatch[1]
          const destAccountName = transferMatch[2]

          const sourceAccount = accounts.find((a) => a.name === sourceAccountName)
          const destAccount = accounts.find((a) => a.name === destAccountName)

          if (sourceAccount && destAccount) {
            await updateAccount(sourceAccount.id, { balance: sourceAccount.balance + transaction.amount })
            await updateAccount(destAccount.id, { balance: destAccount.balance - transaction.amount })
          }
        }
      } else if (transaction.accountId) {
        // Regular transaction reversal
        const account = accounts.find((a) => a.id === transaction.accountId)
        if (account) {
          let newBalance = account.balance

          if (transaction.type === "income") {
            newBalance -= transaction.amount
          } else {
            newBalance += transaction.amount
          }

          await updateAccount(transaction.accountId, { balance: newBalance })
        }
      }

      // If this was a goal deposit, update the goal
      if (transaction.goalId && (transaction.type === "savings" || transaction.type === "transfer")) {
        const goal = goals.find((g) => g.id === transaction.goalId)
        if (goal) {
          const newCurrentAmount = Math.max(0, goal.currentAmount - transaction.amount)
          await updateGoal(transaction.goalId, { currentAmount: newCurrentAmount })
        }
      }

      // Delete the transaction
      const { error } = await supabase.from("transactions").delete().eq("id", id)
      if (error) throw error

      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("[v0] Failed to reverse transaction:", error)
      throw error
    }
  }

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      if (!userIdRef.current) return

      try {
        const { error } = await supabase
          .from("accounts")
          .update({
            name: updates.name,
            type: updates.type,
            balance: updates.balance,
            color: updates.color,
            icon: updates.icon,
          })
          .eq("id", id)

        if (error) throw error

        setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
      } catch (error) {
        console.error("[v0] Failed to update account:", error)
      }
    },
    [supabase],
  )

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      if (!userIdRef.current) return

      try {
        const { error } = await supabase
          .from("goals")
          .update({
            name: updates.name,
            target_amount: updates.targetAmount,
            current_amount: updates.currentAmount,
            deadline: updates.deadline,
            color: updates.color,
            icon: updates.icon,
          })
          .eq("id", id)

        if (error) throw error

        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)))
      } catch (error) {
        console.error("[v0] Failed to update goal:", error)
      }
    },
    [supabase],
  )

  const addAccount = async (account: Omit<Account, "id">) => {
    if (!userId) {
      console.error("[v0] No user ID for addAccount")
      return
    }

    try {
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          name: account.name,
          type: account.type,
          balance: account.balance,
          color: account.color,
          icon: account.icon || account.type,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding account:", error)
        throw error
      }

      const newAccount: Account = {
        id: data.id,
        name: data.name,
        type: data.type,
        balance: Number.parseFloat(data.balance),
        color: data.color,
        icon: data.icon,
      }

      setAccounts((prev) => [...prev, newAccount])
    } catch (error) {
      console.error("[v0] Failed to add account:", error)
    }
  }

  const deleteAccount = async (id: string) => {
    if (!userId) return

    try {
      const { error } = await supabase.from("accounts").delete().eq("id", id)
      if (error) throw error
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      console.error("[v0] Failed to delete account:", error)
    }
  }

  const addGoal = async (goal: Omit<Goal, "id">) => {
    if (!userId) {
      console.error("[v0] No user ID for addGoal")
      return
    }

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          deadline: goal.deadline || null,
          color: goal.color,
          icon: goal.icon || "target",
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding goal:", error)
        throw error
      }

      const newGoal: Goal = {
        id: data.id,
        name: data.name,
        targetAmount: Number.parseFloat(data.target_amount),
        currentAmount: Number.parseFloat(data.current_amount),
        deadline: data.deadline,
        color: data.color,
        icon: data.icon,
      }

      setGoals((prev) => [...prev, newGoal])
    } catch (error) {
      console.error("[v0] Failed to add goal:", error)
    }
  }

  const deleteGoal = async (id: string) => {
    if (!userId) return

    try {
      const { error } = await supabase.from("goals").delete().eq("id", id)
      if (error) throw error
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (error) {
      console.error("[v0] Failed to delete goal:", error)
    }
  }

  const addCategory = async (category: Omit<Category, "id">) => {
    if (!userId) {
      console.error("[v0] No user ID for addCategory")
      return
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          name: category.name,
          type: category.type,
          color: category.color || "#10B981",
          icon: category.icon || "tag",
          budget: category.budget || 0,
          is_custom: true,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding category:", error)
        throw error
      }

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        budget: data.budget || 0,
        isCustom: true,
      }

      setCategories((prev) => [...prev, newCategory])
    } catch (error) {
      console.error("[v0] Failed to add category:", error)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!userId) return

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)
      if (error) throw error
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error("[v0] Failed to delete category:", error)
    }
  }

  const updateBudget = (categoryId: string, limit: number) => {
    setBudgets((prev) => {
      const existing = prev.find((b) => b.categoryId === categoryId)
      if (existing) {
        return prev.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b))
      }
      return [...prev, { categoryId, limit }]
    })
  }

  const getSummary = () => {
    const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
    const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
    const totalInvestment = filteredTransactions
      .filter((t) => t.type === "investment")
      .reduce((acc, t) => acc + t.amount, 0)
    const totalSavings = filteredTransactions.filter((t) => t.type === "savings").reduce((acc, t) => acc + t.amount, 0)
    const totalNetWorth = accounts.reduce((acc, a) => acc + a.balance, 0)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0

    return {
      totalIncome,
      totalExpense,
      totalInvestment,
      totalSavings,
      balance: totalIncome - totalExpense - totalInvestment - totalSavings,
      totalNetWorth,
      savingsRate,
    }
  }

  const getBudgetStatus = (categoryId: string) => {
    const budget = budgets.find((b) => b.categoryId === categoryId)
    const spent = filteredTransactions.filter((t) => t.category === categoryId).reduce((acc, t) => acc + t.amount, 0)

    return {
      spent,
      limit: budget?.limit || 0,
      percentage: budget?.limit ? (spent / budget.limit) * 100 : 0,
    }
  }

  const addRule = useCallback((rule: Omit<AutoRule, "id" | "executionCount">) => {
    const newRule: AutoRule = {
      ...rule,
      id: crypto.randomUUID(),
      executionCount: 0,
      executions: [],
    }
    setRules((prev) => [...prev, newRule])
  }, [])

  const updateRuleFunc = useCallback((id: string, updates: Partial<AutoRule>) => {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
  }, [])

  const deleteRuleFunc = useCallback((id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }, [])

  const executeRule = useCallback(
    async (ruleId: string) => {
      const currentRules = rulesRef.current
      const currentAccounts = accountsRef.current
      const currentGoals = goalsRef.current

      const rule = currentRules.find((r) => r.id === ruleId)
      if (!rule || !rule.enabled) return

      // Find matching transactions from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const matchingTransactions = transactions.filter((t) => {
        if (new Date(t.date) < thirtyDaysAgo) return false

        switch (rule.trigger.type) {
          case "income_received":
            return t.type === "income" && t.category?.toLowerCase().includes(rule.trigger.value.toLowerCase())
          case "expense_contains":
            return t.type === "expense" && t.description?.toLowerCase().includes(rule.trigger.value.toLowerCase())
          case "amount_above":
            return t.amount >= Number.parseFloat(rule.trigger.value)
          case "category_match":
            return t.category === rule.trigger.category
          default:
            return false
        }
      })

      if (matchingTransactions.length === 0) return

      // Calculate total amount to transfer
      let totalAmount = 0
      for (const t of matchingTransactions) {
        if (rule.action.type === "transfer_percentage" && rule.action.percentage) {
          totalAmount += (t.amount * rule.action.percentage) / 100
        } else if (rule.action.type === "transfer_fixed" && rule.action.fixedAmount) {
          totalAmount += rule.action.fixedAmount
        }
      }

      if (totalAmount <= 0) return

      // Execute the transfer
      const sourceAccount = currentAccounts.find((a) => a.type === "checking")
      if (!sourceAccount || sourceAccount.balance < totalAmount) return

      if (rule.action.targetAccountId) {
        const targetAccount = currentAccounts.find((a) => a.id === rule.action.targetAccountId)
        if (targetAccount) {
          await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - totalAmount })
          await updateAccount(targetAccount.id, { balance: targetAccount.balance + totalAmount })
        }
      } else if (rule.action.targetGoalId) {
        const targetGoal = currentGoals.find((g) => g.id === rule.action.targetGoalId)
        if (targetGoal) {
          await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - totalAmount })
          await updateGoal(targetGoal.id, { currentAmount: targetGoal.currentAmount + totalAmount })
        }
      }

      // Update rule execution count
      updateRuleFunc(ruleId, {
        lastExecuted: new Date().toISOString(),
        executionCount: rule.executionCount + 1,
      })
    },
    [transactions, updateAccount, updateGoal, updateRuleFunc, supabase],
  )

  const checkAndExecuteRules = useCallback(
    async (transaction: Transaction) => {
      const currentRules = rulesRef.current
      const currentAccounts = accountsRef.current
      const currentGoals = goalsRef.current
      const currentUserId = userIdRef.current

      const enabledRules = currentRules.filter((r) => r.enabled)

      for (const rule of enabledRules) {
        let matches = false

        switch (rule.trigger.type) {
          case "income_received":
            matches =
              transaction.type === "income" &&
              (transaction.category?.toLowerCase().includes(rule.trigger.value.toLowerCase()) ||
                transaction.description?.toLowerCase().includes(rule.trigger.value.toLowerCase()))
            break
          case "expense_contains":
            matches =
              transaction.type === "expense" &&
              transaction.description?.toLowerCase().includes(rule.trigger.value.toLowerCase())
            break
          case "amount_above":
            matches = transaction.amount >= Number.parseFloat(rule.trigger.value)
            break
          case "category_match":
            matches = transaction.category === rule.trigger.category
            break
        }

        if (!matches) continue

        // Calculate transfer amount
        let transferAmount = 0
        if (rule.action.type === "transfer_percentage" && rule.action.percentage) {
          transferAmount = (transaction.amount * rule.action.percentage) / 100
        } else if (rule.action.type === "transfer_fixed" && rule.action.fixedAmount) {
          transferAmount = rule.action.fixedAmount
        } else if (rule.action.type === "categorize") {
          continue
        }

        if (transferAmount <= 0) continue

        // Find source account
        const sourceAccount = currentAccounts.find((a) => a.id === transaction.accountId)
        if (!sourceAccount || sourceAccount.balance < transferAmount) continue

        const executionId = crypto.randomUUID()
        const executionRecord: RuleExecution = {
          id: executionId,
          ruleId: rule.id,
          date: new Date().toISOString(),
          triggerTransactionId: transaction.id,
          triggerDescription: transaction.description || "",
          amount: transferAmount,
          sourceAccountId: sourceAccount.id,
          targetAccountId: rule.action.targetAccountId,
          targetGoalId: rule.action.targetGoalId,
          status: "executed",
        }

        // Execute transfer to target account or goal
        if (rule.action.targetAccountId) {
          const targetAccount = currentAccounts.find((a) => a.id === rule.action.targetAccountId)
          if (targetAccount) {
            await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - transferAmount })
            await updateAccount(targetAccount.id, { balance: targetAccount.balance + transferAmount })

            const newTransactionId = crypto.randomUUID()
            await supabase.from("transactions").insert({
              id: newTransactionId,
              user_id: currentUserId,
              account_id: sourceAccount.id,
              amount: transferAmount,
              type: "transfer",
              category: "Transferência Automática",
              description: `Automação: ${rule.name} (${rule.action.percentage}% de ${transaction.description})`,
              date: new Date().toISOString().split("T")[0],
              rule_id: rule.id,
              source_account_id: sourceAccount.id,
              to_account_id: targetAccount.id,
            })

            setTransactions((prev) => [
              {
                id: newTransactionId,
                date: new Date().toISOString().split("T")[0],
                description: `Automação: ${rule.name} (${rule.action.percentage}% de ${transaction.description})`,
                amount: transferAmount,
                type: "transfer",
                category: "Transferência Automática",
                accountId: sourceAccount.id,
                toAccountId: targetAccount.id,
                sourceAccountId: sourceAccount.id,
                ruleId: rule.id,
              },
              ...prev,
            ])

            updateRuleFunc(rule.id, {
              lastExecuted: new Date().toISOString(),
              executionCount: rule.executionCount + 1,
              executions: [...(rule.executions || []), executionRecord],
            })
          }
        } else if (rule.action.targetGoalId) {
          const targetGoal = currentGoals.find((g) => g.id === rule.action.targetGoalId)
          if (targetGoal) {
            await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - transferAmount })
            await updateGoal(targetGoal.id, { currentAmount: targetGoal.currentAmount + transferAmount })

            const newTransactionId = crypto.randomUUID()
            await supabase.from("transactions").insert({
              id: newTransactionId,
              user_id: currentUserId,
              account_id: sourceAccount.id,
              goal_id: targetGoal.id,
              amount: transferAmount,
              type: "savings",
              category: "Poupança Automática",
              description: `Automação: ${rule.name} (${rule.action.percentage}% de ${transaction.description})`,
              date: new Date().toISOString().split("T")[0],
              rule_id: rule.id,
              source_account_id: sourceAccount.id,
            })

            setTransactions((prev) => [
              {
                id: newTransactionId,
                date: new Date().toISOString().split("T")[0],
                description: `Automação: ${rule.name} (${rule.action.percentage}% de ${transaction.description})`,
                amount: transferAmount,
                type: "savings",
                category: "Poupança Automática",
                accountId: sourceAccount.id,
                goalId: targetGoal.id,
                sourceAccountId: sourceAccount.id,
                ruleId: rule.id,
              },
              ...prev,
            ])

            updateRuleFunc(rule.id, {
              lastExecuted: new Date().toISOString(),
              executionCount: rule.executionCount + 1,
              executions: [...(rule.executions || []), executionRecord],
            })
          }
        }
      }
    },
    [transactions, updateAccount, updateGoal, updateRuleFunc, supabase],
  )

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        filteredTransactions,
        categories,
        budgets,
        accounts,
        goals,
        period,
        setPeriod,
        addTransaction,
        deleteTransaction,
        reverseTransaction,
        updateBudget,
        addAccount,
        updateAccount,
        deleteAccount,
        addGoal,
        updateGoal,
        deleteGoal,
        getSummary,
        getBudgetStatus,
        isLoading,
        addCategory,
        deleteCategory,
        userId,
        refreshData: loadData,
        rules,
        addRule,
        updateRule: updateRuleFunc,
        deleteRule: deleteRuleFunc,
        executeRule,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  return context ?? null
}
