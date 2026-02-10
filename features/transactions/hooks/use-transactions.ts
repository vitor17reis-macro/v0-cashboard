"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Transaction } from "@/lib/types"

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const supabase = createClient()

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id">) => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .insert({
            user_id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            account_id: transaction.accountId,
            to_account_id: transaction.toAccountId,
            goal_id: transaction.goalId,
            is_recurring: transaction.isRecurring,
            recurring_frequency: transaction.recurringFrequency,
            next_due_date: transaction.nextDueDate,
            rule_id: transaction.ruleId,
          })
          .select()
          .single()

        if (error) throw error
        if (data) {
          const newTransaction: Transaction = {
            id: data.id,
            date: data.date,
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            accountId: data.account_id,
            toAccountId: data.to_account_id,
            goalId: data.goal_id,
            isRecurring: data.is_recurring,
            recurringFrequency: data.recurring_frequency,
            nextDueDate: data.next_due_date,
            ruleId: data.rule_id,
          }
          setTransactions((prev) => [newTransaction, ...prev])
        }
      } catch (error) {
        console.error("[v0] Failed to add transaction:", error)
      }
    },
    [supabase],
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("transactions").delete().eq("id", id)
        if (error) throw error
        setTransactions((prev) => prev.filter((t) => t.id !== id))
      } catch (error) {
        console.error("[v0] Failed to delete transaction:", error)
      }
    },
    [supabase],
  )

  const loadTransactions = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })

        if (error) throw error
        if (data) {
          setTransactions(
            data.map((t: any) => ({
              id: t.id,
              date: t.date,
              description: t.description,
              amount: t.amount,
              type: t.type,
              category: t.category,
              accountId: t.account_id,
              toAccountId: t.to_account_id,
              goalId: t.goal_id,
              isRecurring: t.is_recurring,
              recurringFrequency: t.recurring_frequency,
              nextDueDate: t.next_due_date,
              ruleId: t.rule_id,
            })),
          )
        }
      } catch (error) {
        console.error("[v0] Failed to load transactions:", error)
      }
    },
    [supabase],
  )

  return { transactions, setTransactions, addTransaction, deleteTransaction, loadTransactions }
}
