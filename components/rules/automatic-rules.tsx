"use client"

import { useState, useEffect, useCallback } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Zap, Plus, Trash2, ArrowRight, PiggyBank, Tag, Repeat, Settings2, Pencil, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
    type: "transfer_percentage" | "transfer_fixed" | "auto_categorize" | "create_recurring"
    targetAccountId?: string
    targetGoalId?: string
    percentage?: number
    fixedAmount?: number
    categoryId?: string
  }
}

const RULE_STORAGE_KEY = "cashboard_auto_rules"

export function AutomaticRules() {
  const financeContext = useFinance()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [rules, setRules] = useState<AutoRule[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [executingRuleId, setExecutingRuleId] = useState<string | null>(null)

  // Safe access to arrays and functions
  const accounts = financeContext?.accounts || []
  const goals = financeContext?.goals || []
  const categories = financeContext?.categories || []
  const transactions = financeContext?.transactions || []
  const addTransaction = financeContext?.addTransaction
  const updateAccount = financeContext?.updateAccount
  const updateGoal = financeContext?.updateGoal

  // Form state
  const [ruleName, setRuleName] = useState("")
  const [triggerType, setTriggerType] = useState<AutoRule["trigger"]["type"]>("income_received")
  const [triggerValue, setTriggerValue] = useState("")
  const [triggerCategory, setTriggerCategory] = useState("")
  const [actionType, setActionType] = useState<AutoRule["action"]["type"]>("transfer_percentage")
  const [targetAccountId, setTargetAccountId] = useState("")
  const [targetGoalId, setTargetGoalId] = useState("")
  const [percentage, setPercentage] = useState("")
  const [fixedAmount, setFixedAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")

  // Load rules from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RULE_STORAGE_KEY)
      if (saved) {
        setRules(JSON.parse(saved))
      }
    } catch (e) {
      console.error("[v0] Error loading rules:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save rules to localStorage
  const saveRules = (newRules: AutoRule[]) => {
    setRules(newRules)
    try {
      localStorage.setItem(RULE_STORAGE_KEY, JSON.stringify(newRules))
    } catch (e) {
      console.error("[v0] Error saving rules:", e)
    }
  }

  const resetForm = () => {
    setRuleName("")
    setTriggerType("income_received")
    setTriggerValue("")
    setTriggerCategory("")
    setActionType("transfer_percentage")
    setTargetAccountId("")
    setTargetGoalId("")
    setPercentage("")
    setFixedAmount("")
    setCategoryId("")
    setEditingRule(null)
  }

  const populateFormFromRule = (rule: AutoRule) => {
    setRuleName(rule.name)
    setTriggerType(rule.trigger.type)
    setTriggerValue(rule.trigger.value)
    setTriggerCategory(rule.trigger.category || "")
    setActionType(rule.action.type)
    setTargetAccountId(rule.action.targetAccountId || "")
    setTargetGoalId(rule.action.targetGoalId || "")
    setPercentage(rule.action.percentage?.toString() || "")
    setFixedAmount(rule.action.fixedAmount?.toString() || "")
    setCategoryId(rule.action.categoryId || "")
  }

  const handleEditRule = (rule: AutoRule) => {
    setEditingRule(rule)
    populateFormFromRule(rule)
    setIsAddOpen(true)
  }

  const handleSaveRule = () => {
    if (!ruleName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da regra é obrigatório.",
        variant: "destructive",
      })
      return
    }

    const ruleData: AutoRule = {
      id: editingRule?.id || crypto.randomUUID(),
      name: ruleName,
      enabled: editingRule?.enabled ?? true,
      trigger: {
        type: triggerType,
        value: triggerValue,
        category: triggerCategory || undefined,
      },
      action: {
        type: actionType,
        targetAccountId: targetAccountId || undefined,
        targetGoalId: targetGoalId || undefined,
        percentage: percentage ? Number.parseFloat(percentage) : undefined,
        fixedAmount: fixedAmount ? Number.parseFloat(fixedAmount) : undefined,
        categoryId: categoryId || undefined,
      },
    }

    if (editingRule) {
      saveRules(rules.map((r) => (r.id === editingRule.id ? ruleData : r)))
      toast({
        title: "Regra atualizada",
        description: `A regra "${ruleName}" foi atualizada com sucesso.`,
      })
    } else {
      saveRules([...rules, ruleData])
      toast({
        title: "Regra criada",
        description: `A regra "${ruleName}" foi criada com sucesso.`,
      })
    }

    resetForm()
    setIsAddOpen(false)
  }

  const executeRule = useCallback(
    async (rule: AutoRule) => {
      if (!rule.enabled) return

      setExecutingRuleId(rule.id)

      try {
        // Find recent matching transactions
        const recentTx = transactions.filter((t) => {
          const txDate = new Date(t.date)
          const now = new Date()
          const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysDiff > 30) return false // Only last 30 days

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

        // Calculate total amount to act on
        const totalAmount = recentTx.reduce((sum, t) => sum + t.amount, 0)
        let amountToTransfer = 0

        if (rule.action.type === "transfer_percentage" && rule.action.percentage) {
          amountToTransfer = (totalAmount * rule.action.percentage) / 100
        } else if (rule.action.type === "transfer_fixed" && rule.action.fixedAmount) {
          amountToTransfer = rule.action.fixedAmount
        }

        if (amountToTransfer > 0) {
          // Find source account (first account with sufficient balance)
          const sourceAccount = accounts.find((a) => a.balance >= amountToTransfer)

          if (!sourceAccount) {
            toast({
              title: "Saldo insuficiente",
              description: "Nenhuma conta tem saldo suficiente para esta transferência.",
              variant: "destructive",
            })
            setExecutingRuleId(null)
            return
          }

          // Execute transfer
          if (rule.action.targetGoalId) {
            const targetGoal = goals.find((g) => g.id === rule.action.targetGoalId)
            if (targetGoal && updateGoal && updateAccount) {
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
                })
              }

              toast({
                title: "Regra executada",
                description: `Transferidos ${formatCurrency(amountToTransfer)} para ${targetGoal.name}.`,
              })
            }
          } else if (rule.action.targetAccountId) {
            const targetAccount = accounts.find((a) => a.id === rule.action.targetAccountId)
            if (targetAccount && updateAccount) {
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

              toast({
                title: "Regra executada",
                description: `Transferidos ${formatCurrency(amountToTransfer)} para ${targetAccount.name}.`,
              })
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error executing rule:", error)
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao executar a regra.",
          variant: "destructive",
        })
      }

      setExecutingRuleId(null)
    },
    [transactions, accounts, goals, addTransaction, updateAccount, updateGoal, formatCurrency, toast],
  )

  const toggleRule = (id: string) => {
    const newRules = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    saveRules(newRules)
  }

  const deleteRule = (id: string) => {
    saveRules(rules.filter((r) => r.id !== id))
    setDeletingRuleId(null)
    toast({
      title: "Regra eliminada",
      description: "A regra foi eliminada com sucesso.",
    })
  }

  const getTriggerLabel = (trigger: AutoRule["trigger"]) => {
    switch (trigger.type) {
      case "income_received":
        return `Quando receber rendimento ${trigger.value ? `de "${trigger.value}"` : ""}`
      case "expense_contains":
        return `Quando despesa contiver "${trigger.value}"`
      case "amount_above":
        return `Quando valor acima de ${formatCurrency(Number.parseFloat(trigger.value) || 0)}`
      case "category_match":
        const cat = categories.find((c) => c.id === trigger.category)
        return `Quando categoria for "${cat?.name || trigger.category}"`
    }
  }

  const getActionLabel = (action: AutoRule["action"]) => {
    switch (action.type) {
      case "transfer_percentage":
        const pctAccount = accounts.find((a) => a.id === action.targetAccountId)
        const pctGoal = goals.find((g) => g.id === action.targetGoalId)
        const target = pctGoal?.name || pctAccount?.name || "?"
        return `Transferir ${action.percentage}% para ${target}`
      case "transfer_fixed":
        const fixAccount = accounts.find((a) => a.id === action.targetAccountId)
        const fixGoal = goals.find((g) => g.id === action.targetGoalId)
        const fixTarget = fixGoal?.name || fixAccount?.name || "?"
        return `Transferir ${formatCurrency(action.fixedAmount || 0)} para ${fixTarget}`
      case "auto_categorize":
        const categ = categories.find((c) => c.id === action.categoryId)
        return `Categorizar como "${categ?.name || action.categoryId}"`
      case "create_recurring":
        return "Criar transação recorrente"
    }
  }

  const getActionIcon = (type: AutoRule["action"]["type"]) => {
    switch (type) {
      case "transfer_percentage":
      case "transfer_fixed":
        return <PiggyBank className="h-4 w-4" />
      case "auto_categorize":
        return <Tag className="h-4 w-4" />
      case "create_recurring":
        return <Repeat className="h-4 w-4" />
    }
  }

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold">Regras Automáticas</h3>
              <p className="text-sm text-muted-foreground">Automatiza transferências e categorizações</p>
            </div>
          </div>
        </div>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">A carregar...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold">Regras Automáticas</h3>
            <p className="text-sm text-muted-foreground">Automatiza transferências e categorizações</p>
          </div>
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar Regra" : "Criar Regra Automática"}</DialogTitle>
              <DialogDescription>Define quando e o que acontece automaticamente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Nome da Regra</Label>
                <Input
                  placeholder="Ex: Poupar 10% do salário"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  Quando...
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Gatilho</Label>
                  <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutoRule["trigger"]["type"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income_received">Receber rendimento</SelectItem>
                      <SelectItem value="expense_contains">Despesa contiver texto</SelectItem>
                      <SelectItem value="amount_above">Valor acima de</SelectItem>
                      <SelectItem value="category_match">Categoria específica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(triggerType === "income_received" || triggerType === "expense_contains") && (
                  <div className="space-y-2">
                    <Label>Texto (opcional)</Label>
                    <Input
                      placeholder="Ex: Salário, Netflix..."
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                    />
                  </div>
                )}

                {triggerType === "amount_above" && (
                  <div className="space-y-2">
                    <Label>Valor mínimo</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                    />
                  </div>
                )}

                {triggerType === "category_match" && (
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={triggerCategory} onValueChange={setTriggerCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowRight className="h-4 w-4" />
                  Então...
                </div>

                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select value={actionType} onValueChange={(v) => setActionType(v as AutoRule["action"]["type"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer_percentage">Transferir percentagem</SelectItem>
                      <SelectItem value="transfer_fixed">Transferir valor fixo</SelectItem>
                      <SelectItem value="auto_categorize">Categorizar automaticamente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {actionType === "transfer_percentage" && (
                  <div className="space-y-2">
                    <Label>Percentagem</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                    />
                  </div>
                )}

                {actionType === "transfer_fixed" && (
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                    />
                  </div>
                )}

                {(actionType === "transfer_percentage" || actionType === "transfer_fixed") && (
                  <>
                    <div className="space-y-2">
                      <Label>Para Conta</Label>
                      <Select
                        value={targetAccountId}
                        onValueChange={(v) => {
                          setTargetAccountId(v)
                          setTargetGoalId("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ou Para Meta</Label>
                      <Select
                        value={targetGoalId}
                        onValueChange={(v) => {
                          setTargetGoalId(v)
                          setTargetAccountId("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar meta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {goals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {actionType === "auto_categorize" && (
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveRule} className="w-full">
                {editingRule ? "Guardar Alterações" : "Criar Regra"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium mb-2">Sem regras automáticas</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Cria regras para automatizar transferências e categorizações.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={`bg-card/50 backdrop-blur-sm transition-all duration-300 ${!rule.enabled ? "opacity-60" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${rule.enabled ? "bg-primary/10" : "bg-muted"}`}>
                      {getActionIcon(rule.action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{rule.name}</h4>
                        <Badge variant={rule.enabled ? "default" : "secondary"} className="text-xs shrink-0">
                          {rule.enabled ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{getTriggerLabel(rule.trigger)}</p>
                      <p className="text-sm font-medium text-primary">{getActionLabel(rule.action)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => executeRule(rule)}
                      disabled={!rule.enabled || executingRuleId === rule.id}
                      className="h-8 w-8"
                      title="Executar agora"
                    >
                      <Play className={`h-4 w-4 ${executingRuleId === rule.id ? "animate-pulse" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditRule(rule)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingRuleId(rule.id)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRuleId} onOpenChange={() => setDeletingRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Regra</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres eliminar esta regra? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingRuleId && deleteRule(deletingRuleId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
