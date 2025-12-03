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
import { Badge } from "@/components/ui/badge"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import {
  TrendingUp,
  Plus,
  Bitcoin,
  Building,
  PieChart,
  Landmark,
  BarChart3,
  Trash2,
  Wallet,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

const ASSET_TYPES = [
  { value: "stocks", label: "Ações", icon: TrendingUp, color: "#3B82F6" },
  { value: "crypto", label: "Cripto", icon: Bitcoin, color: "#F59E0B" },
  { value: "etf", label: "ETF", icon: BarChart3, color: "#8B5CF6" },
  { value: "bonds", label: "Obrigações", icon: Landmark, color: "#06B6D4" },
  { value: "real-estate", label: "Imobiliário", icon: Building, color: "#10B981" },
  { value: "funds", label: "Fundos", icon: PieChart, color: "#EC4899" },
  { value: "other", label: "Outros", icon: Wallet, color: "#64748B" },
]

const ENTRY_TYPES = [
  { value: "deposit", label: "Depósito", color: "text-emerald-600" },
  { value: "withdrawal", label: "Levantamento", color: "text-red-600" },
  { value: "dividend", label: "Dividendo", color: "text-blue-600" },
  { value: "gain", label: "Mais-valia", color: "text-emerald-600" },
  { value: "loss", label: "Menos-valia", color: "text-red-600" },
]

export function InvestmentsView() {
  const { formatAmount } = useCurrency()
  const financeContext = useFinance()

  const [isOpen, setIsOpen] = useState(false)
  const [entryType, setEntryType] = useState<string>("deposit")
  const [asset, setAsset] = useState("")
  const [assetType, setAssetType] = useState<string>("stocks")
  const [amount, setAmount] = useState("")
  const [quantity, setQuantity] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [notes, setNotes] = useState("")

  if (!financeContext) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">A carregar investimentos...</p>
        </div>
      </div>
    )
  }

  const { accounts, investmentEntries, addInvestmentEntry, deleteInvestmentEntry, isLoading } = financeContext

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">A carregar investimentos...</p>
        </div>
      </div>
    )
  }

  const investmentAccount = accounts.find((a) => a.type === "investment")
  const totalInvested = investmentAccount?.balance ?? 0

  const portfolioByType = ASSET_TYPES.map((type) => {
    const entries = investmentEntries.filter((e) => e.assetType === type.value)
    const total = entries.reduce((sum, e) => {
      if (e.type === "deposit" || e.type === "dividend" || e.type === "gain") {
        return sum + e.amount
      } else {
        return sum - e.amount
      }
    }, 0)
    return {
      name: type.label,
      value: Math.max(0, total),
      color: type.color,
      icon: type.icon,
    }
  }).filter((p) => p.value > 0)

  const evolutionData = investmentEntries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce(
      (acc, entry) => {
        const date = new Date(entry.date).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })
        const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0
        let newValue = lastValue
        if (entry.type === "deposit" || entry.type === "dividend" || entry.type === "gain") {
          newValue += entry.amount
        } else {
          newValue -= entry.amount
        }
        const existing = acc.find((a) => a.date === date)
        if (existing) {
          existing.value = newValue
        } else {
          acc.push({ date, value: newValue })
        }
        return acc
      },
      [] as { date: string; value: number }[],
    )

  const handleAddEntry = () => {
    if (!asset || !amount) return

    const invAcct = accounts.find((a) => a.type === "investment")
    if (!invAcct) return

    addInvestmentEntry({
      accountId: invAcct.id,
      date: new Date().toISOString().split("T")[0],
      amount: Number.parseFloat(amount),
      type: entryType as "deposit" | "withdrawal" | "dividend" | "gain" | "loss",
      asset,
      assetType: assetType as "stocks" | "crypto" | "etf" | "bonds" | "real-estate" | "funds" | "other",
      quantity: quantity ? Number.parseFloat(quantity) : undefined,
      pricePerUnit: pricePerUnit ? Number.parseFloat(pricePerUnit) : undefined,
      notes,
    })

    setIsOpen(false)
    setAsset("")
    setAssetType("stocks")
    setAmount("")
    setQuantity("")
    setPricePerUnit("")
    setNotes("")
    setEntryType("deposit")
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-violet-500" />
            Investimentos
          </h2>
          <p className="text-muted-foreground">Acompanhe o seu portfólio de investimentos.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
              <Plus className="h-4 w-4" />
              Registar Movimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-500" />
                Novo Movimento de Investimento
              </DialogTitle>
              <DialogDescription>Registe compras, vendas, dividendos ou mais/menos-valias.</DialogDescription>
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
                <Label>Tipo de Ativo</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome do Ativo</Label>
                <Input
                  placeholder="Ex: AAPL, Bitcoin, IWDA..."
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0"
                    step="0.0001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preço por Unidade (€)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
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
                disabled={!asset || !amount}
                className="bg-gradient-to-r from-violet-500 to-purple-500"
              >
                Registar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-3xl font-bold text-violet-600">{formatAmount(totalInvested)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Classes de Ativos</p>
                <p className="text-3xl font-bold text-blue-600">{portfolioByType.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Movimentos</p>
                <p className="text-3xl font-bold text-emerald-600">{investmentEntries.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição do Portfólio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={portfolioByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {portfolioByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Sem investimentos registados</p>
                </div>
              </div>
            )}
            {portfolioByType.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {portfolioByType.map((item) => (
                  <Badge key={item.name} variant="outline" className="gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução do Portfólio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>Sem dados para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Movimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {investmentEntries.length > 0 ? (
            <div className="space-y-3">
              {investmentEntries.slice(0, 10).map((entry) => {
                const assetTypeInfo = ASSET_TYPES.find((t) => t.value === entry.assetType)
                const Icon = assetTypeInfo?.icon || TrendingUp
                const typeInfo = ENTRY_TYPES.find((t) => t.value === entry.type)
                const isPositive = entry.type === "deposit" || entry.type === "dividend" || entry.type === "gain"
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${assetTypeInfo?.color || "#64748B"}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: assetTypeInfo?.color || "#64748B" }} />
                      </div>
                      <div>
                        <p className="font-medium">{entry.asset}</p>
                        <p className="text-sm text-muted-foreground">
                          {typeInfo?.label} • {assetTypeInfo?.label} •{" "}
                          {new Date(entry.date).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                          {isPositive ? "+" : "-"}
                          {formatAmount(entry.amount)}
                        </span>
                        {entry.quantity && <p className="text-xs text-muted-foreground">{entry.quantity} unidades</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteInvestmentEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
