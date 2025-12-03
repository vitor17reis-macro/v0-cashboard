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
  ArrowDownRight,
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
  const { accounts, investmentEntries, addInvestmentEntry, deleteInvestmentEntry } = useFinance()
  const { formatAmount } = useCurrency()

  const [isOpen, setIsOpen] = useState(false)
  const [entryType, setEntryType] = useState<string>("deposit")
  const [asset, setAsset] = useState("")
  const [assetType, setAssetType] = useState<string>("stocks")
  const [amount, setAmount] = useState("")
  const [quantity, setQuantity] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [notes, setNotes] = useState("")

  const investmentAccount = accounts.find((a) => a.type === "investment")
  const totalInvested = investmentAccount?.balance || 0

  // Calculate portfolio by asset type
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
    }
  }).filter((t) => t.value > 0)

  // Calculate portfolio by asset
  const portfolioByAsset = investmentEntries.reduce(
    (acc, entry) => {
      const existing = acc.find((a) => a.asset === entry.asset)
      const entryValue = ["deposit", "dividend", "gain"].includes(entry.type) ? entry.amount : -entry.amount
      if (existing) {
        existing.value += entryValue
        existing.quantity = (existing.quantity || 0) + (entry.quantity || 0)
      } else {
        acc.push({
          asset: entry.asset,
          assetType: entry.assetType,
          value: entryValue,
          quantity: entry.quantity || 0,
        })
      }
      return acc
    },
    [] as { asset: string; assetType: string; value: number; quantity: number }[],
  )

  // Monthly evolution
  const monthlyData = investmentEntries.reduce(
    (acc, entry) => {
      const month = new Date(entry.date).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })
      const existing = acc.find((a) => a.month === month)
      const value = ["deposit", "dividend", "gain"].includes(entry.type) ? entry.amount : -entry.amount
      if (existing) {
        existing.total += value
      } else {
        acc.push({ month, total: value })
      }
      return acc
    },
    [] as { month: string; total: number }[],
  )

  // Accumulate for chart
  let accumulated = 0
  const chartData = monthlyData.map((d) => {
    accumulated += d.total
    return { ...d, accumulated }
  })

  const handleSave = () => {
    if (!asset || !amount || !investmentAccount) return

    addInvestmentEntry({
      accountId: investmentAccount.id,
      date: new Date().toISOString().split("T")[0],
      amount: Number.parseFloat(amount),
      type: entryType as any,
      asset,
      assetType: assetType as any,
      quantity: quantity ? Number.parseFloat(quantity) : undefined,
      pricePerUnit: pricePerUnit ? Number.parseFloat(pricePerUnit) : undefined,
      notes,
    })

    setIsOpen(false)
    setAsset("")
    setAmount("")
    setQuantity("")
    setPricePerUnit("")
    setNotes("")
  }

  const getAssetIcon = (type: string) => {
    const assetConfig = ASSET_TYPES.find((t) => t.value === type)
    const Icon = assetConfig?.icon || Wallet
    return <Icon className="h-4 w-4" style={{ color: assetConfig?.color }} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o seu portfólio de investimentos em detalhe.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
              <Plus className="h-4 w-4" />
              Registar Movimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-500" />
                Registar Movimento de Investimento
              </DialogTitle>
              <DialogDescription>Registe compras, vendas, dividendos ou variações do seu portfólio.</DialogDescription>
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
                  <Label>Tipo de Ativo</Label>
                  <Select value={assetType} onValueChange={setAssetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Ativo</Label>
                <Input
                  placeholder="Ex: AAPL, Bitcoin, ETF IWDA"
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Total (€)</Label>
                  <Input type="number" placeholder="1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade (opcional)</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preço por Unidade (opcional)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input placeholder="Ex: Compra mensal DCA" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!asset || !amount}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-violet-100 text-sm">Total Investido</p>
                <p className="text-3xl font-bold">{formatAmount(totalInvested)}</p>
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
                <p className="text-emerald-100 text-sm">Entradas</p>
                <p className="text-3xl font-bold">
                  {formatAmount(
                    investmentEntries
                      .filter((e) => ["deposit", "dividend", "gain"].includes(e.type))
                      .reduce((sum, e) => sum + e.amount, 0),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20">
                <ArrowDownRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-red-100 text-sm">Saídas</p>
                <p className="text-3xl font-bold">
                  {formatAmount(
                    investmentEntries
                      .filter((e) => ["withdrawal", "loss"].includes(e.type))
                      .reduce((sum, e) => sum + e.amount, 0),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-violet-500" />
              Distribuição do Portfólio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioByType.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
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
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem dados de investimento
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {portfolioByType.map((entry) => (
                <Badge key={entry.name} variant="outline" style={{ borderColor: entry.color, color: entry.color }}>
                  {entry.name}: {formatAmount(entry.value)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-500" />
              Evolução do Portfólio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="accumulated"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#investGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem histórico de investimento
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-violet-500" />
            Os Meus Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {portfolioByAsset.length > 0 ? (
            <div className="space-y-3">
              {portfolioByAsset
                .filter((a) => a.value > 0)
                .map((asset) => (
                  <div
                    key={asset.asset}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getAssetIcon(asset.assetType)}
                      <div>
                        <p className="font-medium">{asset.asset}</p>
                        <p className="text-sm text-muted-foreground">
                          {ASSET_TYPES.find((t) => t.value === asset.assetType)?.label}
                          {asset.quantity > 0 && ` • ${asset.quantity} unid.`}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-lg">{formatAmount(asset.value)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Ainda não registou nenhum ativo.</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {investmentEntries.length > 0 ? (
            <div className="space-y-2">
              {investmentEntries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {getAssetIcon(entry.assetType)}
                    <div>
                      <p className="font-medium">{entry.asset}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("pt-PT")} •{" "}
                        {ENTRY_TYPES.find((t) => t.value === entry.type)?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={`font-semibold ${
                        ["deposit", "dividend", "gain"].includes(entry.type) ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {["deposit", "dividend", "gain"].includes(entry.type) ? "+" : "-"}
                      {formatAmount(entry.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteInvestmentEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Ainda não registou nenhum movimento.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
