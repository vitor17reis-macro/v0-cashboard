import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard-shell"
import { FinanceProvider } from "@/components/providers/finance-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <FinanceProvider userId={user.id}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </FinanceProvider>
  )
}
