"use client"

import { useCurrency } from "@/contexts/currency-context"
import { CURRENCIES, type CurrencyCode } from "@/lib/currency"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
      <SelectTrigger className="w-[130px] h-9">
        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span className="font-mono">{c.symbol}</span>
              <span>{c.code}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
