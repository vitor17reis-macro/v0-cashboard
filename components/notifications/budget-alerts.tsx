"use client"

import { useEffect, useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { AlertTriangle, TrendingDown, CheckCircle, X, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface Alert {
  id: string
  type: "warning" | "danger" | "success"
  category: string
  message: string
  percentage: number
  timestamp: Date
}

export function BudgetAlerts() {
  const { categories, getBudgetStatus } = useFinance()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const expenseCategories = categories.filter((c) => c.type === "expense")
    const newAlerts: Alert[] = []

    expenseCategories.forEach((category) => {
      const status = getBudgetStatus(category.id)

      if (status.limit > 0) {
        const alertId = `${category.id}-${Math.floor(status.percentage / 10) * 10}`

        if (status.percentage >= 100) {
          newAlerts.push({
            id: alertId,
            type: "danger",
            category: category.name,
            message: `Orçamento ultrapassado em ${(status.percentage - 100).toFixed(0)}%`,
            percentage: status.percentage,
            timestamp: new Date(),
          })
        } else if (status.percentage >= 80) {
          newAlerts.push({
            id: alertId,
            type: "warning",
            category: category.name,
            message: `Já gastou ${status.percentage.toFixed(0)}% do orçamento`,
            percentage: status.percentage,
            timestamp: new Date(),
          })
        }
      }
    })

    setAlerts(newAlerts.filter((a) => !dismissedAlerts.has(a.id)))
  }, [categories, getBudgetStatus, dismissedAlerts])

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
  }

  const activeAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))
  const dangerCount = activeAlerts.filter((a) => a.type === "danger").length
  const warningCount = activeAlerts.filter((a) => a.type === "warning").length

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <TrendingDown className="h-4 w-4 text-amber-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case "danger":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
      default:
        return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Alertas">
          {activeAlerts.length > 0 ? (
            <>
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                {activeAlerts.length}
              </span>
            </>
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold font-serif">Alertas de Orçamento</h4>
            <div className="flex gap-1">
              {dangerCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {dangerCount} crítico{dangerCount > 1 ? "s" : ""}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                >
                  {warningCount} aviso{warningCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
              <p className="text-sm text-muted-foreground">Tudo em ordem! Nenhum alerta de orçamento.</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className={`${getAlertBg(alert.type)} border shadow-none`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.category}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                        <div className="mt-2 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              alert.type === "danger" ? "bg-red-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-transparent"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
