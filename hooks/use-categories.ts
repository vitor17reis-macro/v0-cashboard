"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Category, TransactionType, DEFAULT_CATEGORIES } from "@/lib/types"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const supabase = createClient()

  const loadCategories = useCallback(
    async (userId: string, defaultCategories: typeof DEFAULT_CATEGORIES) => {
      try {
        const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId)

        if (error) throw error

        if (data && data.length > 0) {
          setCategories(
            data.map((c: any) => ({
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
          // Create defaults
          const defaultCats = defaultCategories.map((c) => ({
            user_id: userId,
            name: c.name,
            type: c.type,
            color: c.color || "#10B981",
            icon: c.icon || "tag",
            budget: c.budget || 0,
            is_custom: false,
          }))

          const { data: createdCats, error: createError } = await supabase
            .from("categories")
            .insert(defaultCats)
            .select()

          if (createError) throw createError
          if (createdCats) {
            setCategories(
              createdCats.map((c: any) => ({
                id: c.id,
                name: c.name,
                type: c.type as TransactionType,
                color: c.color,
                icon: c.icon,
                budget: c.budget || 0,
                isCustom: c.is_custom || false,
              })),
            )
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load categories:", error)
      }
    },
    [supabase],
  )

  const addCategory = useCallback(
    async (userId: string, category: Omit<Category, "id">) => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert({
            user_id: userId,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            budget: category.budget || 0,
            is_custom: true,
          })
          .select()
          .single()

        if (error) throw error

        const newCategory: Category = {
          id: data.id,
          name: data.name,
          type: data.type as TransactionType,
          color: data.color,
          icon: data.icon,
          budget: data.budget || 0,
          isCustom: true,
        }

        setCategories((prev) => [...prev, newCategory])
      } catch (error) {
        console.error("[v0] Failed to add category:", error)
      }
    },
    [supabase],
  )

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Omit<Category, "id">>) => {
      try {
        const { error } = await supabase
          .from("categories")
          .update({
            name: updates.name,
            type: updates.type,
            color: updates.color,
            icon: updates.icon,
            budget: updates.budget,
          })
          .eq("id", id)

        if (error) throw error

        setCategories((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: updates.name ?? c.name,
                  type: updates.type ?? c.type,
                  color: updates.color ?? c.color,
                  icon: updates.icon ?? c.icon,
                  budget: updates.budget ?? c.budget,
                }
              : c,
          ),
        )
      } catch (error) {
        console.error("[v0] Failed to update category:", error)
      }
    },
    [supabase],
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("categories").delete().eq("id", id)
        if (error) throw error
        setCategories((prev) => prev.filter((c) => c.id !== id))
      } catch (error) {
        console.error("[v0] Failed to delete category:", error)
      }
    },
    [supabase],
  )

  return { categories, setCategories, loadCategories, addCategory, updateCategory, deleteCategory }
}
