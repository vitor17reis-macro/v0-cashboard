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
  Sun,
  Moon,
  Bot,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BudgetManager } from "@/components/settings/budget-manager"
import { CategoryManager } from "@/components/settings/category-manager"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { useFinance } from "@/components/providers/finance-provider"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { BudgetAlerts } from "@/components/notifications/budget-alerts"
import { BudgetToastNotifications } from "@/components/notifications/toast-notifications"
import { CurrencySelector } from "@/components/settings/currency-selector"
import { MultiAgentChatbot } from "@/components/chatbot/multi-agent-chatbot"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

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
  const { theme, setTheme } = useTheme()

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
      link.setAttribute("download", `cashboard_export_${new Date().toISOString().split("T")[0]}.csv`)
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
        <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground">
                  <SheetHeader className="p-6 border-b border-sidebar-border">
                    <SheetTitle className="flex items-center gap-3 text-sidebar-foreground">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary via-primary to-teal-400 flex items-center justify-center shadow-lg glow-primary">
                        <span className="text-white font-serif font-bold text-lg">C</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-serif font-bold text-lg">CashBoard</span>
                        <span className="text-[10px] text-sidebar-foreground/60 tracking-[0.2em] uppercase">
                          VitoReis
                        </span>
                      </div>
                    </SheetTitle>
                    <SheetDescription className="sr-only">Navegação principal</SheetDescription>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 p-4">
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
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
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
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg">
                  <span className="text-white font-serif font-bold text-sm">C</span>
                </div>
                <span className="font-serif font-bold">CashBoard</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <BudgetAlerts />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-teal-400 text-white text-xs font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex">
          <aside
            className={cn(
              "hidden lg:flex flex-col fixed left-0 top-0 z-50 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
              isSidebarCollapsed ? "w-[72px]" : "w-[260px]",
            )}
          >
            {/* Logo */}
            <div
              className={cn(
                "h-20 flex items-center border-b border-sidebar-border px-4",
                isSidebarCollapsed ? "justify-center" : "justify-between",
              )}
            >
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-teal-400 flex items-center justify-center shadow-lg glow-primary transition-transform duration-300 group-hover:scale-105">
                  <span className="text-white font-serif font-bold text-xl">C</span>
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-xl leading-none text-sidebar-foreground">CashBoard</span>
                    <span className="text-[10px] text-sidebar-foreground/50 tracking-[0.2em] uppercase mt-0.5">
                      VitoReis
                    </span>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => setIsSidebarCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {NAV_ITEMS.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return isSidebarCollapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => router.push(item.href)}
                        className={cn(
                          "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-300",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
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
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            <div className="border-t border-sidebar-border p-4 space-y-3">
              {/* Add Transaction Button */}
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  {isSidebarCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-lg glow-primary">
                          <PlusIcon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Nova Transação</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button className="w-full h-11 gap-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-lg glow-primary font-semibold">
                      <PlusIcon className="h-5 w-5" />
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

              <div className={cn("grid gap-1", isSidebarCollapsed ? "grid-cols-1" : "grid-cols-4")}>
                {isSidebarCollapsed ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          onClick={handleExport}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Exportar</TooltipContent>
                    </Tooltip>

                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            >
                              <TagIcon className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">Categorias</TooltipContent>
                      </Tooltip>
                      <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
                        <SheetHeader className="mb-6">
                          <SheetTitle className="font-serif text-2xl">Categorias</SheetTitle>
                          <SheetDescription>Gerencie as suas categorias de receita e despesa.</SheetDescription>
                        </SheetHeader>
                        <CategoryManager />
                      </SheetContent>
                    </Sheet>

                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            >
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">Orçamentos</TooltipContent>
                      </Tooltip>
                      <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
                        <SheetHeader className="mb-6">
                          <SheetTitle className="font-serif text-2xl">Orçamentos</SheetTitle>
                          <SheetDescription>Defina limites mensais para controlar os seus gastos.</SheetDescription>
                        </SheetHeader>
                        <BudgetManager />
                      </SheetContent>
                    </Sheet>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Tema</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
                          onClick={handleExport}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar CSV</TooltipContent>
                    </Tooltip>

                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
                            >
                              <TagIcon className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Categorias</TooltipContent>
                      </Tooltip>
                      <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
                        <SheetHeader className="mb-6">
                          <SheetTitle className="font-serif text-2xl">Categorias</SheetTitle>
                          <SheetDescription>Gerencie as suas categorias de receita e despesa.</SheetDescription>
                        </SheetHeader>
                        <CategoryManager />
                      </SheetContent>
                    </Sheet>

                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
                            >
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Orçamentos</TooltipContent>
                      </Tooltip>
                      <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
                        <SheetHeader className="mb-6">
                          <SheetTitle className="font-serif text-2xl">Orçamentos</SheetTitle>
                          <SheetDescription>Defina limites mensais para controlar os seus gastos.</SheetDescription>
                        </SheetHeader>
                        <BudgetManager />
                      </SheetContent>
                    </Sheet>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
                          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Alternar tema</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>

              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between pt-2">
                  <CurrencySelector />
                  <BudgetAlerts />
                </div>
              )}

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-sidebar-accent",
                      isSidebarCollapsed ? "justify-center" : "",
                    )}
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-sidebar-border">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-teal-400 text-white text-sm font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    {!isSidebarCollapsed && (
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">
                          {user.email?.split("@")[0]}
                        </span>
                        <span className="text-xs text-sidebar-foreground/50 truncate max-w-[140px]">{user.email}</span>
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side={isSidebarCollapsed ? "right" : "top"} className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.email?.split("@")[0]}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
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
              isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]",
            )}
          >
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-in">{children}</div>
          </main>
        </div>

        {/* Mobile FAB */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              className="lg:hidden fixed right-4 bottom-4 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 z-50 glow-primary"
              size="icon"
            >
              <PlusIcon className="h-6 w-6" />
            </Button>
          </DialogTrigger>
        </Dialog>

        {/* Chatbot */}
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed right-4 bottom-20 lg:bottom-4 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 z-40 group transition-all duration-300 hover:scale-105"
              size="icon"
            >
              <Bot className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-background animate-pulse" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0">
            <MultiAgentChatbot onClose={() => setIsChatOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}
