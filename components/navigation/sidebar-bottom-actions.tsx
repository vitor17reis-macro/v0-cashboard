"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { TagIcon, SettingsIcon, Sun, Moon, ChevronRight } from "lucide-react"
import { useTheme } from "next-themes"
import { BudgetManager } from "@/components/settings/budget-manager"
import { CategoryManager } from "@/components/settings/category-manager"
import { TransactionForm } from "@/features/transactions/components/transaction-form"
import { cn } from "@/lib/utils"

interface SidebarBottomActionsProps {
  collapsed?: boolean
  isAddOpen: boolean
  onAddOpenChange: (open: boolean) => void
  onExpandCollapse?: () => void
}

export function SidebarBottomActions({
  collapsed,
  isAddOpen,
  onAddOpenChange,
  onExpandCollapse,
}: SidebarBottomActionsProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="border-t border-sidebar-border p-4 space-y-3">
      {/* Add Transaction Button */}
      <Dialog open={isAddOpen} onOpenChange={onAddOpenChange}>
        <DialogTrigger asChild>
          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-lg glow-primary">
                    +
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Nova Transação</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button className="w-full h-11 gap-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-lg glow-primary font-semibold">
              + Nova Transação
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Adicionar Transação</DialogTitle>
            <DialogDescription>Registe uma nova receita, despesa ou investimento.</DialogDescription>
          </DialogHeader>
          <TransactionForm onSuccess={() => onAddOpenChange(false)} />
        </DialogContent>
      </Dialog>

      <div className={cn("grid gap-2", collapsed ? "grid-cols-1" : "grid-cols-3")}>
        {/* Categories */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Sheet>
                <Sheet.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      !collapsed && "rounded-xl w-full",
                    )}
                  >
                    <TagIcon className="h-4 w-4" />
                  </Button>
                </Sheet.Trigger>
                <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="font-serif text-2xl">Categorias</SheetTitle>
                    <SheetDescription>Gerencie as suas categorias de receita e despesa.</SheetDescription>
                  </SheetHeader>
                  <CategoryManager />
                </SheetContent>
              </Sheet>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"}>Categorias</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Budget */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Sheet>
                <Sheet.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      !collapsed && "rounded-xl w-full",
                    )}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </Sheet.Trigger>
                <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="font-serif text-2xl">Orçamentos</SheetTitle>
                    <SheetDescription>Defina limites mensais para controlar os seus gastos.</SheetDescription>
                  </SheetHeader>
                  <BudgetManager />
                </SheetContent>
              </Sheet>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"}>Orçamentos</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  !collapsed && "rounded-xl w-full",
                )}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"}>Tema</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Expand/Collapse */}
        {collapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={onExpandCollapse}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
