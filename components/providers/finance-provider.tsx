"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
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

  const supabase = createClient()

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
      }

      setTransactions((prev) => [newTransaction, ...prev])

      // Update account balance
      if (transaction.accountId) {
        const account = accounts.find((a) => a.id === transaction.accountId)
        if (account) {
          let newBalance = account.balance
          if (transaction.type === "income") newBalance += transaction.amount
          else newBalance -= transaction.amount

          await updateAccount(transaction.accountId, { balance: newBalance })
        }
      }
    } catch (error) {
      console.error("[v0] Failed to add transaction:", error)
      throw error
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
      // First, update account balance (reverse the effect)
      if (transaction.accountId) {
        const account = accounts.find((a) => a.id === transaction.accountId)
        if (account) {
          let newBalance = account.balance

          // Reverse the transaction effect
          if (transaction.type === "income") {
            // Income added money, so we subtract
            newBalance -= transaction.amount
          } else {
            // Expense/investment/savings removed money, so we add back
            newBalance += transaction.amount
          }

          await updateAccount(transaction.accountId, { balance: newBalance })
        }
      }

      // If this was a goal deposit (savings with goalId), update the goal
      if (transaction.goalId && transaction.type === "savings") {
        const goal = goals.find((g) => g.id === transaction.goalId)
        if (goal) {
          const newCurrentAmount = Math.max(0, goal.currentAmount - transaction.amount)
          await updateGoal(transaction.goalId, { currentAmount: newCurrentAmount })
        }
      }

      // Now delete the transaction
      const { error } = await supabase.from("transactions").delete().eq("id", id)
      if (error) throw error

      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("[v0] Failed to reverse transaction:", error)
      throw error
    }
  }

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
      throw error
    }
  }

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (!userId) return

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
      throw error
    }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!userId) return

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
      throw error
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
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider")
  }
  return context
}
