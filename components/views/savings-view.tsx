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
  const financeContext = useFinance()
  const { formatAmount } = useCurrency()

  const accounts = financeContext?.accounts || []
  const goals = financeContext?.goals || []
  const savingsEntries = financeContext?.savingsEntries || []
  const addSavingsEntry = financeContext?.addSavingsEntry
  const deleteSavingsEntry = financeContext?.deleteSavingsEntry
  const isLoading = financeContext?.isLoading ?? true

  const [isOpen, setIsOpen] = useState(false)
  const [entryType, setEntryType] = useState<string>("deposit")
  const [purpose, setPurpose] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  const savingsAccount = accounts.find((a) => a.type === "savings")
  const totalSavings = savingsAccount?.balance || 0

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
        existing.depositos += entry.type === "deposit" ? entry.amount : 0
        existing.juros += entry.type === "interest" ? entry.amount : 0
        existing.levantamentos += entry.type === "withdrawal" ? entry.amount : 0
      } else {
        acc.push({
          month,
          depositos: entry.type === "deposit" ? entry.amount : 0,
          juros: entry.type === "interest" ? entry.amount : 0,
          levantamentos: entry.type === "withdrawal" ? entry.amount : 0,
        })
      }
      return acc
    },
    [] as { month: string; depositos: number; juros: number; levantamentos: number }[],
  )

  const totalInterest = savingsEntries.filter((e) => e.type === "interest").reduce((sum, e) => sum + e.amount, 0)
  const totalDeposits = savingsEntries.filter((e) => e.type === "deposit").reduce((sum, e) => sum + e.amount, 0)
  const interestRate = totalDeposits > 0 ? ((totalInterest / totalDeposits) * 100).toFixed(2) : "0"

  const handleSave = () => {
    if (!purpose || !amount || !savingsAccount || !addSavingsEntry) return

    addSavingsEntry({
      accountId: savingsAccount.id,
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
  }

  const getPurposeIcon = (purposeName: string) => {
    const config = SAVINGS_PURPOSES.find((p) => p.value === purposeName)
    const Icon = config?.icon || Target
    return <Icon className="h-4 w-4" style={{ color: config?.color }} />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Poupança</h1>
          <p className="text-muted-foreground mt-1">Organize e acompanhe as suas poupanças por objetivo.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              <Plus className="h-4 w-4" />
              Registar Movimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-cyan-500" />
                Registar Movimento de Poupança
              </DialogTitle>
              <DialogDescription>Registe depósitos, levantamentos ou juros da sua poupança.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimento</Label>
                  <Select value={entryType} onValueChange={setEntryType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTRY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className={type.color}>{type.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAVINGS_PURPOSES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor (€)</Label>
                <Input type="number" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input placeholder="Ex: Poupança mensal" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!purpose || !amount}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20">
                <PiggyBank className="h-6 w-6" />
              </div>
              <div>
                <p className="text-cyan-100 text-sm">Total Poupado</p>
                <p className="text-3xl font-bold">{formatAmount(totalSavings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Total Depositado</p>
                <p className="text-3xl font-bold">{formatAmount(totalDeposits)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-amber-100 text-sm">Juros Recebidos</p>
                <p className="text-3xl font-bold">{formatAmount(totalInterest)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-violet-100 text-sm">Rendimento</p>
                <p className="text-3xl font-bold">{interestRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-500" />
              Poupança por Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savingsByPurpose.length > 0 ? (
              <div className="space-y-4">
                {savingsByPurpose.map((item) => {
                  const percentage = totalSavings > 0 ? (item.value / totalSavings) * 100 : 0
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPurposeIcon(item.name)}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold">{formatAmount(item.value)}</span>
                      </div>
                      <div className="relative">
                        <Progress value={percentage} className="h-3" />
                        <span className="absolute right-0 top-4 text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Sem dados de poupança por objetivo
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-500" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="depositos" name="Depósitos" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="juros" name="Juros" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="levantamentos" name="Levantamentos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem histórico de poupança
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-500" />
              Progresso das Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const percentage = (goal.currentAmount / goal.targetAmount) * 100
                return (
                  <div key={goal.id} className="p-4 rounded-xl border bg-gradient-to-br from-background to-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
                      <h4 className="font-semibold">{goal.name}</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{percentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600 font-medium">{formatAmount(goal.currentAmount)}</span>
                        <span className="text-muted-foreground">de {formatAmount(goal.targetAmount)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {savingsEntries.length > 0 ? (
            <div className="space-y-2">
              {savingsEntries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {getPurposeIcon(entry.purpose)}
                    <div>
                      <p className="font-medium">{entry.purpose}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("pt-PT")} •{" "}
                        {ENTRY_TYPES.find((t) => t.value === entry.type)?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={`font-semibold ${
                        ["deposit", "interest"].includes(entry.type) ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {["deposit", "interest"].includes(entry.type) ? "+" : "-"}
                      {formatAmount(entry.amount)}
                    </p>
                    {deleteSavingsEntry && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteSavingsEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Ainda não registou nenhum movimento de poupança.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
