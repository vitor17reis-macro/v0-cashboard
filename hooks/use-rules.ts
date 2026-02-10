"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AutoRule } from "@/lib/types"

export function useRules() {
  const [rules, setRules] = useState<AutoRule[]>([])
  const supabase = createClient()

  const loadRules = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.from("auto_rules").select("*").eq("user_id", userId)

        if (error) throw error

        if (data) {
          setRules(
            data.map((r: any) => ({
              id: r.id,
              name: r.name,
              enabled: r.enabled,
              trigger: r.trigger,
              action: r.action,
              lastExecuted: r.last_executed,
              executionCount: r.execution_count || 0,
              executions: r.executions || [],
            })),
          )
        }
      } catch (error) {
        console.error("[v0] Failed to load rules:", error)
      }
    },
    [supabase],
  )

  const addRule = useCallback(
    async (userId: string, rule: Omit<AutoRule, "id" | "executionCount">) => {
      try {
        const { data, error } = await supabase
          .from("auto_rules")
          .insert({
            user_id: userId,
            name: rule.name,
            enabled: rule.enabled,
            trigger: rule.trigger,
            action: rule.action,
            execution_count: 0,
          })
          .select()
          .single()

        if (error) throw error

        const newRule: AutoRule = {
          id: data.id,
          name: data.name,
          enabled: data.enabled,
          trigger: data.trigger,
          action: data.action,
          lastExecuted: data.last_executed,
          executionCount: 0,
          executions: [],
        }

        setRules((prev) => [...prev, newRule])
      } catch (error) {
        console.error("[v0] Failed to add rule:", error)
      }
    },
    [supabase],
  )

  const updateRule = useCallback(
    async (id: string, updates: Partial<AutoRule>) => {
      try {
        const { error } = await supabase
          .from("auto_rules")
          .update({
            name: updates.name,
            enabled: updates.enabled,
            trigger: updates.trigger,
            action: updates.action,
          })
          .eq("id", id)

        if (error) throw error

        setRules((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  name: updates.name ?? r.name,
                  enabled: updates.enabled ?? r.enabled,
                  trigger: updates.trigger ?? r.trigger,
                  action: updates.action ?? r.action,
                }
              : r,
          ),
        )
      } catch (error) {
        console.error("[v0] Failed to update rule:", error)
      }
    },
    [supabase],
  )

  const deleteRule = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("auto_rules").delete().eq("id", id)
        if (error) throw error
        setRules((prev) => prev.filter((r) => r.id !== id))
      } catch (error) {
        console.error("[v0] Failed to delete rule:", error)
      }
    },
    [supabase],
  )

  return { rules, setRules, loadRules, addRule, updateRule, deleteRule }
}
