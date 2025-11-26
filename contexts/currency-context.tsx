"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type CurrencyCode, CURRENCIES, formatCurrency as formatCurrencyUtil } from "@/lib/currency"

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
  formatCurrency: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const STORAGE_KEY = "vitoreis-currency"

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && CURRENCIES.some((c) => c.code === stored)) {
      setCurrencyState(stored as CurrencyCode)
    }
  }, [])

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency)
    localStorage.setItem(STORAGE_KEY, newCurrency)
  }

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
