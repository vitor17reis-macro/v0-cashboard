"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import {
  Plus,
  Zap,
  ArrowRight,
  Trash2,
  Settings2,
  Play,
  Loader2,
  Pencil,
  PiggyBank,
  Wallet,
  TrendingUp,
  Target,
} from "lucide-react"

interface AutoRule {
  id: string
  name: string
  enabled: boolean
  trigger: {
    type: "income_received" | "expense_contains" | "amount_above" | "category_match"
    value: string
    category?: string
  }
  action: {
    type: "transfer_percentage" | "transfer_fixed" | "categorize"
    percentage?: number
    fixedAmount?: number
    targetAccountId?: string
    targetGoalId?: string
    targetCategory?: string
  }
  lastExecuted?: string
}

export function AutomaticRules() {
  const [rules, setRules] = useState<AutoRule[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null)
  const [executingRuleId, setExecutingRuleId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { toast } = useToast()

  const financeContext = useFinance()
  const { formatCurrency } = useCurrency()

  const transactions = financeContext?.transactions || []
  const accounts = financeContext?.accounts || []
  const goals = financeContext?.goals || []
  const categories = financeContext?.categories || []
  const addTransaction = financeContext?.addTransaction
  const updateAccount = financeContext?.updateAccount
  const updateGoal = financeContext?.updateGoal

  const [newRule, setNewRule] = useState<Omit<AutoRule, "id">>({
    name: "",
    enabled: true,
    trigger: { type: "income_received", value: "" },
    action: { type: "transfer_percentage", percentage: 10 },
  })

  useEffect(() => {
    const stored = localStorage.getItem("cashboard_auto_rules")
    if (stored) {
      try {
        setRules(JSON.parse(stored))
      } catch (e) {
        console.error("[v0] Failed to parse rules:", e)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cashboard_auto_rules", JSON.stringify(rules))
    }
  }, [rules, isLoaded])

  const handleSaveRule = () => {
    if (!newRule.name.trim()) {
      toast({ title: "Erro", description: "Dá um nome à regra.", variant: "destructive" })
      return
    }

    if (editingRule) {
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...newRule, id: editingRule.id } : r)))
      toast({ title: "Regra atualizada", description: `A regra "${newRule.name}" foi atualizada.` })
    } else {
      const rule: AutoRule = { ...newRule, id: crypto.randomUUID() }
      setRules((prev) => [...prev, rule])
      toast({ title: "Regra criada", description: `A regra "${rule.name}" foi adicionada.` })
    }

    setNewRule({
      name: "",
      enabled: true,
      trigger: { type: "income_received", value: "" },
      action: { type: "transfer_percentage", percentage: 10 },
    })
    setEditingRule(null)
    setIsDialogOpen(false)
  }

  const handleEditRule = (rule: AutoRule) => {
    setEditingRule(rule)
    setNewRule({
      name: rule.name,
      enabled: rule.enabled,
      trigger: { ...rule.trigger },
      action: { ...rule.action },
    })
    setIsDialogOpen(true)
  }

  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
    toast({ title: "Regra removida", description: "A regra foi eliminada." })
  }

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const handleOpenDialog = () => {
    setEditingRule(null)
    setNewRule({
      name: "",
      enabled: true,
      trigger: { type: "income_received", value: "" },
      action: { type: "transfer_percentage", percentage: 10 },
    })
    setIsDialogOpen(true)
  }

  const executeRule = useCallback(
    async (rule: AutoRule) => {
      if (!rule.enabled) {
        toast({ title: "Regra desativada", description: "Ativa a regra antes de executar.", variant: "destructive" })
        return
      }

      if (!updateAccount || !updateGoal) {
        toast({ title: "Erro", description: "Sistema não está pronto. Tenta novamente.", variant: "destructive" })
        return
      }

      setExecutingRuleId(rule.id)

      try {
        // Find recent matching transactions
        const recentTx = transactions.filter((t) => {
          const txDate = new Date(t.date)
          const now = new Date()
          const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysDiff > 30) return false

          switch (rule.trigger.type) {
            case "income_received":
              if (t.type !== "income") return false
              if (rule.trigger.value && !t.description.toLowerCase().includes(rule.trigger.value.toLowerCase()))
                return false
              return true
            case "expense_contains":
              if (t.type !== "expense") return false
              if (!t.description.toLowerCase().includes(rule.trigger.value.toLowerCase())) return false
              return true
            case "amount_above":
              return t.amount > Number.parseFloat(rule.trigger.value)
            case "category_match":
              return t.category === rule.trigger.category
            default:
              return false
          }
        })

        if (recentTx.length === 0) {
          toast({
            title: "Sem transações correspondentes",
            description: "Não foram encontradas transações que correspondam a esta regra nos últimos 30 dias.",
          })
          setExecutingRuleId(null)
          return
        }

        const totalAmount = recentTx.reduce((sum, t) => sum + t.amount, 0)
        let amountToTransfer = 0

        if (rule.action.type === "transfer_percentage" && rule.action.percentage) {
          amountToTransfer = (totalAmount * rule.action.percentage) / 100
        } else if (rule.action.type === "transfer_fixed" && rule.action.fixedAmount) {
          amountToTransfer = rule.action.fixedAmount
        }

        if (amountToTransfer <= 0) {
          toast({ title: "Nada a transferir", description: "O valor a transferir é zero." })
          setExecutingRuleId(null)
          return
        }

        // Find source account with sufficient balance
        const sourceAccount =
          accounts.find((a) => a.type === "checking" && a.balance >= amountToTransfer) ||
          accounts.find((a) => a.balance >= amountToTransfer)

        if (!sourceAccount) {
          toast({
            title: "Saldo insuficiente",
            description: `Precisas de ${formatCurrency(amountToTransfer)} mas nenhuma conta tem saldo suficiente.`,
            variant: "destructive",
          })
          setExecutingRuleId(null)
          return
        }

        // Execute transfer to goal
        if (rule.action.targetGoalId) {
          const targetGoal = goals.find((g) => g.id === rule.action.targetGoalId)
          if (targetGoal) {
            await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - amountToTransfer })
            await updateGoal(rule.action.targetGoalId, { currentAmount: targetGoal.currentAmount + amountToTransfer })

            if (addTransaction) {
              await addTransaction({
                type: "savings",
                amount: amountToTransfer,
                description: `[Auto] ${rule.name}: ${sourceAccount.name} → ${targetGoal.name}`,
                category: "Automação",
                date: new Date().toISOString().split("T")[0],
                accountId: sourceAccount.id,
                goalId: rule.action.targetGoalId,
              })
            }

            // Update rule last executed
            setRules((prev) =>
              prev.map((r) => (r.id === rule.id ? { ...r, lastExecuted: new Date().toISOString() } : r)),
            )

            toast({
              title: "Regra executada com sucesso",
              description: `Transferidos ${formatCurrency(amountToTransfer)} de ${sourceAccount.name} para ${targetGoal.name}.`,
            })
          }
        }
        // Execute transfer to account
        else if (rule.action.targetAccountId) {
          const targetAccount = accounts.find((a) => a.id === rule.action.targetAccountId)
          if (targetAccount && targetAccount.id !== sourceAccount.id) {
            await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - amountToTransfer })
            await updateAccount(targetAccount.id, { balance: targetAccount.balance + amountToTransfer })

            if (addTransaction) {
              await addTransaction({
                type: "savings",
                amount: amountToTransfer,
                description: `[Auto] ${rule.name}: ${sourceAccount.name} → ${targetAccount.name}`,
                category: "Automação",
                date: new Date().toISOString().split("T")[0],
                accountId: sourceAccount.id,
              })
            }

            setRules((prev) =>
              prev.map((r) => (r.id === rule.id ? { ...r, lastExecuted: new Date().toISOString() } : r)),
            )

            toast({
              title: "Regra executada com sucesso",
              description: `Transferidos ${formatCurrency(amountToTransfer)} de ${sourceAccount.name} para ${targetAccount.name}.`,
            })
          } else {
            toast({
              title: "Erro",
              description: "Conta de destino inválida ou igual à origem.",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Configuração incompleta",
            description: "Seleciona uma conta ou meta de destino.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Error executing rule:", error)
        toast({
          title: "Erro ao executar",
          description: "Ocorreu um erro. Tenta novamente.",
          variant: "destructive",
        })
      }

      setExecutingRuleId(null)
    },
    [transactions, accounts, goals, addTransaction, updateAccount, updateGoal, formatCurrency, toast],
  )

  const getTriggerLabel = (trigger: AutoRule["trigger"]) => {
    switch (trigger.type) {
      case "income_received":
        return trigger.value ? `Receita contém "${trigger.value}"` : "Qualquer receita"
      case "expense_contains":
        return `Despesa contém "${trigger.value}"`
      case "amount_above":
        return `Valor acima de ${formatCurrency(Number.parseFloat(trigger.value) || 0)}`
      case "category_match":
        const cat = categories.find((c) => c.id === trigger.category)
        return `Categoria: ${cat?.name || trigger.category}`
      default:
        return "Gatilho desconhecido"
    }
  }

  const getActionLabel = (action: AutoRule["action"]) => {
    if (action.type === "transfer_percentage") {
      const target =
        goals.find((g) => g.id === action.targetGoalId)?.name ||
        accounts.find((a) => a.id === action.targetAccountId)?.name ||
        "destino"
      return `Transferir ${action.percentage}% para ${target}`
    }
    if (action.type === "transfer_fixed") {
      const target =
        goals.find((g) => g.id === action.targetGoalId)?.name ||
        accounts.find((a) => a.id === action.targetAccountId)?.name ||
        "destino"
      return `Transferir ${formatCurrency(action.fixedAmount || 0)} para ${target}`
    }
    if (action.type === "categorize") {
      return `Categorizar como ${action.targetCategory}`
    }
    return "Ação desconhecida"
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "savings":
        return <PiggyBank className="h-4 w-4" />
      case "investment":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Automações</h2>
          <p className="text-muted-foreground">Regras automáticas para gerir as tuas finanças</p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Sem automações</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Cria regras para automatizar transferências e categorização de transações.
            </p>
            <Button onClick={handleOpenDialog} variant="outline">
              Criar primeira regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={`transition-all ${!rule.enabled ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${rule.enabled ? "bg-primary/10" : "bg-muted"}`}
                    >
                      <Zap className={`h-5 w-5 ${rule.enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{rule.name}</h4>
                        <Badge variant={rule.enabled ? "default" : "secondary"} className="text-xs">
                          {rule.enabled ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span className="bg-muted px-2 py-0.5 rounded text-xs">{getTriggerLabel(rule.trigger)}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                          {getActionLabel(rule.action)}
                        </span>
                      </div>
                      {rule.lastExecuted && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Última execução: {new Date(rule.lastExecuted).toLocaleDateString("pt-PT")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => executeRule(rule)}
                      disabled={executingRuleId === rule.id || !rule.enabled}
                      title="Executar regra"
                      className="h-8 w-8"
                    >
                      {executingRuleId === rule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRule(rule)}
                      title="Editar regra"
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra Automática"}</DialogTitle>
            <DialogDescription>
              {editingRule ? "Altera as configurações desta regra." : "Define quando e o que fazer automaticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Nome da regra</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Ex: Poupar 10% do salário"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Quando (Gatilho)</Label>
              </div>

              <Select
                value={newRule.trigger.type}
                onValueChange={(v: AutoRule["trigger"]["type"]) =>
                  setNewRule({ ...newRule, trigger: { ...newRule.trigger, type: v } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income_received">Receber uma receita</SelectItem>
                  <SelectItem value="expense_contains">Despesa contém texto</SelectItem>
                  <SelectItem value="amount_above">Valor acima de</SelectItem>
                  <SelectItem value="category_match">Categoria específica</SelectItem>
                </SelectContent>
              </Select>

              {newRule.trigger.type === "income_received" && (
                <Input
                  value={newRule.trigger.value}
                  onChange={(e) => setNewRule({ ...newRule, trigger: { ...newRule.trigger, value: e.target.value } })}
                  placeholder="Filtrar por descrição (opcional, ex: Salário)"
                />
              )}

              {newRule.trigger.type === "expense_contains" && (
                <Input
                  value={newRule.trigger.value}
                  onChange={(e) => setNewRule({ ...newRule, trigger: { ...newRule.trigger, value: e.target.value } })}
                  placeholder="Texto a procurar (ex: Netflix)"
                />
              )}

              {newRule.trigger.type === "amount_above" && (
                <Input
                  type="number"
                  value={newRule.trigger.value}
                  onChange={(e) => setNewRule({ ...newRule, trigger: { ...newRule.trigger, value: e.target.value } })}
                  placeholder="Valor mínimo"
                />
              )}

              {newRule.trigger.type === "category_match" && (
                <Select
                  value={newRule.trigger.category}
                  onValueChange={(v) => setNewRule({ ...newRule, trigger: { ...newRule.trigger, category: v } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleciona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Então (Ação)</Label>
              </div>

              <Select
                value={newRule.action.type}
                onValueChange={(v: AutoRule["action"]["type"]) =>
                  setNewRule({ ...newRule, action: { ...newRule.action, type: v } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer_percentage">Transferir percentagem</SelectItem>
                  <SelectItem value="transfer_fixed">Transferir valor fixo</SelectItem>
                </SelectContent>
              </Select>

              {newRule.action.type === "transfer_percentage" && (
                <div className="space-y-2">
                  <Label>Percentagem a transferir</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={newRule.action.percentage || ""}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        action: { ...newRule.action, percentage: Number.parseInt(e.target.value) || 0 },
                      })
                    }
                    placeholder="10"
                  />
                </div>
              )}

              {newRule.action.type === "transfer_fixed" && (
                <div className="space-y-2">
                  <Label>Valor fixo a transferir</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newRule.action.fixedAmount || ""}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        action: { ...newRule.action, fixedAmount: Number.parseFloat(e.target.value) || 0 },
                      })
                    }
                    placeholder="100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Destino</Label>
                <Select
                  value={newRule.action.targetAccountId || newRule.action.targetGoalId || ""}
                  onValueChange={(v) => {
                    const isGoal = goals.some((g) => g.id === v)
                    setNewRule({
                      ...newRule,
                      action: {
                        ...newRule.action,
                        targetAccountId: isGoal ? undefined : v,
                        targetGoalId: isGoal ? v : undefined,
                      },
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleciona destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Contas</div>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        <div className="flex items-center gap-2">
                          {getAccountIcon(acc.type)}
                          {acc.name}
                        </div>
                      </SelectItem>
                    ))}
                    {goals.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Metas</div>
                        {goals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              {goal.name}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRule}>{editingRule ? "Guardar alterações" : "Criar regra"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
