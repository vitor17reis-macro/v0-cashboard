"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Account } from "@/lib/types"

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const supabase = createClient()

  const loadAccounts = useCallback(
    async (userId: string, defaultAccounts: Account[]) => {
      try {
        const { data, error } = await supabase.from("accounts").select("*").eq("user_id", userId)

        if (error) throw error

        if (data && data.length > 0) {
          setAccounts(
            data.map((a: any) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              balance: Number.parseFloat(a.balance),
              color: a.color,
              icon: a.icon,
            })),
          )
        } else {
          // Create defaults
          const defaultAccsData = defaultAccounts.map((a) => ({
            user_id: userId,
            name: a.name,
            type: a.type,
            balance: a.balance,
            color: a.color,
            icon: a.icon,
          }))

          const { data: createdAccounts, error: createError } = await supabase
            .from("accounts")
            .insert(defaultAccsData)
            .select()

          if (createError) throw createError
          if (createdAccounts) {
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
      } catch (error) {
        console.error("[v0] Failed to load accounts:", error)
      }
    },
    [supabase],
  )

  const addAccount = useCallback(
    async (userId: string, account: Omit<Account, "id">) => {
      try {
        const { data, error } = await supabase
          .from("accounts")
          .insert({
            user_id: userId,
            name: account.name,
            type: account.type,
            balance: account.balance,
            color: account.color,
            icon: account.icon,
          })
          .select()
          .single()

        if (error) throw error

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
    },
    [supabase],
  )

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
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

  const deleteAccount = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("accounts").delete().eq("id", id)
        if (error) throw error
        setAccounts((prev) => prev.filter((a) => a.id !== id))
      } catch (error) {
        console.error("[v0] Failed to delete account:", error)
      }
    },
    [supabase],
  )

  return { accounts, setAccounts, loadAccounts, addAccount, updateAccount, deleteAccount }
}
