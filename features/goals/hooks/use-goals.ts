"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Goal } from "@/lib/types"

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const supabase = createClient()

  const loadGoals = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.from("goals").select("*").eq("user_id", userId)

        if (error) throw error

        if (data) {
          setGoals(
            data.map((g: any) => ({
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
      } catch (error) {
        console.error("[v0] Failed to load goals:", error)
      }
    },
    [supabase],
  )

  const addGoal = useCallback(
    async (userId: string, goal: Omit<Goal, "id">) => {
      try {
        const { data, error } = await supabase
          .from("goals")
          .insert({
            user_id: userId,
            name: goal.name,
            target_amount: goal.targetAmount,
            current_amount: goal.currentAmount,
            deadline: goal.deadline,
            color: goal.color,
            icon: goal.icon,
          })
          .select()
          .single()

        if (error) throw error

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
    },
    [supabase],
  )

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
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

  const deleteGoal = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("goals").delete().eq("id", id)
        if (error) throw error
        setGoals((prev) => prev.filter((g) => g.id !== id))
      } catch (error) {
        console.error("[v0] Failed to delete goal:", error)
      }
    },
    [supabase],
  )

  return { goals, setGoals, loadGoals, addGoal, updateGoal, deleteGoal }
}
