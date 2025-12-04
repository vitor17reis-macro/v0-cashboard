"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/components/providers/currency-provider"
import {
  Plus,
  Zap,
  Pencil,
  Trash2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  History,
  RotateCcw,
  ArrowDownRight,
  TrendingUp,
  Loader2,
} from "lucide-react"
import type { AutoRule, RuleExecution } from "@/lib/types"

export function AutomaticRules() {
  const financeContext = useFinance()
  const currencyContext = useCurrency()

  const formatCurrency = currencyContext?.formatCurrency ?? ((v: number) => `€${v.toFixed(2)}`)
  const accounts = financeContext?.accounts ?? []
  const goals = financeContext?.goals ?? []
  const categories = financeContext?.categories ?? []
  const rules = financeContext?.rules ?? []
  const addRule = financeContext?.addRule
  const updateRule = financeContext?.updateRule
  const deleteRule = financeContext?.deleteRule
  const isLoading = financeContext?.isLoading ?? true

  const [isOpen, setIsOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

  // Form state
  const [name, setName] = useState("")
  const [triggerType, setTriggerType] = useState<AutoRule["trigger"]["type"]>("income_received")
  const [triggerValue, setTriggerValue] = useState("")
  const [triggerCategory, setTriggerCategory] = useState("")
  const [actionType, setActionType] = useState<AutoRule["action"]["type"]>("transfer_percentage")
  const [percentage, setPercentage] = useState("10")
  const [fixedAmount, setFixedAmount] = useState("")
  const [targetAccountId, setTargetAccountId] = useState("")
  const [targetGoalId, setTargetGoalId] = useState("")

  if (!financeContext || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
          <p className="text-muted-foreground">A carregar automações...</p>
        </div>
      </div>
    )
  }

  const toggleRuleExpanded = (ruleId: string) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRules(newExpanded)
  }

  const resetForm = () => {
    setName("")
    setTriggerType("income_received")
    setTriggerValue("")
    setTriggerCategory("")
    setActionType("transfer_percentage")
    setPercentage("10")
    setFixedAmount("")
    setTargetAccountId("")
    setTargetGoalId("")
    setEditingRule(null)
  }

  const handleEdit = (rule: AutoRule) => {
    setEditingRule(rule)
    setName(rule.name)
    setTriggerType(rule.trigger.type)
    setTriggerValue(rule.trigger.value || "")
    setTriggerCategory(rule.trigger.category || "")
    setActionType(rule.action.type)
    setPercentage(rule.action.percentage?.toString() || "10")
    setFixedAmount(rule.action.fixedAmount?.toString() || "")
    setTargetAccountId(rule.action.targetAccountId || "")
    setTargetGoalId(rule.action.targetGoalId || "")
    setIsOpen(true)
  }

  const handleSaveRule = () => {
    if (!addRule || !updateRule) {
      console.error("[v0] addRule or updateRule function not available")
      return
    }

    const ruleData = {
      name,
      enabled: true,
      trigger: {
        type: triggerType,
        value: triggerValue,
        category: triggerCategory || undefined,
      },
      action: {
        type: actionType,
        percentage: actionType === "transfer_percentage" ? Number.parseFloat(percentage) : undefined,
        fixedAmount: actionType === "transfer_fixed" ? Number.parseFloat(fixedAmount) : undefined,
        targetAccountId: targetAccountId || undefined,
        targetGoalId: targetGoalId || undefined,
      },
    }

    if (editingRule) {
      updateRule(editingRule.id, ruleData)
    } else {
      addRule(ruleData)
    }

    resetForm()
    setIsOpen(false)
  }

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    if (updateRule) {
      updateRule(ruleId, { enabled })
    }
  }

  const handleDeleteRule = (ruleId: string) => {
    if (deleteRule && confirm("Tem a certeza que deseja eliminar esta regra?")) {
      deleteRule(ruleId)
    }
  }

  const getTriggerLabel = (trigger: AutoRule["trigger"]) => {
    switch (trigger.type) {
      case "income_received":
        return `Quando receber "${trigger.value}"`
      case "expense_contains":
        return `Quando despesa contiver "${trigger.value}"`
      case "amount_above":
        return `Quando valor for acima de ${trigger.value}€`
      case "category_match":
        return `Quando categoria for "${trigger.category}"`
      default:
        return "Condição desconhecida"
    }
  }

  const getActionLabel = (action: AutoRule["action"]) => {
    const target = action.targetAccountId
      ? accounts.find((a) => a.id === action.targetAccountId)?.name
      : action.targetGoalId
        ? goals.find((g) => g.id === action.targetGoalId)?.name
        : "Destino desconhecido"

    switch (action.type) {
      case "transfer_percentage":
        return `Transferir ${action.percentage}% para ${target}`
      case "transfer_fixed":
        return `Transferir ${action.fixedAmount}€ para ${target}`
      case "categorize":
        return `Categorizar como ${action.targetCategory}`
      default:
        return "Ação desconhecida"
    }
  }

  const getTargetName = (execution: RuleExecution) => {
    if (execution.targetAccountId) {
      return accounts.find((a) => a.id === execution.targetAccountId)?.name || "Conta"
    }
    if (execution.targetGoalId) {
      return goals.find((g) => g.id === execution.targetGoalId)?.name || "Meta"
    }
    return "Desconhecido"
  }

  const getSourceName = (execution: RuleExecution) => {
    return accounts.find((a) => a.id === execution.sourceAccountId)?.name || "Conta"
  }

  // Calculate stats
  const totalExecutions = rules.reduce((sum, r) => sum + (r.executionCount || 0), 0)
  const totalAutomated = rules.reduce((sum, r) => {
    const executions = r.executions || []
    return sum + executions.filter((e) => e.status === "executed").reduce((s, e) => s + e.amount, 0)
  }, 0)
  const activeRulesCount = rules.filter((r) => r.enabled).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automações</h1>
          <p className="text-muted-foreground mt-1">
            Crie regras para automatizar transferências. As regras executam automaticamente quando uma transação
            correspondente é registada.
          </p>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Plus className="h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                {editingRule ? "Editar Regra" : "Criar Nova Regra"}
              </DialogTitle>
              <DialogDescription>
                {editingRule
                  ? "Modifique as configurações da regra de automação."
                  : "Configure uma regra que será executada automaticamente."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  placeholder="Ex: Poupar 10% do salário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Quando (Trigger)</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutoRule["trigger"]["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income_received">Receber rendimento com...</SelectItem>
                    <SelectItem value="expense_contains">Despesa contiver...</SelectItem>
                    <SelectItem value="amount_above">Valor acima de...</SelectItem>
                    <SelectItem value="category_match">Categoria específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerType === "category_match" ? (
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={triggerCategory} onValueChange={setTriggerCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Valor / Palavra-chave</Label>
                  <Input
                    placeholder={
                      triggerType === "amount_above"
                        ? "1000"
                        : triggerType === "income_received"
                          ? "Salário"
                          : "Netflix"
                    }
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Então (Ação)</Label>
                <Select value={actionType} onValueChange={(v) => setActionType(v as AutoRule["action"]["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer_percentage">Transferir percentagem</SelectItem>
                    <SelectItem value="transfer_fixed">Transferir valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {actionType === "transfer_percentage" && (
                <div className="space-y-2">
                  <Label>Percentagem (%)</Label>
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
                  <Label>Valor Fixo (€)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Destino</Label>
                <Select
                  value={targetAccountId || targetGoalId || ""}
                  onValueChange={(v) => {
                    const isAccount = accounts.some((a) => a.id === v)
                    if (isAccount) {
                      setTargetAccountId(v)
                      setTargetGoalId("")
                    } else {
                      setTargetGoalId(v)
                      setTargetAccountId("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione conta ou meta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Contas</div>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {goals.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Metas</div>
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
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsOpen(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveRule}
                disabled={!name || (!targetAccountId && !targetGoalId)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {editingRule ? "Guardar Alterações" : "Criar Regra"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">Regras Ativas</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{activeRulesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Total Automatizado</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(totalAutomated)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Execuções Totais</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Como funcionam as automações?</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Quando regista uma transação que corresponde a uma regra ativa, a automação é executada automaticamente.
                Por exemplo: se criar uma regra "Quando receber Salário, transferir 10% para Poupança", ao registar uma
                receita com "Salário" na descrição ou categoria, 10% será automaticamente transferido. Se reverter a
                transação no histórico, o valor volta à conta de origem.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sem regras configuradas</h3>
              <p className="text-muted-foreground mb-4">Crie a sua primeira regra para automatizar as suas finanças.</p>
              <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Regra
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => {
            const ruleExecutions = rule.executions || []
            return (
              <Collapsible
                key={rule.id}
                open={expandedRules.has(rule.id)}
                onOpenChange={() => toggleRuleExpanded(rule.id)}
              >
                <Card
                  className={`transition-all duration-300 ${
                    rule.enabled ? "border-amber-200 dark:border-amber-800 shadow-md" : "opacity-60 border-muted"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`p-2 rounded-lg ${
                              rule.enabled ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-muted"
                            }`}
                          >
                            <Zap className={`h-4 w-4 ${rule.enabled ? "text-white" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{rule.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {rule.enabled ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pausada
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {rule.executionCount || 0} execuções
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 bg-muted/50 rounded-lg p-2">
                          <span className="font-medium">{getTriggerLabel(rule.trigger)}</span>
                          <ArrowRight className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">{getActionLabel(rule.action)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Execution History Toggle */}
                    {ruleExecutions.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full mt-3 gap-2">
                          <History className="h-4 w-4" />
                          Ver Histórico ({ruleExecutions.length})
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${expandedRules.has(rule.id) ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    )}

                    <CollapsibleContent>
                      <ScrollArea className="h-[200px] mt-3 rounded-lg border p-3">
                        <div className="space-y-2">
                          {ruleExecutions.map((execution, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                                execution.status === "reversed"
                                  ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                                  : "bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {execution.status === "reversed" ? (
                                  <RotateCcw className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                                )}
                                <div>
                                  <span className="font-medium">{formatCurrency(execution.amount)}</span>
                                  <span className="text-muted-foreground mx-1">→</span>
                                  <span>{getTargetName(execution)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {execution.status === "reversed" && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                                    Revertida
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(execution.executedAt).toLocaleDateString("pt-PT")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            )
          })
        )}
      </div>
    </div>
  )
}
