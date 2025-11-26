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
  { href: "/relatorios", icon: PieChartIcon, label: "Relatórios" },
  { href: "/previsao", icon: TrendingUpIcon, label: "Previsão" },
  { href: "/assinaturas", icon: CalendarClockIcon, label: "Assinaturas" },
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
        className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    )
  }

  const userInitials = user.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <BudgetToastNotifications />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-serif font-bold text-xl">C</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-serif font-bold text-xl tracking-tight leading-none">CashBoard</span>
                <span className="text-[10px] text-muted-foreground tracking-widest">VITOREIS</span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-2">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-6 pl-2">
                  {NAV_ITEMS.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="hidden sm:flex gap-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-900/20"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Transação</DialogTitle>
                  <DialogDescription>Registe uma nova receita, despesa ou investimento.</DialogDescription>
                </DialogHeader>
                <TransactionForm onSuccess={() => setIsAddOpen(false)} />
              </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-border/50 mx-3 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <CurrencySelector />
              </div>

              <BudgetAlerts />

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" title="Gerir Categorias">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
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
                  <Button variant="ghost" size="icon" title="Orçamentos">
                    <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Orçamentos</SheetTitle>
                    <SheetDescription>Defina limites mensais.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <BudgetManager />
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="ghost" size="icon" onClick={handleExport} title="Exportar CSV">
                <DownloadIcon className="h-4 w-4 text-muted-foreground" />
              </Button>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-emerald-500 text-white text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">A minha conta</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile FAB */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-emerald-600 hover:bg-emerald-700">
                <PlusIcon className="h-6 w-6 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Transação</DialogTitle>
                <DialogDescription>Registe uma nova receita, despesa ou investimento.</DialogDescription>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 min-h-[calc(100vh-72px)]">{children}</main>

      {/* Floating chatbot button */}
      <div className="fixed bottom-6 right-6 z-50 hidden md:block">
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              <MessageCircleIcon className="h-6 w-6 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0">
            <Chatbot onClose={() => setIsChatOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
