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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
} from "lucide-react"
import type { AutoRule } from "@/lib/types"

export function AutomaticRules() {
  const financeContext = useFinance()
  const { formatCurrency } = useCurrency()

  const accounts = financeContext?.accounts || []
  const goals = financeContext?.goals || []
  const categories = financeContext?.categories || []
  const rules = financeContext?.rules || []
  const addRule = financeContext?.addRule
  const updateRule = financeContext?.updateRule
  const deleteRule = financeContext?.deleteRule

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

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId)
      } else {
        newSet.add(ruleId)
      }
      return newSet
    })
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

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || "Conta desconhecida"
  }

  const getGoalName = (goalId: string) => {
    return goals.find((g) => g.id === goalId)?.name || "Meta desconhecida"
  }

  // Calculate stats
  const totalRules = rules.length
  const activeRules = rules.filter((r) => r.enabled).length
  const totalExecutions = rules.reduce((sum, r) => sum + (r.executionCount || 0), 0)
  const totalAutomated = rules.reduce(
    (sum, r) => sum + (r.executions || []).filter((e) => !e.reversed).reduce((s, e) => s + e.amount, 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automações</h1>
          <p className="text-muted-foreground mt-1">
            Crie regras para automatizar transferências e categorizações. As regras são executadas automaticamente
            quando uma transação correspondente é registada.
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
                  : "Configure uma regra que será executada automaticamente quando uma transação correspondente for registada."}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totalRules}</p>
                <p className="text-xs text-amber-600/80">Total de Regras</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{activeRules}</p>
                <p className="text-xs text-emerald-600/80">Regras Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalExecutions}</p>
                <p className="text-xs text-blue-600/80">Execuções</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {formatCurrency(totalAutomated)}
                </p>
                <p className="text-xs text-purple-600/80">Total Automatizado</p>
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
                receita com "Salário" na descrição ou categoria, 10% será automaticamente transferido para a conta de
                poupança.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="grid gap-4">
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
          rules.map((rule) => (
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
                                Inativa
                              </Badge>
                            )}
                            {rule.executionCount && rule.executionCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {rule.executionCount}x executada
                              </Badge>
                            )}
                            {rule.lastExecuted && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(rule.lastExecuted).toLocaleDateString("pt-PT")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mt-3">
                        <span className="font-medium">{getTriggerLabel(rule.trigger)}</span>
                        <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="font-medium">{getActionLabel(rule.action)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {rule.executions && rule.executions.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${expandedRules.has(rule.id) ? "rotate-180" : ""}`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                  </div>

                  <CollapsibleContent>
                    {rule.executions && rule.executions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Histórico de Execuções</span>
                        </div>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {rule.executions
                              .slice()
                              .reverse()
                              .map((execution) => (
                                <div
                                  key={execution.id}
                                  className={`p-3 rounded-lg border ${
                                    execution.reversed
                                      ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                                      : "bg-muted/50 border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(execution.date).toLocaleDateString("pt-PT", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      {execution.reversed && (
                                        <Badge variant="destructive" className="text-xs">
                                          <RotateCcw className="h-3 w-3 mr-1" />
                                          Revertida
                                        </Badge>
                                      )}
                                    </div>
                                    <span
                                      className={`font-semibold ${
                                        execution.reversed ? "text-red-600 line-through" : "text-emerald-600"
                                      }`}
                                    >
                                      {formatCurrency(execution.amount)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <span>{getAccountName(execution.sourceAccountId)}</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span>
                                      {execution.targetAccountId
                                        ? getAccountName(execution.targetAccountId)
                                        : execution.targetGoalId
                                          ? getGoalName(execution.targetGoalId)
                                          : "Desconhecido"}
                                    </span>
                                  </div>
                                  {execution.reversed && execution.reversedAt && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Revertida em {new Date(execution.reversedAt).toLocaleDateString("pt-PT")}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  )
}
