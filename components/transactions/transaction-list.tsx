"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import { TrendingUpIcon, TrendingDownIcon, WalletIcon, PiggyBankIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function TransactionList() {
  const { filteredTransactions, categories } = useFinance()
  const { formatCurrency } = useCurrency()

  if (filteredTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border rounded-xl border-dashed">
        <p>Nenhuma transação encontrada neste período.</p>
      </div>
    )
  }

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || id
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUpIcon className="h-4 w-4 text-income" />
      case "expense":
        return <TrendingDownIcon className="h-4 w-4 text-expense" />
      case "investment":
        return <WalletIcon className="h-4 w-4 text-investment" />
      case "savings":
        return <PiggyBankIcon className="h-4 w-4 text-savings" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-income"
      case "expense":
        return "text-expense"
      case "investment":
        return "text-investment"
      case "savings":
        return "text-savings"
      default:
        return "text-foreground"
    }
  }

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {sortedTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-card/40 hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full bg-background border ${getTypeColor(transaction.type)}/10`}>
                {getTypeIcon(transaction.type)}
              </div>
              <div className="space-y-1">
                <p className="font-medium leading-none">{transaction.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(parseISO(transaction.date), "d 'de' MMM, yyyy", { locale: pt })}</span>
                  <span>•</span>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {getCategoryName(transaction.category)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`font-bold font-mono ${getTypeColor(transaction.type)}`}>
                {transaction.type === "expense" ? "-" : "+"}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
