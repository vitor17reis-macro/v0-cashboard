"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type Currency = "EUR" | "USD" | "GBP" | "BRL"

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatCurrency: (amount: number) => string
  currencySymbol: string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const currencyConfig: Record<Currency, { symbol: string; locale: string }> = {
  EUR: { symbol: "€", locale: "pt-PT" },
  USD: { symbol: "$", locale: "en-US" },
  GBP: { symbol: "£", locale: "en-GB" },
  BRL: { symbol: "R$", locale: "pt-BR" },
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("EUR")

  const formatCurrency = useCallback(
    (amount: number) => {
      const config = currencyConfig[currency]
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    },
    [currency],
  )

  const currencySymbol = currencyConfig[currency].symbol

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        currencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
