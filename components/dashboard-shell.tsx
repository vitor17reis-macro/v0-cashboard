"use client"

import type React from "react"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboardIcon,
  PieChartIcon,
  TrendingUpIcon,
  CalendarClockIcon,
  PlusIcon,
  DownloadIcon,
  SettingsIcon,
  TagIcon,
  LogOutIcon,
  MenuIcon,
  HistoryIcon,
  Zap,
  GitCompareArrows,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/settings/theme-toggle"
import { BudgetManager } from "@/components/settings/budget-manager"
import { CategoryManager } from "@/components/settings/category-manager"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { useFinance } from "@/components/providers/finance-provider"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { BudgetAlerts } from "@/components/notifications/budget-alerts"
import { BudgetToastNotifications } from "@/components/notifications/toast-notifications"
import { CurrencySelector } from "@/components/settings/currency-selector"
import { Chatbot } from "@/components/chatbot/chatbot"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboardIcon, label: "Visão Geral" },
  { href: "/historico", icon: HistoryIcon, label: "Histórico" },
  { href: "/comparacao", icon: GitCompareArrows, label: "Comparação" },
  { href: "/relatorios", icon: PieChartIcon, label: "Relatórios" },
  { href: "/previsao", icon: TrendingUpIcon, label: "Previsão" },
  { href: "/assinaturas", icon: CalendarClockIcon, label: "Assinaturas" },
  { href: "/regras", icon: Zap, label: "Automações" },
]

interface DashboardShellProps {
  user: User
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { transactions } = useFinance()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const handleExport = () => {
    try {
      if (transactions.length === 0) {
        alert("Não há transações para exportar.")
        return
      }

      const headers = ["Data", "Descrição", "Valor", "Tipo", "Categoria"]
      const csvContent = [
        headers.join(","),
        ...transactions.map((t) =>
          [
            new Date(t.date).toLocaleDateString("pt-PT"),
            `"${t.description.replace(/"/g, '""')}"`,
            t.amount.toString().replace(".", ","),
            t.type,
            t.category,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `financas_export_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Erro ao exportar ficheiro.")
    }
  }

  const userInitials = user.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background transition-colors duration-500">
        <BudgetToastNotifications />

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 bg-background/95 backdrop-blur-xl">
                  <SheetHeader className="p-4 border-b border-border/30">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-serif font-bold text-sm">C</span>
                      </div>
                      <span className="font-serif">CashBoard</span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">Navegação principal</SheetDescription>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 p-3">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <button
                          key={item.href}
                          onClick={() => {
                            router.push(item.href)
                            setIsMobileMenuOpen(false)
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      )
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-white font-serif font-bold text-sm">C</span>
                </div>
                <span className="font-serif font-bold text-base">CashBoard</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <CurrencySelector />
              <BudgetAlerts />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-600 text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              "hidden lg:flex flex-col fixed left-0 top-0 z-50 h-screen border-r border-border/30 bg-background/80 backdrop-blur-xl transition-all duration-300",
              isSidebarCollapsed ? "w-[72px]" : "w-[240px]",
            )}
          >
            {/* Logo */}
            <div
              className={cn(
                "h-16 flex items-center border-b border-border/30 px-4",
                isSidebarCollapsed ? "justify-center" : "justify-between",
              )}
            >
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push("/")}>
                <div className="h-9 w-9 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-105">
                  <span className="text-white font-serif font-bold">C</span>
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-lg leading-none">CashBoard</span>
                    <span className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">VitoReis</span>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setIsSidebarCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return isSidebarCollapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => router.push(item.href)}
                        className={cn(
                          "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="border-t border-border/30 p-3 space-y-2">
              {/* Add Transaction Button */}
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  {isSidebarCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
                          <PlusIcon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Nova Transação</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
                      <PlusIcon className="h-4 w-4" />
                      Nova Transação
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Adicionar Transação</DialogTitle>
                    <DialogDescription>Registe uma nova receita, despesa ou investimento.</DialogDescription>
                  </DialogHeader>
                  <TransactionForm onSuccess={() => setIsAddOpen(false)} />
                </DialogContent>
              </Dialog>

              {/* Settings Row */}
              <div className={cn("flex items-center gap-1", isSidebarCollapsed ? "flex-col" : "justify-between")}>
                {isSidebarCollapsed ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExport}>
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Exportar CSV</TooltipContent>
                    </Tooltip>

                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <TagIcon className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">Categorias</TooltipContent>
                      </Tooltip>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Categorias</SheetTitle>
                          <SheetDescription>Adicione ou remova categorias.</SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <CategoryManager />
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">Orçamentos</TooltipContent>
                      </Tooltip>
                      <SheetContent className="w-[400px] sm:w-[450px]">
                        <SheetHeader>
                          <SheetTitle>Orçamentos</SheetTitle>
                          <SheetDescription>Defina limites mensais por categoria.</SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <BudgetManager />
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setIsSidebarCollapsed(false)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Expandir</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={handleExport}
                        title="Exportar CSV"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9" title="Categorias">
                            <TagIcon className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Categorias</SheetTitle>
                            <SheetDescription>Adicione ou remova categorias.</SheetDescription>
                          </SheetHeader>
                          <div className="mt-6">
                            <CategoryManager />
                          </div>
                        </SheetContent>
                      </Sheet>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9" title="Orçamentos">
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[450px]">
                          <SheetHeader>
                            <SheetTitle>Orçamentos</SheetTitle>
                            <SheetDescription>Defina limites mensais por categoria.</SheetDescription>
                          </SheetHeader>
                          <div className="mt-6">
                            <BudgetManager />
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>

                    <div className="flex items-center gap-1">
                      <CurrencySelector />
                      <BudgetAlerts />
                      <ThemeToggle />
                    </div>
                  </>
                )}
              </div>

              {/* User */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-secondary",
                      isSidebarCollapsed && "justify-center",
                    )}
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-600 text-white text-xs font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    {!isSidebarCollapsed && (
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">{user.email?.split("@")[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isSidebarCollapsed ? "center" : "end"} side="top" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">A minha conta</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>

          {/* Main Content */}
          <main
            className={cn(
              "flex-1 min-h-screen transition-all duration-300",
              "lg:ml-[240px]",
              isSidebarCollapsed && "lg:ml-[72px]",
            )}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile FAB */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-2xl shadow-emerald-500/30 bg-gradient-to-br from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-700 transition-all duration-300 hover:scale-110"
              >
                <PlusIcon className="h-6 w-6 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Adicionar Transação</DialogTitle>
                <DialogDescription>Registe uma nova receita, despesa ou investimento.</DialogDescription>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Floating chatbot button - Desktop only */}
        <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-2xl shadow-blue-500/30 bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 transition-all duration-300 hover:scale-110"
              >
                <svg
                  className="h-6 w-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0">
              <Chatbot onClose={() => setIsChatOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </TooltipProvider>
  )
}
