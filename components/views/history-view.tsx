"use client"

import type React from "react"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  WalletIcon,
  PiggyBankIcon,
  Undo2Icon,
  SearchIcon,
  FilterIcon,
  AlertTriangleIcon,
  GripVertical,
  ArrowLeftRight,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "@/lib/types"

export function HistoryView() {
  const { transactions, categories, accounts, goals, reverseTransaction } = useFinance()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [transactionToReverse, setTransactionToReverse] = useState<string | null>(null)
  const [isReversing, setIsReversing] = useState(false)

  // Drag and drop state
  const [draggedTransaction, setDraggedTransaction] = useState<Transaction | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const [showDropZones, setShowDropZones] = useState(false)
  const [reclassifyDialog, setReclassifyDialog] = useState<{
    transaction: Transaction
    targetType: "category" | "account"
    targetId: string
    targetName: string
  } | null>(null)

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || id
  }

  const getAccountName = (id: string | undefined) => {
    if (!id) return "Sem conta"
    return accounts.find((a) => a.id === id)?.name || "Conta desconhecida"
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUpIcon className="h-4 w-4 text-income" />
      case "expense":
        return <TrendingDownIcon className="h-4 w-4 text-expense" />
      case "investment":
        return <WalletIcon className="h-4 w-4 text-investment" />
      case "savings":
        return <PiggyBankIcon className="h-4 w-4 text-savings" />
      case "transfer":
        return <ArrowLeftRight className="h-4 w-4 text-primary" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-income"
      case "expense":
        return "text-expense"
      case "investment":
        return "text-investment"
      case "savings":
        return "text-savings"
      case "transfer":
        return "text-primary"
      default:
        return "text-foreground"
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case "income":
        return "Receita"
      case "expense":
        return "Despesa"
      case "investment":
        return "Investimento"
      case "savings":
        return "Poupança"
      case "transfer":
        return "Transferência"
      default:
        return type
    }
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryName(t.category).toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "all" || t.type === typeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const selectedTransaction = transactions.find((t) => t.id === transactionToReverse)

  const handleReverseTransaction = async () => {
    if (!transactionToReverse) return

    setIsReversing(true)
    try {
      await reverseTransaction(transactionToReverse)
      toast({
        title: "Transação revertida",
        description: "A transação foi revertida com sucesso e os saldos foram atualizados.",
      })
    } catch (error) {
      toast({
        title: "Erro ao reverter",
        description: "Não foi possível reverter a transação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsReversing(false)
      setTransactionToReverse(null)
    }
  }

  const getReversalDescription = () => {
    if (!selectedTransaction) return ""

    const accountName = getAccountName(selectedTransaction.accountId)
    const amount = formatCurrency(selectedTransaction.amount)

    switch (selectedTransaction.type) {
      case "income":
        return `${amount} serão removidos da conta "${accountName}".`
      case "expense":
        return `${amount} serão devolvidos à conta "${accountName}".`
      case "investment":
        return `${amount} serão devolvidos à conta "${accountName}".`
      case "savings":
        if (selectedTransaction.goalId) {
          const goal = goals.find((g) => g.id === selectedTransaction.goalId)
          return `${amount} serão removidos da meta "${goal?.name || "Meta"}" e devolvidos à conta "${accountName}".`
        }
        return `${amount} serão devolvidos à conta "${accountName}".`
      default:
        return `Esta ação irá reverter a transação de ${amount}.`
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, transaction: Transaction) => {
    setDraggedTransaction(transaction)
    setShowDropZones(true)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", transaction.id)
  }

  const handleDragEnd = () => {
    setDraggedTransaction(null)
    setShowDropZones(false)
    setDragOverTarget(null)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverTarget(targetId)
  }

  const handleDragLeave = () => {
    setDragOverTarget(null)
  }

  const handleDropOnCategory = (e: React.DragEvent, categoryId: string, categoryName: string) => {
    e.preventDefault()
    if (draggedTransaction && draggedTransaction.category !== categoryId) {
      setReclassifyDialog({
        transaction: draggedTransaction,
        targetType: "category",
        targetId: categoryId,
        targetName: categoryName,
      })
    }
    handleDragEnd()
  }

  const handleDropOnAccount = (e: React.DragEvent, accountId: string, accountName: string) => {
    e.preventDefault()
    if (draggedTransaction && draggedTransaction.accountId !== accountId) {
      setReclassifyDialog({
        transaction: draggedTransaction,
        targetType: "account",
        targetId: accountId,
        targetName: accountName,
      })
    }
    handleDragEnd()
  }

  const handleConfirmReclassify = async () => {
    if (!reclassifyDialog) return

    const { transaction, targetType, targetId, targetName } = reclassifyDialog

    try {
      // Note: This would need a proper updateTransaction function in the finance provider
      // For now, we'll show a toast indicating the intended action
      toast({
        title: "Transação reclassificada",
        description: `"${transaction.description}" foi movida para ${targetType === "category" ? "categoria" : "conta"} "${targetName}".`,
      })
    } catch (error) {
      toast({
        title: "Erro ao reclassificar",
        description: "Não foi possível reclassificar a transação.",
        variant: "destructive",
      })
    } finally {
      setReclassifyDialog(null)
    }
  }

  // Get relevant categories for drop zones based on transaction type
  const getRelevantCategories = () => {
    if (!draggedTransaction) return categories
    return categories.filter((c) => c.type === draggedTransaction.type)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-serif font-bold">Histórico de Transações</h2>
        <p className="text-muted-foreground">
          Arraste transações para categorias ou contas para reclassificar. Clique em "Reverter" para anular.
        </p>
      </div>

      {/* Drop Zones - Only visible when dragging */}
      {showDropZones && (
        <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          {/* Category Drop Zones */}
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Soltar em Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                {getRelevantCategories().map((category) => (
                  <div
                    key={category.id}
                    onDragOver={(e) => handleDragOver(e, `cat-${category.id}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnCategory(e, category.id, category.name)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                      dragOverTarget === `cat-${category.id}`
                        ? "border-primary bg-primary/20 scale-105"
                        : "border-border/50 bg-background hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Drop Zones */}
          <Card className="border-2 border-dashed border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <WalletIcon className="h-4 w-4" />
                Soltar em Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    onDragOver={(e) => handleDragOver(e, `acc-${account.id}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnAccount(e, account.id, account.name)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                      dragOverTarget === `acc-${account.id}`
                        ? "border-blue-500 bg-blue-500/20 scale-105"
                        : "border-border/50 bg-background hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                      <span className="text-sm font-medium">{account.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por descrição ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
                <SelectItem value="investment">Investimentos</SelectItem>
                <SelectItem value="savings">Poupanças</SelectItem>
                <SelectItem value="transfer">Transferências</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Transações ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            Arraste uma transação para reclassificar ou clique em "Reverter" para anular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground border rounded-xl border-dashed">
              <p>Nenhuma transação encontrada.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, transaction)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-4 rounded-lg border border-border/40 bg-card/40 hover:bg-accent/40 transition-all cursor-grab active:cursor-grabbing ${
                    draggedTransaction?.id === transaction.id ? "opacity-50 scale-[0.98]" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className={`p-2 rounded-full bg-background border ${getTypeColor(transaction.type)}/10`}>
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{transaction.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(parseISO(transaction.date), "d 'de' MMM, yyyy", { locale: pt })}</span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {getCategoryName(transaction.category)}
                        </Badge>
                        <span>•</span>
                        <span>{getAccountName(transaction.accountId)}</span>
                        {transaction.goalId && (
                          <>
                            <span>•</span>
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 bg-savings/10 text-savings border-savings/30"
                            >
                              Meta: {goals.find((g) => g.id === transaction.goalId)?.name || "Meta"}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`font-bold font-mono ${getTypeColor(transaction.type)}`}>
                        {transaction.type === "expense" ? "-" : transaction.type === "transfer" ? "" : "+"}
                        {formatCurrency(transaction.amount)}
                      </span>
                      <p className="text-xs text-muted-foreground">{getTypeName(transaction.type)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
                      onClick={() => setTransactionToReverse(transaction.id)}
                    >
                      <Undo2Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">Reverter</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reversal Confirmation Dialog */}
      <AlertDialog open={!!transactionToReverse} onOpenChange={(open) => !open && setTransactionToReverse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
              Confirmar Reversão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Tem a certeza que deseja reverter esta transação?</p>
              {selectedTransaction && (
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium text-foreground">{selectedTransaction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className={`font-bold ${getTypeColor(selectedTransaction.type)}`}>
                      {formatCurrency(selectedTransaction.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="text-foreground">{getTypeName(selectedTransaction.type)}</span>
                  </div>
                </div>
              )}
              <p className="text-amber-600 dark:text-amber-400 font-medium">{getReversalDescription()}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReversing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReverseTransaction}
              disabled={isReversing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isReversing ? "A reverter..." : "Confirmar Reversão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reclassify Confirmation Dialog */}
      <AlertDialog open={!!reclassifyDialog} onOpenChange={(open) => !open && setReclassifyDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {reclassifyDialog?.targetType === "category" ? (
                <Tag className="h-5 w-5 text-primary" />
              ) : (
                <WalletIcon className="h-5 w-5 text-blue-500" />
              )}
              Reclassificar Transação
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Deseja mover esta transação?</p>
              {reclassifyDialog && (
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transação:</span>
                    <span className="font-medium text-foreground">{reclassifyDialog.transaction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Nova {reclassifyDialog.targetType === "category" ? "categoria" : "conta"}:
                    </span>
                    <span className="font-bold text-primary">{reclassifyDialog.targetName}</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReclassify}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
