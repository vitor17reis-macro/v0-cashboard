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
  MessageCircleIcon,
  Zap,
  GitCompareArrows,
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

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href
    return (
      <button
        onClick={() => {
          router.push(href)
          setIsMobileMenuOpen(false)
        }}
        className={`group flex items-center gap-2.5 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out ${
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
            : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground hover:scale-[1.02]"
        }`}
      >
        <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`} />
        <span className="hidden xl:inline">{label}</span>
      </button>
    )
  }

  const userInitials = user.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <BudgetToastNotifications />

      {/* Top Navigation Bar - Awwwards inspired glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-2xl backdrop-saturate-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Logo with hover animation */}
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => router.push("/")}>
              <div className="h-9 w-9 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all duration-300 group-hover:shadow-emerald-500/50 group-hover:scale-105">
                <span className="text-white font-serif font-bold text-lg">C</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-serif font-bold text-lg tracking-tight leading-none transition-colors">
                  CashBoard
                </span>
                <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase">VitoReis</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>

          {/* Right Actions - flex-shrink-0 prevents collapse */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-background/95 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle className="font-serif">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
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
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>

            {/* Add Transaction Button */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="hidden sm:flex gap-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden md:inline">Nova Transação</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Adicionar Transação</DialogTitle>
                  <DialogDescription>Registe uma nova receita, despesa ou investimento.</DialogDescription>
                </DialogHeader>
                <TransactionForm onSuccess={() => setIsAddOpen(false)} />
              </DialogContent>
            </Dialog>

            {/* Divider - hidden on mobile */}
            <div className="h-5 w-px bg-border/50 mx-1 hidden md:block" />

            {/* Action Buttons Container */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              {/* Currency Selector - hidden on small screens */}
              <div className="hidden md:block">
                <CurrencySelector />
              </div>

              {/* Budget Alerts */}
              <BudgetAlerts />

              {/* Categories - hidden on mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden sm:flex h-9 w-9 transition-all duration-300 hover:bg-secondary hover:scale-105"
                    title="Gerir Categorias"
                  >
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-background/95 backdrop-blur-xl">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-xl">Categorias</SheetTitle>
                    <SheetDescription>Adicione ou remova categorias.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <CategoryManager />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Budget Manager */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden sm:flex h-9 w-9 transition-all duration-300 hover:bg-secondary hover:scale-105"
                    title="Orçamentos"
                  >
                    <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[450px] bg-background/95 backdrop-blur-xl">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-xl">Orçamentos</SheetTitle>
                    <SheetDescription>Defina limites mensais por categoria.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <BudgetManager />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Export */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="h-9 w-9 transition-all duration-300 hover:bg-secondary hover:scale-105"
                title="Exportar CSV"
              >
                <DownloadIcon className="h-4 w-4 text-muted-foreground" />
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full transition-all duration-300 hover:scale-105"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-600 text-white text-xs font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">A minha conta</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer transition-colors"
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with fade-in animation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>

      {/* Mobile FAB */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-2xl shadow-emerald-500/30 bg-gradient-to-br from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-700 transition-all duration-300 hover:scale-110"
            >
              <PlusIcon className="h-6 w-6 text-white" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Adicionar Transação</DialogTitle>
              <DialogDescription>Registe uma nova receita, despesa ou investimento.</DialogDescription>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Floating chatbot button - Desktop only */}
      <div className="fixed bottom-6 right-6 z-50 hidden md:block">
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-2xl shadow-blue-500/30 bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 transition-all duration-300 hover:scale-110"
            >
              <MessageCircleIcon className="h-6 w-6 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 bg-background/95 backdrop-blur-xl">
            <Chatbot onClose={() => setIsChatOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
