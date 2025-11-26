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
        return <CreditCard className="h-5 w-5" />
      case "cash":
        return <Banknote className="h-5 w-5" />
      case "investment":
        return <TrendingUp className="h-5 w-5" />
      case "savings":
        return <PiggyBank className="h-5 w-5" />
      default:
        return <Wallet className="h-5 w-5" />
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
        return "Poupança"
      default:
        return type
    }
  }

  const getCardStyle = (type: string) => {
    switch (type) {
      case "checking":
        return {
          gradient: "from-teal-500 to-teal-600",
          icon: "bg-white/20 text-white",
          text: "text-white",
          muted: "text-white/70",
        }
      case "savings":
        return {
          gradient: "from-blue-500 to-blue-600",
          icon: "bg-white/20 text-white",
          text: "text-white",
          muted: "text-white/70",
        }
      case "investment":
        return {
          gradient: "from-violet-500 to-violet-600",
          icon: "bg-white/20 text-white",
          text: "text-white",
          muted: "text-white/70",
        }
      case "cash":
        return {
          gradient: "from-amber-500 to-amber-600",
          icon: "bg-white/20 text-white",
          text: "text-white",
          muted: "text-white/70",
        }
      default:
        return {
          gradient: "from-gray-500 to-gray-600",
          icon: "bg-white/20 text-white",
          text: "text-white",
          muted: "text-white/70",
        }
    }
  }

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0)

  const handleDelete = () => {
    if (deletingAccountId) {
      deleteAccount(deletingAccountId)
      setDeletingAccountId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif font-bold tracking-tight">As Minhas Contas</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Património Total: <span className="font-bold text-foreground text-lg">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 bg-transparent"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden sm:inline">Transferir</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Transferência entre Contas</DialogTitle>
                <DialogDescription>
                  Mova dinheiro entre as suas contas (à ordem, poupança, investimentos, dinheiro).
                </DialogDescription>
              </DialogHeader>
              <AccountTransferForm onSuccess={() => setIsTransferOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 w-9 p-0 rounded-full bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Nova Conta</DialogTitle>
                <DialogDescription>Adicione uma nova conta bancária ou carteira.</DialogDescription>
              </DialogHeader>
              <AccountForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.length === 0 ? (
          <Card className="col-span-full border-2 border-dashed border-border/50 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">Ainda não tem contas configuradas</p>
              <Button onClick={() => setIsAddOpen(true)} className="rounded-full">
                <PlusIcon className="h-4 w-4 mr-2" />
                Criar Primeira Conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account, index) => {
            const style = getCardStyle(account.type)
            return (
              <Card
                key={account.id}
                className={`group relative overflow-hidden border-0 bg-gradient-to-br ${style.gradient} transition-all duration-500 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 hover:scale-[1.02] animate-in min-h-[160px]`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-12 -translate-x-12" />

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 relative z-10">
                  <div className={`p-3 rounded-xl ${style.icon} backdrop-blur-sm`}>{getIcon(account.type)}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setEditingAccount(account)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingAccountId(account.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="pt-0 relative z-10">
                  <p className={`text-xs uppercase tracking-wider mb-1 ${style.muted}`}>{getTypeName(account.type)}</p>
                  <CardTitle className={`text-sm font-medium mb-2 ${style.muted}`}>{account.name}</CardTitle>
                  <div className={`text-2xl font-bold tracking-tight ${style.text}`}>
                    {formatCurrency(account.balance)}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Editar Conta</DialogTitle>
            <DialogDescription>Altere os detalhes da sua conta.</DialogDescription>
          </DialogHeader>
          {editingAccount && <AccountForm editAccount={editingAccount} onSuccess={() => setEditingAccount(null)} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
