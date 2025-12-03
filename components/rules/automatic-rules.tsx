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
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Plus, Zap, Pencil, Trash2, Sparkles, CheckCircle2, ChevronDown, History, Undo2, Loader2 } from "lucide-react"
import type { AutoRule } from "@/lib/types"

export function AutomaticRules() {
  const { formatAmount } = useCurrency()
  const financeContext = useFinance()

  const [isOpen, setIsOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

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

  if (!financeContext) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">A carregar automações...</p>
        </div>
      </div>
    )
  }

  const { accounts, goals, categories, rules, addRule, updateRule, deleteRule, isLoading } = financeContext

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">A carregar automações...</p>
        </div>
      </div>
    )
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
    if (!name) return

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

    setIsOpen(false)
    resetForm()
  }

  const toggleExpanded = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev)
      if (next.has(ruleId)) {
        next.delete(ruleId)
      } else {
        next.add(ruleId)
      }
      return next
    })
  }

  const getTargetName = (rule: AutoRule) => {
    if (rule.action.targetAccountId) {
      const account = accounts.find((a) => a.id === rule.action.targetAccountId)
      return account?.name || "Conta desconhecida"
    }
    if (rule.action.targetGoalId) {
      const goal = goals.find((g) => g.id === rule.action.targetGoalId)
      return goal?.name || "Meta desconhecida"
    }
    return "Não definido"
  }

  const incomeCategories = categories.filter((c) => c.type === "income")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span className="text-sm text-muted-foreground">
            {rules.length} {rules.length === 1 ? "regra" : "regras"} configuradas
          </span>
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
                <Sparkles className="h-5 w-5 text-amber-500" />
                {editingRule ? "Editar Regra" : "Nova Regra de Automação"}
              </DialogTitle>
              <DialogDescription>
                Configure uma regra para automatizar transferências quando certas condições são cumpridas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Regra</Label>
                <Input placeholder="Ex: Poupar 10% do salário" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Quando...</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutoRule["trigger"]["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income_received">Receber uma receita</SelectItem>
                    <SelectItem value="category_match">Transação de categoria específica</SelectItem>
                    <SelectItem value="amount_above">Montante acima de...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerType === "income_received" && (
                <div className="space-y-2">
                  <Label>Categoria de Receita (opcional)</Label>
                  <Select value={triggerCategory} onValueChange={setTriggerCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer receita" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer receita</SelectItem>
                      {incomeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {triggerType === "category_match" && (
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={triggerCategory} onValueChange={setTriggerCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
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

              {triggerType === "amount_above" && (
                <div className="space-y-2">
                  <Label>Montante mínimo (€)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Ação</Label>
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
                    min="1"
                    max="100"
                  />
                </div>
              )}

              {actionType === "transfer_fixed" && (
                <div className="space-y-2">
                  <Label>Valor Fixo (€)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    min="0"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Transferir para...</Label>
                <Select
                  value={targetAccountId || targetGoalId}
                  onValueChange={(v) => {
                    const account = accounts.find((a) => a.id === v)
                    const goal = goals.find((g) => g.id === v)
                    if (account) {
                      setTargetAccountId(v)
                      setTargetGoalId("")
                    } else if (goal) {
                      setTargetGoalId(v)
                      setTargetAccountId("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" disabled>
                      Contas
                    </SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                    {goals.length > 0 && (
                      <>
                        <SelectItem value="" disabled>
                          Metas
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
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveRule}
                disabled={!name || (!targetAccountId && !targetGoalId)}
                className="bg-gradient-to-r from-amber-500 to-orange-500"
              >
                {editingRule ? "Guardar" : "Criar Regra"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Como funcionam as automações?</p>
              <p className="text-sm text-muted-foreground mt-1">
                As regras são executadas automaticamente quando regista uma transação que corresponde às condições. Por
                exemplo, ao registar o salário, uma percentagem pode ser automaticamente transferida para poupança.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {rules.length > 0 ? (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Collapsible key={rule.id} open={expandedRules.has(rule.id)} onOpenChange={() => toggleExpanded(rule.id)}>
              <Card className={`transition-all ${rule.enabled ? "" : "opacity-60"}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          rule.enabled ? "bg-amber-500/20" : "bg-muted"
                        }`}
                      >
                        <Zap className={`h-5 w-5 ${rule.enabled ? "text-amber-500" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.action.type === "transfer_percentage"
                            ? `${rule.action.percentage}%`
                            : formatAmount(rule.action.fixedAmount || 0)}{" "}
                          → {getTargetName(rule)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.enabled ? "default" : "secondary"}>{rule.executionCount} execuções</Badge>
                      <Switch checked={rule.enabled} onCheckedChange={(enabled) => updateRule(rule.id, { enabled })} />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${expandedRules.has(rule.id) ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-4">
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Histórico de Execuções</span>
                      </div>
                      {rule.executions && rule.executions.length > 0 ? (
                        <div className="space-y-2">
                          {rule.executions.slice(0, 5).map((exec) => (
                            <div
                              key={exec.id}
                              className={`flex items-center justify-between p-2 rounded-lg bg-muted/50 ${
                                exec.reversed ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {exec.reversed ? (
                                  <Undo2 className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                )}
                                <span className="text-sm">{new Date(exec.date).toLocaleDateString("pt-PT")}</span>
                                <span className="text-sm text-muted-foreground">{exec.triggeredBy}</span>
                              </div>
                              <span className={`text-sm font-medium ${exec.reversed ? "line-through" : ""}`}>
                                {formatAmount(exec.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sem execuções registadas</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium">Sem regras configuradas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie a sua primeira regra para automatizar as suas finanças.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
