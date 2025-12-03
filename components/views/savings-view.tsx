"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import {
  PiggyBank,
  Plus,
  Target,
  TrendingUp,
  Sparkles,
  Trash2,
  Umbrella,
  Plane,
  Home,
  GraduationCap,
  Heart,
  Gift,
  ArrowUpRight,
  Calendar,
  Loader2,
} from "lucide-react"
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts"

const SAVINGS_PURPOSES = [
  { value: "Fundo de Emergência", icon: Umbrella, color: "#EF4444" },
  { value: "Férias", icon: Plane, color: "#F59E0B" },
  { value: "Casa", icon: Home, color: "#10B981" },
  { value: "Educação", icon: GraduationCap, color: "#3B82F6" },
  { value: "Saúde", icon: Heart, color: "#EC4899" },
  { value: "Presentes", icon: Gift, color: "#8B5CF6" },
  { value: "Reforma", icon: TrendingUp, color: "#06B6D4" },
  { value: "Outro", icon: Target, color: "#64748B" },
]

const ENTRY_TYPES = [
  { value: "deposit", label: "Depósito", color: "text-emerald-600" },
  { value: "withdrawal", label: "Levantamento", color: "text-red-600" },
  { value: "interest", label: "Juros", color: "text-blue-600" },
]

export function SavingsView() {
  const { formatAmount } = useCurrency()
  const financeContext = useFinance()
  const accounts = financeContext?.accounts ?? []
  const goals = financeContext?.goals ?? []
  const savingsEntries = financeContext?.savingsEntries ?? []
  const addSavingsEntry = financeContext?.addSavingsEntry
  const deleteSavingsEntry = financeContext?.deleteSavingsEntry
  const isLoading = financeContext?.isLoading ?? true

  const [isOpen, setIsOpen] = useState(false)
  const [entryType, setEntryType] = useState<string>("deposit")
  const [purpose, setPurpose] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  const savingsAccount = accounts.find((a) => a.type === "savings")
  const totalSavings = savingsAccount?.balance ?? 0

  // Calculate savings by purpose
  const savingsByPurpose = SAVINGS_PURPOSES.map((p) => {
    const entries = savingsEntries.filter((e) => e.purpose === p.value)
    const total = entries.reduce((sum, e) => {
      if (e.type === "deposit" || e.type === "interest") {
        return sum + e.amount
      } else {
        return sum - e.amount
      }
    }, 0)
    return {
      name: p.value,
      value: Math.max(0, total),
      color: p.color,
      icon: p.icon,
    }
  }).filter((p) => p.value > 0)

  // Monthly evolution
  const monthlyData = savingsEntries.reduce(
    (acc, entry) => {
      const month = new Date(entry.date).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })
      const existing = acc.find((a) => a.month === month)
      if (existing) {
        if (entry.type === "deposit" || entry.type === "interest") {
          existing.deposits += entry.amount
        } else {
          existing.withdrawals += entry.amount
        }
      } else {
        acc.push({
          month,
          deposits: entry.type === "deposit" || entry.type === "interest" ? entry.amount : 0,
          withdrawals: entry.type === "withdrawal" ? entry.amount : 0,
        })
      }
      return acc
    },
    [] as { month: string; deposits: number; withdrawals: number }[],
  )

  const handleAddEntry = () => {
    if (!addSavingsEntry || !purpose || !amount) return

    const savingsAcct = accounts.find((a) => a.type === "savings")
    if (!savingsAcct) return

    addSavingsEntry({
      accountId: savingsAcct.id,
      date: new Date().toISOString().split("T")[0],
      amount: Number.parseFloat(amount),
      type: entryType as "deposit" | "withdrawal" | "interest",
      purpose,
      notes,
    })

    setIsOpen(false)
    setPurpose("")
    setAmount("")
    setNotes("")
    setEntryType("deposit")
  }

  if (!financeContext || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">A carregar poupança...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-cyan-500" />
            Poupança
          </h2>
          <p className="text-muted-foreground">Acompanhe e organize as suas poupanças por objetivo.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              <Plus className="h-4 w-4" />
              Registar Movimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-500" />
                Novo Movimento de Poupança
              </DialogTitle>
              <DialogDescription>Registe um depósito, levantamento ou juros na sua conta poupança.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Movimento</Label>
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTRY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className={t.color}>{t.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAVINGS_PURPOSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.value}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montante (€)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input placeholder="Adicione notas..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddEntry}
                disabled={!purpose || !amount}
                className="bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                Registar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Poupado</p>
                <p className="text-3xl font-bold text-cyan-600">{formatAmount(totalSavings)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Objetivos Ativos</p>
                <p className="text-3xl font-bold text-emerald-600">{savingsByPurpose.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Movimentos</p>
                <p className="text-3xl font-bold text-violet-600">{savingsEntries.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings by Purpose */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Poupança por Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savingsByPurpose.length > 0 ? (
              <div className="space-y-4">
                {savingsByPurpose.map((item) => {
                  const Icon = SAVINGS_PURPOSES.find((p) => p.value === item.name)?.icon || Target
                  const percentage = totalSavings > 0 ? (item.value / totalSavings) * 100 : 0
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: item.color }} />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold">{formatAmount(item.value)}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PiggyBank className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sem poupanças registadas</p>
                <p className="text-sm">Comece a poupar para os seus objetivos!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="deposits" fill="#10B981" name="Depósitos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawals" fill="#EF4444" name="Levantamentos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>Sem dados para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Movimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {savingsEntries.length > 0 ? (
            <div className="space-y-3">
              {savingsEntries.slice(0, 10).map((entry) => {
                const purposeInfo = SAVINGS_PURPOSES.find((p) => p.value === entry.purpose)
                const Icon = purposeInfo?.icon || Target
                const typeInfo = ENTRY_TYPES.find((t) => t.value === entry.type)
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${purposeInfo?.color || "#64748B"}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: purposeInfo?.color || "#64748B" }} />
                      </div>
                      <div>
                        <p className="font-medium">{entry.purpose}</p>
                        <p className="text-sm text-muted-foreground">
                          {typeInfo?.label} • {new Date(entry.date).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${typeInfo?.color}`}>
                        {entry.type === "withdrawal" ? "-" : "+"}
                        {formatAmount(entry.amount)}
                      </span>
                      {deleteSavingsEntry && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSavingsEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Sem movimentos registados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
