export type CurrencyCode = "EUR" | "USD" | "GBP" | "BRL" | "CHF"

export interface Currency {
  code: CurrencyCode
  name: string
  symbol: string
  locale: string
}

export const CURRENCIES: Currency[] = [
  { code: "EUR", name: "Euro", symbol: "€", locale: "pt-PT" },
  { code: "USD", name: "Dólar Americano", symbol: "$", locale: "en-US" },
  { code: "GBP", name: "Libra Esterlina", symbol: "£", locale: "en-GB" },
  { code: "BRL", name: "Real Brasileiro", symbol: "R$", locale: "pt-BR" },
  { code: "CHF", name: "Franco Suíço", symbol: "Fr", locale: "de-CH" },
]

// Approximate exchange rates (EUR as base)
// In a production app, these would come from an API
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  BRL: 5.35,
  CHF: 0.95,
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode = "EUR"): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0]
  return amount.toLocaleString(currency.locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function convertCurrency(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
  if (fromCurrency === toCurrency) return amount

  // Convert to EUR first (base currency), then to target
  const amountInEur = amount / EXCHANGE_RATES[fromCurrency]
  return amountInEur * EXCHANGE_RATES[toCurrency]
}

export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === currencyCode)?.symbol || "€"
}
