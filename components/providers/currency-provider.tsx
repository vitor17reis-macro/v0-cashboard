"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Currency = "EUR" | "USD" | "GBP" | "BRL"

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatCurrency: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const currencyConfig: Record<Currency, { locale: string; currency: string; symbol: string }> = {
  EUR: { locale: "pt-PT", currency: "EUR", symbol: "€" },
  USD: { locale: "en-US", currency: "USD", symbol: "$" },
  GBP: { locale: "en-GB", currency: "GBP", symbol: "£" },
  BRL: { locale: "pt-BR", currency: "BRL", symbol: "R$" },
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("EUR")

  const formatCurrency = (amount: number): string => {
    const config = currencyConfig[currency]
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext)
  if (!context) {
    // Return default values if used outside provider
    return {
      currency: "EUR" as Currency,
      setCurrency: () => {},
      formatCurrency: (amount: number) =>
        new Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: "EUR",
        }).format(amount),
    }
  }
  return context
}
