import {
  LayoutDashboardIcon,
  CalendarClockIcon,
  HistoryIcon,
  Zap,
  GitCompareArrows,
} from "lucide-react"

export const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboardIcon, label: "Visão Geral" },
  { href: "/historico", icon: HistoryIcon, label: "Histórico" },
  { href: "/comparacao", icon: GitCompareArrows, label: "Comparação" },
  { href: "/assinaturas", icon: CalendarClockIcon, label: "Recorrentes" },
  { href: "/regras", icon: Zap, label: "Automações" },
]
