"use client"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PlusIcon,
  Wallet,
  CreditCard,
  Banknote,
  TrendingUp,
  PiggyBank,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeftRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { AccountForm } from "./account-form"
import { AccountTransferForm } from "./account-transfer-form"

export function AccountCards() {
  const { accounts, deleteAccount } = useFinance()
  const { formatCurrency } = useCurrency()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<(typeof accounts)[0] | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)

  const getIcon = (type: string) => {
    switch (type) {
      case "checking":
        return <CreditCard className="h-4 w-4" />
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "investment":
        return <TrendingUp className="h-4 w-4" />
      case "savings":
        return <PiggyBank className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case "checking":
        return "Conta à Ordem"
      case "cash":
        return "Dinheiro"
      case "investment":
        return "Investimentos"
      case "savings":
        return "Conta Poupança"
      default:
        return type
    }
  }

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0)

  const handleDelete = () => {
    if (deletingAccountId) {
      deleteAccount(deletingAccountId)
      setDeletingAccountId(null)
    }
  }

  // Group accounts by type for better organization
  const savingsAccounts = accounts.filter((a) => a.type === "savings")
  const investmentAccounts = accounts.filter((a) => a.type === "investment")
  const otherAccounts = accounts.filter((a) => a.type !== "savings" && a.type !== "investment")

  const totalSavings = savingsAccounts.reduce((acc, a) => acc + a.balance, 0)
  const totalInvestments = investmentAccounts.reduce((acc, a) => acc + a.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif font-bold">As Minhas Contas</h3>
          <p className="text-sm text-muted-foreground">
            Património Total: <span className="font-semibold text-foreground">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 hover:bg-primary/10 bg-transparent">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden sm:inline">Transferir</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Transferência entre Contas</DialogTitle>
                <DialogDescription>Mova dinheiro entre as suas contas bancárias.</DialogDescription>
              </DialogHeader>
              <AccountTransferForm onSuccess={() => setIsTransferOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Conta</DialogTitle>
                <DialogDescription>Adicione uma nova conta bancária ou carteira.</DialogDescription>
              </DialogHeader>
              <AccountForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Poupança</p>
            <PiggyBank className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(totalSavings)}</p>
          <p className="text-xs text-muted-foreground">{savingsAccounts.length} conta(s)</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Investido</p>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {formatCurrency(totalInvestments)}
          </p>
          <p className="text-xs text-muted-foreground">{investmentAccounts.length} conta(s)</p>
        </div>
      </div>

      {/* All Accounts Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <Card className="col-span-full bg-card/50 backdrop-blur-sm border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Ainda não tem contas configuradas</p>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Criar Primeira Conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card
              key={account.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 group relative transition-all duration-300 hover:shadow-lg hover:border-border"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${account.color}20`, color: account.color }}
                  >
                    {getIcon(account.type)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingAccount(account)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingAccountId(account.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${account.balance >= 0 ? "text-foreground" : "text-expense"}`}>
                  {formatCurrency(account.balance)}
                </div>
                <p className="text-xs text-muted-foreground">{getTypeName(account.type)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogDescription>Altere os detalhes da sua conta.</DialogDescription>
          </DialogHeader>
          {editingAccount && <AccountForm editAccount={editingAccount} onSuccess={() => setEditingAccount(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingAccountId} onOpenChange={(open) => !open && setDeletingAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. A conta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
