"use client"

import type React from "react"
import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { useCurrency } from "@/contexts/currency-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PlusIcon, Target, MoreVertical, Pencil, Trash2, Calendar, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { GoalForm } from "./goal-form"
import { GoalTransferForm } from "./goal-transfer-form"
import { differenceInDays, parseISO } from "date-fns"

export function GoalsList() {
  const { goals, deleteGoal } = useFinance()
  const { formatCurrency } = useCurrency()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<(typeof goals)[0] | null>(null)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)
  const [transferGoalId, setTransferGoalId] = useState<string | null>(null)

  const handleDelete = () => {
    if (deletingGoalId) {
      deleteGoal(deletingGoalId)
      setDeletingGoalId(null)
    }
  }

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null
    const days = differenceInDays(parseISO(deadline), new Date())
    return days
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif font-bold">Metas Financeiras</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
              <DialogDescription>Defina uma meta financeira para acompanhar o seu progresso.</DialogDescription>
            </DialogHeader>
            <GoalForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {goals.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Ainda não tem metas definidas</p>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Criar Primeira Meta
              </Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const daysRemaining = getDaysRemaining(goal.deadline)
            const isCompleted = percentage >= 100

            return (
              <Card key={goal.id} className="bg-card/50 backdrop-blur-sm border-border/50 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {isCompleted && <span className="text-emerald-500">✓</span>}
                    {goal.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      onClick={() => setTransferGoalId(goal.id)}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      <span className="text-xs">Depositar</span>
                    </Button>
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
                        <DropdownMenuItem onClick={() => setTransferGoalId(goal.id)}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Depositar Dinheiro
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingGoal(goal)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingGoalId(goal.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-sm text-muted-foreground mb-1">de {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="space-y-1">
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={
                        {
                          "--progress-background": goal.color,
                        } as React.CSSProperties
                      }
                    />
                    <div className="flex justify-between items-center">
                      {goal.deadline && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {daysRemaining !== null && daysRemaining > 0
                            ? `${daysRemaining} dias restantes`
                            : daysRemaining === 0
                              ? "Termina hoje"
                              : "Prazo expirado"}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium ml-auto ${isCompleted ? "text-emerald-500" : "text-muted-foreground"}`}
                      >
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
            <DialogDescription>Altere os detalhes da sua meta financeira.</DialogDescription>
          </DialogHeader>
          {editingGoal && <GoalForm editGoal={editingGoal} onSuccess={() => setEditingGoal(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!transferGoalId} onOpenChange={(open) => !open && setTransferGoalId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Depositar na Meta</DialogTitle>
            <DialogDescription>Transfira dinheiro de uma das suas contas para esta meta financeira.</DialogDescription>
          </DialogHeader>
          {transferGoalId && <GoalTransferForm goalId={transferGoalId} onSuccess={() => setTransferGoalId(null)} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGoalId} onOpenChange={(open) => !open && setDeletingGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. A meta será eliminada permanentemente.
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
