"use client"

import { useState, useEffect } from "react"
import { type Transaction, type Category, DEFAULT_CATEGORIES } from "@/lib/types"

// Initial dummy data for demonstration if local storage is empty
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    date: new Date().toISOString(),
    description: "Salário Mensal",
    amount: 3500,
    type: "income",
    category: "salary",
  },
  {
    id: "2",
    date: new Date().toISOString(),
    description: "Renda",
    amount: 1200,
    type: "expense",
    category: "housing",
  },
  {
    id: "3",
    date: new Date().toISOString(),
    description: "Supermercado",
    amount: 350,
    type: "expense",
    category: "food",
  },
  {
    id: "4",
    date: new Date().toISOString(),
    description: "ETF Mundial",
    amount: 500,
    type: "investment",
    category: "funds",
  },
  {
    id: "5",
    date: new Date().toISOString(),
    description: "Conta Poupança",
    amount: 300,
    type: "savings",
    category: "emergency",
  },
]

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      try {
        const storedTransactions = localStorage.getItem("finance_transactions")
        const storedCategories = localStorage.getItem("finance_categories")

        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions))
        } else {
          setTransactions(INITIAL_TRANSACTIONS)
          localStorage.setItem("finance_transactions", JSON.stringify(INITIAL_TRANSACTIONS))
        }

        if (storedCategories) {
          setCategories(JSON.parse(storedCategories))
        } else {
          localStorage.setItem("finance_categories", JSON.stringify(DEFAULT_CATEGORIES))
        }
      } catch (error) {
        console.error("Failed to load data from local storage:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
    }

    const updatedTransactions = [newTransaction, ...transactions]
    setTransactions(updatedTransactions)
    localStorage.setItem("finance_transactions", JSON.stringify(updatedTransactions))
  }

  const deleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter((t) => t.id !== id)
    setTransactions(updatedTransactions)
    localStorage.setItem("finance_transactions", JSON.stringify(updatedTransactions))
  }

  const getSummary = () => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((acc, curr) => acc + curr.amount, 0)

    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((acc, curr) => acc + curr.amount, 0)

    const totalInvestment = transactions
      .filter((t) => t.type === "investment")
      .reduce((acc, curr) => acc + curr.amount, 0)

    const totalSavings = transactions.filter((t) => t.type === "savings").reduce((acc, curr) => acc + curr.amount, 0)

    const balance = totalIncome - totalExpense - totalInvestment - totalSavings
    const savingsRate = totalIncome > 0 ? ((totalSavings + totalInvestment) / totalIncome) * 100 : 0

    return {
      totalIncome,
      totalExpense,
      totalInvestment,
      totalSavings,
      balance,
      savingsRate,
    }
  }

  return {
    transactions,
    categories,
    addTransaction,
    deleteTransaction,
    getSummary,
    isLoading,
  }
}
