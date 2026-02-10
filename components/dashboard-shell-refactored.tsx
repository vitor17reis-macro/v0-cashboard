"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BudgetAlerts } from "@/components/notifications/budget-alerts"
import { BudgetToastNotifications } from "@/components/notifications/toast-notifications"
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { UserMenu } from "@/components/navigation/user-menu"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  user: User
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background transition-colors duration-500">
        <BudgetToastNotifications />

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MobileNav />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg">
                  <span className="text-white font-serif font-bold text-sm">C</span>
                </div>
                <span className="font-serif font-bold">CashBoard</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <BudgetAlerts />
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <DesktopSidebar
          collapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
          isAddOpen={isAddOpen}
          onAddOpenChange={setIsAddOpen}
        />

        {/* Main Content */}
        <main
          className={cn(
            "lg:ml-[260px] transition-all duration-300 min-h-screen",
            isSidebarCollapsed && "lg:ml-[72px]",
          )}
        >
          {children}
        </main>
      </div>
    </TooltipProvider>
  )
}
