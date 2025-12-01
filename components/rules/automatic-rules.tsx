"use client"

import { useState, useEffect } from "react"
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
import { Zap, Plus, Trash2, ArrowRight, PiggyBank, Tag, Repeat, Settings2, Pencil } from "lucide-react"

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
  const [rules, setRules] = useState<AutoRule[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Safe access to arrays
  const accounts = financeContext?.accounts || []
  const goals = financeContext?.goals || []
  const categories = financeContext?.categories || []

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
    if (!ruleName.trim()) return

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
      // Update existing rule
      saveRules(rules.map((r) => (r.id === editingRule.id ? ruleData : r)))
    } else {
      // Add new rule
      saveRules([...rules, ruleData])
    }

    resetForm()
    setIsAddOpen(false)
  }

  const toggleRule = (id: string) => {
    const newRules = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    saveRules(newRules)
  }

  const deleteRule = (id: string) => {
    saveRules(rules.filter((r) => r.id !== id))
    setDeletingRuleId(null)
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
                      <SelectItem value="income_received">Receber Rendimento</SelectItem>
                      <SelectItem value="expense_contains">Despesa Contém Texto</SelectItem>
                      <SelectItem value="amount_above">Valor Acima De</SelectItem>
                      <SelectItem value="category_match">Categoria Específica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {triggerType === "income_received" && (
                  <div className="space-y-2">
                    <Label>Descrição contém (opcional)</Label>
                    <Input
                      placeholder="Ex: Salário, Freelance..."
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                    />
                  </div>
                )}

                {triggerType === "expense_contains" && (
                  <div className="space-y-2">
                    <Label>Texto na descrição</Label>
                    <Input
                      placeholder="Ex: Netflix, Spotify..."
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                    />
                  </div>
                )}

                {triggerType === "amount_above" && (
                  <div className="space-y-2">
                    <Label>Valor mínimo (€)</Label>
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

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  Então...
                </div>

                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select value={actionType} onValueChange={(v) => setActionType(v as AutoRule["action"]["type"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer_percentage">Transferir Percentagem</SelectItem>
                      <SelectItem value="transfer_fixed">Transferir Valor Fixo</SelectItem>
                      <SelectItem value="auto_categorize">Categorizar Automaticamente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(actionType === "transfer_percentage" || actionType === "transfer_fixed") && (
                  <>
                    <div className="space-y-2">
                      <Label>Destino</Label>
                      <Select
                        value={targetGoalId || targetAccountId}
                        onValueChange={(v) => {
                          const isGoal = goals.find((g) => g.id === v)
                          if (isGoal) {
                            setTargetGoalId(v)
                            setTargetAccountId("")
                          } else {
                            setTargetAccountId(v)
                            setTargetGoalId("")
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.length > 0 && (
                            <>
                              <SelectItem value="_accounts_label" disabled className="font-semibold text-xs">
                                — Contas —
                              </SelectItem>
                              {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {goals.length > 0 && (
                            <>
                              <SelectItem value="_goals_label" disabled className="font-semibold text-xs">
                                — Metas —
                              </SelectItem>
                              {goals.map((goal) => (
                                <SelectItem key={goal.id} value={goal.id}>
                                  {goal.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {actionType === "transfer_percentage" && (
                      <div className="space-y-2">
                        <Label>Percentagem (%)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="10"
                          value={percentage}
                          onChange={(e) => setPercentage(e.target.value)}
                        />
                      </div>
                    )}

                    {actionType === "transfer_fixed" && (
                      <div className="space-y-2">
                        <Label>Valor (€)</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="50"
                          value={fixedAmount}
                          onChange={(e) => setFixedAmount(e.target.value)}
                        />
                      </div>
                    )}
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

              <Button onClick={handleSaveRule} className="w-full" disabled={!ruleName.trim()}>
                {editingRule ? "Guardar Alterações" : "Criar Regra"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Sem Regras Configuradas</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Cria regras para automatizar transferências e categorizações.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={`bg-card/50 backdrop-blur-sm transition-all ${
                rule.enabled ? "border-border/50" : "border-border/30 opacity-60"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      {rule.enabled && (
                        <Badge variant="secondary" className="text-xs">
                          Ativa
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{getTriggerLabel(rule.trigger)}</p>
                  </div>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-1.5 rounded bg-primary/10">{getActionIcon(rule.action.type)}</div>
                    <span className="text-muted-foreground">{getActionLabel(rule.action)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingRuleId(rule.id)}
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

      <AlertDialog open={!!deletingRuleId} onOpenChange={(open) => !open && setDeletingRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Regra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar esta regra? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRuleId && deleteRule(deletingRuleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
