"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavLinkProps {
  href: string
  icon: LucideIcon
  label: string
  collapsed?: boolean
  onNavigate?: () => void
}

export function NavLink({ href, icon: Icon, label, collapsed, onNavigate }: NavLinkProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === href

  const handleClick = () => {
    router.push(href)
    onNavigate?.()
  }

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
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
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{label}</span>
    </button>
  )
}
