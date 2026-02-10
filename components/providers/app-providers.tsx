"use client"

import React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { FinanceProvider } from "./finance-provider"
import { CurrencyProvider } from "@/contexts/currency-context"
import { Toaster } from "@/components/ui/toaster"

/**
 * Consolidated App Providers
 * 
 * Wraps all global providers in a single component to reduce nesting and prop-drilling.
 * Order matters: Theme > Currency > Finance (dependencies flow top-down)
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CurrencyProvider>
        <FinanceProvider>
          {children}
          <Toaster />
        </FinanceProvider>
      </CurrencyProvider>
    </NextThemesProvider>
  )
}
