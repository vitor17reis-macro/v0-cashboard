"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "./nav-items"
import { NavLink } from "./nav-link"
import { SidebarBottomActions } from "./sidebar-bottom-actions"

interface DesktopSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  isAddOpen: boolean
  onAddOpenChange: (open: boolean) => void
}

export function DesktopSidebar({
  collapsed,
  onCollapsedChange,
  isAddOpen,
  onAddOpenChange,
}: DesktopSidebarProps) {
  const router = useRouter()

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 z-50 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-20 flex items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") router.push("/")
          }}
        >
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-teal-400 flex items-center justify-center shadow-lg glow-primary transition-transform duration-300 group-hover:scale-105">
            <span className="text-white font-serif font-bold text-xl">C</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl leading-none text-sidebar-foreground">CashBoard</span>
              <span className="text-[10px] text-sidebar-foreground/50 tracking-[0.2em] uppercase mt-0.5">
                VitoReis
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => onCollapsedChange?.(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {NAV_ITEMS.map((item, index) => (
          <div key={item.href} style={{ animationDelay: !collapsed ? `${index * 30}ms` : undefined }}>
            <NavLink {...item} collapsed={collapsed} />
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <SidebarBottomActions
        collapsed={collapsed}
        isAddOpen={isAddOpen}
        onAddOpenChange={onAddOpenChange}
        onExpandCollapse={() => onCollapsedChange?.(false)}
      />
    </aside>
  )
}
