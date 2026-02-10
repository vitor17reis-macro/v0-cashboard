"use client"

import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
import { NAV_ITEMS } from "./nav-items"
import { NavLink } from "./nav-link"

interface MobileNavProps {
  onNavigate?: () => void
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const router = useRouter()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
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
              <span className="text-[10px] text-sidebar-foreground/60 tracking-[0.2em] uppercase">VitoReis</span>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Navegação principal</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              onNavigate={() => setIsOpen(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

import * as React from "react"
