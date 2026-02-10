"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Mail, Bell, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface NotificationPreferences {
  emailEnabled: boolean
  emailFrequency: "daily" | "weekly" | "monthly"
  emailAddress: string
  pushEnabled: boolean
  budgetAlerts: boolean
  budgetAlertThreshold: number
  anomalyAlerts: boolean
}

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailEnabled: true,
    emailFrequency: "weekly",
    emailAddress: "",
    pushEnabled: true,
    budgetAlerts: true,
    budgetAlertThreshold: 80,
    anomalyAlerts: true,
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("notificationPreferences")
    if (stored) setPrefs(JSON.parse(stored))
  }, [])

  const handleSave = () => {
    localStorage.setItem("notificationPreferences", JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Resumos por Email</CardTitle>
                <CardDescription>Receba resumos financeiros periódicos</CardDescription>
              </div>
            </div>
            <Switch
              checked={prefs.emailEnabled}
              onCheckedChange={(checked) => setPrefs({ ...prefs, emailEnabled: checked })}
            />
          </div>
        </CardHeader>
        {prefs.emailEnabled && (
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Endereço de Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={prefs.emailAddress}
                onChange={(e) => setPrefs({ ...prefs, emailAddress: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Frequência de Resumos</label>
              <Select
                value={prefs.emailFrequency}
                onValueChange={(value: any) => setPrefs({ ...prefs, emailFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal (segundas)</SelectItem>
                  <SelectItem value="monthly">Mensal (1º dia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm text-blue-700 dark:text-blue-300">
              Receberá análise de gastos, progresso de metas e alertas importantes
            </div>
          </CardContent>
        )}
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Notificações em Tempo Real</CardTitle>
                <CardDescription>Alertas instantâneos no navegador</CardDescription>
              </div>
            </div>
            <Switch
              checked={prefs.pushEnabled}
              onCheckedChange={(checked) => setPrefs({ ...prefs, pushEnabled: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Budget Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <CardTitle className="text-base">Alertas de Orçamento</CardTitle>
                <CardDescription>Notificações quando atinge limites</CardDescription>
              </div>
            </div>
            <Switch
              checked={prefs.budgetAlerts}
              onCheckedChange={(checked) => setPrefs({ ...prefs, budgetAlerts: checked })}
            />
          </div>
        </CardHeader>
        {prefs.budgetAlerts && (
          <CardContent>
            <div>
              <label className="text-sm font-medium">Limiar de Alerta (%)</label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={prefs.budgetAlertThreshold}
                  onChange={(e) => setPrefs({ ...prefs, budgetAlertThreshold: Number(e.target.value) })}
                  className="flex-1"
                />
                <Badge variant="outline" className="min-w-fit">
                  {prefs.budgetAlertThreshold}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Será notificado quando atingir {prefs.budgetAlertThreshold}% do orçamento
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Anomaly Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Alertas de Despesas Anómalas</CardTitle>
              <CardDescription>Detecção de gastos incomuns</CardDescription>
            </div>
            <Switch
              checked={prefs.anomalyAlerts}
              onCheckedChange={(checked) => setPrefs({ ...prefs, anomalyAlerts: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          {saved ? "✓ Guardado" : "Guardar Preferências"}
        </Button>
      </div>
    </div>
  )
}
