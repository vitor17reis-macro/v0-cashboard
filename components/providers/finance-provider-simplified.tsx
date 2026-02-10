"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { FinanceContextType } from "@/lib/types"
import { useTransactions } from "@/features/transactions/hooks/use-transactions"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { useGoals } from "@/features/goals/hooks/use-goals"
import { useCategories } from "@/hooks/use-categories"
import { useRules } from "@/features/automations/hooks/use-rules"

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Load user and initialize all data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error("[v0] Error loading user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [supabase])

  // Use all domain-specific hooks
  const transactions = useTransactions()
  const accounts = useAccounts()
  const goals = useGoals()
  const categories = useCategories()
  const rules = useRules()

  // Compute summary data
  const summary = {
    totalIncome: transactions.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
    totalBalance: accounts.accounts.reduce((sum, a) => sum + a.balance, 0),
    totalGoalsAmount: goals.goals.reduce((sum, g) => sum + g.currentAmount, 0),
    totalGoalsTarget: goals.goals.reduce((sum, g) => sum + g.targetAmount, 0),
  }

  // Compute budget status
  const budgetStatus = categories.categories.map((cat) => {
    const spent = transactions.transactions
      .filter((t) => t.type === "expense" && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      category: cat.name,
      budget: cat.budget,
      spent,
      remaining: Math.max(0, cat.budget - spent),
      percentage: cat.budget > 0 ? Math.round((spent / cat.budget) * 100) : 0,
      exceeded: spent > cat.budget,
    }
  })

  // Compute advanced analytics
  const advancedAnalysis = {
    savingsRate: summary.totalIncome > 0 ? ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100 : 0,
    averageTransaction: transactions.transactions.length > 0 ? summary.totalExpense / transactions.transactions.length : 0,
    categoryBreakdown: categories.categories.map((cat) => {
      const amount = transactions.transactions
        .filter((t) => t.type === "expense" && t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0)
      return {
        name: cat.name,
        value: amount,
        percentage: summary.totalExpense > 0 ? (amount / summary.totalExpense) * 100 : 0,
      }
    }),
  }

  const contextValue: FinanceContextType = {
    // Data
    transactions: transactions.transactions,
    accounts: accounts.accounts,
    goals: goals.goals,
    categories: categories.categories,
    rules: rules.rules,
    isLoading,
    userId,

    // Transaction operations
    addTransaction: transactions.addTransaction,
    deleteTransaction: transactions.deleteTransaction,
    loadTransactions: transactions.loadTransactions,

    // Account operations
    loadAccounts: accounts.loadAccounts,
    addAccount: accounts.addAccount,
    updateAccount: accounts.updateAccount,
    deleteAccount: accounts.deleteAccount,

    // Goal operations
    loadGoals: goals.loadGoals,
    addGoal: goals.addGoal,
    updateGoal: goals.updateGoal,
    deleteGoal: goals.deleteGoal,

    // Category operations
    loadCategories: categories.loadCategories,
    addCategory: categories.addCategory,
    updateCategory: categories.updateCategory,
    deleteCategory: categories.deleteCategory,

    // Rule operations
    addRule: rules.addRule,
    updateRule: rules.updateRule,
    deleteRule: rules.deleteRule,
    loadRules: rules.loadRules,

    // Summary data
    getSummary: () => summary,
    getBudgetStatus: () => budgetStatus,
    getAdvancedAnalysis: () => advancedAnalysis,
  }

  return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider")
  }
  return context
}
