"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type {
  Transaction,
  Category,
  Account,
  Period,
  Goal,
  AutoRule,
  RuleExecution,
  InvestmentEntry,
  SavingsEntry,
} from "@/lib/types"
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from "@/lib/types"
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

// Define Budget and TransactionType types
interface Budget {
  categoryId: string
  limit: number
}

type TransactionType = "income" | "expense" | "transfer" | "investment" | "savings"

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
  addRule: (rule: Omit<AutoRule, "id" | "executionCount" | "executions">) => void
  updateRule: (id: string, updates: Partial<AutoRule>) => void
  deleteRule: (id: string) => void
  executeRule: (ruleId: string) => Promise<void>
  investmentEntries: InvestmentEntry[]
  savingsEntries: SavingsEntry[]
  addInvestmentEntry: (entry: Omit<InvestmentEntry, "id">) => void
  addSavingsEntry: (entry: Omit<SavingsEntry, "id">) => void
  deleteInvestmentEntry: (id: string) => void
  deleteSavingsEntry: (id: string) => void
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

interface FinanceProviderProps {
  children: ReactNode
  userId?: string
}

export function FinanceProvider({ children, userId: initialUserId }: FinanceProviderProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [period, setPeriod] = useState<Period>("month")
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(initialUserId || null)
  const [rules, setRules] = useState<AutoRule[]>([])
  const [investmentEntries, setInvestmentEntries] = useState<InvestmentEntry[]>([])
  const [savingsEntries, setSavingsEntries] = useState<SavingsEntry[]>([])
  const [rulesLoaded, setRulesLoaded] = useState(false)

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )

  const accountsRef = useRef(accounts)
  const goalsRef = useRef(goals)
  const rulesRef = useRef(rules)
  const userIdRef = useRef(userId)
  const budgetsRef = useRef(budgets)

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

  useEffect(() => {
    budgetsRef.current = budgets
  }, [budgets])

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const savedInvestments = localStorage.getItem(`investments_${userId}`)
      const savedSavings = localStorage.getItem(`savings_${userId}`)
      if (savedInvestments) setInvestmentEntries(JSON.parse(savedInvestments))
      if (savedSavings) setSavingsEntries(JSON.parse(savedSavings))
    }
  }, [userId])

  useEffect(() => {
    if (typeof window !== "undefined" && userId && investmentEntries.length > 0) {
      localStorage.setItem(`investments_${userId}`, JSON.stringify(investmentEntries))
    }
  }, [investmentEntries, userId])

  useEffect(() => {
    if (typeof window !== "undefined" && userId && savingsEntries.length > 0) {
      localStorage.setItem(`savings_${userId}`, JSON.stringify(savingsEntries))
    }
  }, [savingsEntries, userId])

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
      const [categoriesRes, accountsRes, goalsRes, transactionsRes, budgetsRes] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", user.id),
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("budgets").select("*").eq("user_id", user.id),
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
              type: c.type,
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

      // Set budgets
      if (budgetsRes.data && budgetsRes.data.length > 0) {
        setBudgets(
          budgetsRes.data.map((b: any) => ({
            categoryId: b.category_id,
            limit: Number.parseFloat(b.limit),
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
  const filteredTransactions = useMemo(() => {
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

    return transactions.filter((t) => {
      const date = parseISO(t.date)
      return isWithinInterval(date, { start, end })
    })
  }, [transactions, period])

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
      // Handle transfer transactions (including automation transfers)
      if (transaction.type === "transfer") {
        // Check if this is from an automation (has ruleId or description starts with "Automação:")
        const isAutomation = transaction.ruleId || transaction.description?.startsWith("Automação:")

        let sourceAccount: Account | undefined
        let destAccount: Account | undefined

        const transferMatch = transaction.description?.match(/Transferência: (.+) → (.+)/)
        const automationMatch = transaction.description?.match(/Automação: .+ $$.+$$/)

        if (transferMatch) {
          const sourceAccountName = transferMatch[1]
          const destAccountName = transferMatch[2]
          sourceAccount = accounts.find((a) => a.name === sourceAccountName)
          destAccount = accounts.find((a) => a.name === destAccountName)
        } else if (transaction.accountId && transaction.toAccountId) {
          sourceAccount = accounts.find((a) => a.id === transaction.accountId)
          destAccount = accounts.find((a) => a.id === transaction.toAccountId)
        }

        if (sourceAccount && destAccount) {
          // Reverse: add back to source, remove from destination
          await updateAccount(sourceAccount.id, { balance: sourceAccount.balance + transaction.amount })
          await updateAccount(destAccount.id, { balance: destAccount.balance - transaction.amount })
        }

        // If this was from an automation, update the rule's execution count and history
        if (isAutomation && transaction.ruleId) {
          const rule = rules.find((r) => r.id === transaction.ruleId)
          if (rule) {
            const updatedExecutions = (rule.executions || []).map((exec) =>
              exec.transactionId === id ? { ...exec, reversed: true } : exec,
            )
            updateRuleFunc(transaction.ruleId, {
              lastExecuted: new Date().toISOString(),
              executionCount: Math.max(0, rule.executionCount - 1),
              executions: updatedExecutions,
            })
          }
        }
      } else if (transaction.accountId) {
        // Regular transaction reversal
        const account = accounts.find((a) => a.id === transaction.accountId)
        if (account) {
          let newBalance = account.balance

          // Reverse the transaction effect
          if (transaction.type === "income") {
            newBalance -= transaction.amount
          } else {
            newBalance += transaction.amount
          }

          await updateAccount(transaction.accountId, { balance: newBalance })
        }

        // If transferring to a goal, reverse the goal amount
        if (transaction.goalId) {
          const goal = goals.find((g) => g.id === transaction.goalId)
          if (goal) {
            await updateGoal(transaction.goalId, {
              currentAmount: Math.max(0, goal.currentAmount - transaction.amount),
            })
          }
        }
      }

      // Delete transaction from database
      await supabase.from("transactions").delete().eq("id", id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("[v0] Error reversing transaction:", error)
      throw error
    }
  }

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      const currentAccounts = accountsRef.current

      setAccounts((prev) => prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)))

      const account = currentAccounts.find((a) => a.id === id)
      if (account && userIdRef.current) {
        await supabase
          .from("accounts")
          .update({
            name: updates.name ?? account.name,
            type: updates.type ?? account.type,
            balance: updates.balance ?? account.balance,
            color: updates.color ?? account.color,
          })
          .eq("id", id)
      }
    },
    [supabase],
  )

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      const currentGoals = goalsRef.current

      setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)))

      const goal = currentGoals.find((g) => g.id === id)
      if (goal && userIdRef.current) {
        await supabase
          .from("goals")
          .update({
            name: updates.name ?? goal.name,
            target_amount: updates.targetAmount ?? goal.targetAmount,
            current_amount: updates.currentAmount ?? goal.currentAmount,
            deadline: updates.deadline ?? goal.deadline,
            color: updates.color ?? goal.color,
          })
          .eq("id", id)
      }
    },
    [supabase],
  )

  const updateRuleFunc = useCallback((id: string, updates: Partial<AutoRule>) => {
    setRules((prev) => {
      const updated = prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
      if (typeof window !== "undefined") {
        localStorage.setItem("finance_rules", JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const updateBudget = useCallback(
    (categoryId: string, limit: number) => {
      setBudgets((prev) => {
        const existing = prev.find((b) => b.categoryId === categoryId)
        if (existing) {
          return prev.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b))
        }
        return [...prev, { categoryId, limit }]
      })

      // Update in Supabase
      const userId = userIdRef.current
      if (userId) {
        supabase
          .from("budgets")
          .upsert({ user_id: userId, category_id: categoryId, limit }, { onConflict: "user_id, category_id" })
          .then(({ error }) => {
            if (error) console.error("[v0] Error updating budget:", error)
          })
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

  const getSummary = () => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
    const totalInvestment = transactions.filter((t) => t.type === "investment").reduce((acc, t) => acc + t.amount, 0)
    const totalSavings = transactions.filter((t) => t.type === "savings").reduce((acc, t) => acc + t.amount, 0)
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
    const spent = transactions.filter((t) => t.category === categoryId).reduce((acc, t) => acc + t.amount, 0)

    return {
      spent,
      limit: budget?.limit || 0,
      percentage: budget?.limit ? (spent / budget.limit) * 100 : 0,
    }
  }

  const addRule = useCallback((rule: Omit<AutoRule, "id" | "executionCount" | "executions">) => {
    const newRule: AutoRule = {
      ...rule,
      id: crypto.randomUUID(),
      executionCount: 0,
      executions: [],
    }
    setRules((rules) => [...rules, newRule])
    if (typeof window !== "undefined") {
      localStorage.setItem("finance_rules", JSON.stringify([...rules, newRule]))
    }
  }, [])

  const deleteRule = useCallback(
    (id: string) => {
      setRules((rules) => rules.filter((rule) => rule.id !== id))
      if (typeof window !== "undefined") {
        localStorage.setItem("finance_rules", JSON.stringify(rules.filter((rule) => rule.id !== id)))
      }
    },
    [rules],
  )

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

        // Find source account (the account where the income was received)
        const sourceAccount = currentAccounts.find((a) => a.id === transaction.accountId)
        if (!sourceAccount || sourceAccount.balance < transferAmount) continue

        const newTransactionId = crypto.randomUUID()

        // Execute transfer to target account or goal
        if (rule.action.targetAccountId) {
          const targetAccount = currentAccounts.find((a) => a.id === rule.action.targetAccountId)
          if (targetAccount) {
            await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - transferAmount })
            await updateAccount(targetAccount.id, { balance: targetAccount.balance + transferAmount })

            // Create transfer transaction with ruleId
            const { data } = await supabase
              .from("transactions")
              .insert({
                user_id: currentUserId,
                account_id: sourceAccount.id,
                amount: transferAmount,
                type: "transfer",
                category: "Transferência Automática",
                description: `Automação: ${rule.name} (${rule.action.percentage}% de ${transaction.description || transaction.category})`,
                date: new Date().toISOString().split("T")[0],
                rule_id: rule.id,
                to_account_id: targetAccount.id,
              })
              .select()
              .single()

            const transactionId = data?.id || newTransactionId

            // Update local state with ruleId
            setTransactions((transactions) => [
              {
                id: transactionId,
                date: new Date().toISOString().split("T")[0],
                description: `Automação: ${rule.name} (${rule.action.percentage}% de ${transaction.description || transaction.category})`,
                amount: transferAmount,
                type: "transfer",
                category: "Transferência Automática",
                accountId: sourceAccount.id,
                toAccountId: targetAccount.id,
                ruleId: rule.id,
              },
              ...transactions,
            ])

            // Create execution record
            const execution: RuleExecution = {
              id: crypto.randomUUID(),
              ruleId: rule.id,
              transactionId: transactionId,
              triggeredBy: `${transaction.description || transaction.category} (${transaction.amount.toFixed(2)}€)`,
              amount: transferAmount,
              date: new Date().toISOString(),
              reversed: false,
            }

            // Update rule with execution history
            updateRuleFunc(rule.id, {
              lastExecuted: new Date().toISOString(),
              executionCount: rule.executionCount + 1,
              executions: [...(rule.executions || []), execution],
            })
          }
        } else if (rule.action.targetGoalId) {
          const targetGoal = currentGoals.find((g) => g.id === rule.action.targetGoalId)
          if (targetGoal) {
            await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - transferAmount })
            await updateGoal(targetGoal.id, { currentAmount: targetGoal.currentAmount + transferAmount })

            const { data } = await supabase
              .from("transactions")
              .insert({
                user_id: currentUserId,
                account_id: sourceAccount.id,
                amount: transferAmount,
                type: "savings",
                category: "Poupança Automática",
                description: `Automação: ${rule.name} → Meta ${targetGoal.name}`,
                date: new Date().toISOString().split("T")[0],
                rule_id: rule.id,
              })
              .select()
              .single()

            const transactionId = data?.id || newTransactionId

            setTransactions((transactions) => [
              {
                id: transactionId,
                date: new Date().toISOString().split("T")[0],
                description: `Automação: ${rule.name} → Meta ${targetGoal.name}`,
                amount: transferAmount,
                type: "savings",
                category: "Poupança Automática",
                accountId: sourceAccount.id,
                goalId: targetGoal.id,
                ruleId: rule.id,
              },
              ...transactions,
            ])

            const execution: RuleExecution = {
              id: crypto.randomUUID(),
              ruleId: rule.id,
              transactionId: transactionId,
              triggeredBy: `${transaction.description || transaction.category} (${transaction.amount.toFixed(2)}€)`,
              amount: transferAmount,
              date: new Date().toISOString(),
              reversed: false,
            }

            updateRuleFunc(rule.id, {
              lastExecuted: new Date().toISOString(),
              executionCount: rule.executionCount + 1,
              executions: [...(rule.executions || []), execution],
            })
          }
        }
      }
    },
    [updateAccount, updateGoal, updateRuleFunc, supabase],
  )

  const addInvestmentEntry = useCallback((entry: Omit<InvestmentEntry, "id">) => {
    const newEntry: InvestmentEntry = {
      ...entry,
      id: crypto.randomUUID(),
    }
    setInvestmentEntries((prev) => [newEntry, ...prev])
  }, [])

  const deleteInvestmentEntry = useCallback((id: string) => {
    setInvestmentEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const addSavingsEntry = useCallback((entry: Omit<SavingsEntry, "id">) => {
    const newEntry: SavingsEntry = {
      ...entry,
      id: crypto.randomUUID(),
    }
    setSavingsEntries((prev) => [newEntry, ...prev])
  }, [])

  const deleteSavingsEntry = useCallback((id: string) => {
    setSavingsEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    await loadData()
    setIsLoading(false)
  }, [loadData])

  const value = {
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
    refreshData,
    rules,
    addRule,
    updateRule: updateRuleFunc,
    deleteRule,
    executeRule,
    investmentEntries,
    savingsEntries,
    addInvestmentEntry,
    addSavingsEntry,
    deleteInvestmentEntry,
    deleteSavingsEntry,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

function useFinance() {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider")
  }
  return context
}

export { useFinance }
