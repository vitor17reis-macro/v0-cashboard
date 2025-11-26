export type TransactionType = "income" | "expense" | "investment" | "savings" | "transfer"

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  category: string
  accountId?: string
  toAccountId?: string // Added toAccountId for transfers
  goalId?: string // Added goalId to track goal deposits for proper reversal
  isRecurring?: boolean
  recurringFrequency?: "monthly" | "weekly" | "yearly"
  nextDueDate?: string
}

export interface Account {
  id: string
  name: string
  type: "checking" | "savings" | "investment" | "cash"
  balance: number
  color: string
  icon?: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  color: string
  icon?: string
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  color?: string
  icon?: string
  budget?: number
  isCustom?: boolean
}

export type Period = "day" | "week" | "month" | "year"

export interface Budget {
  categoryId: string
  limit: number
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Receitas
  { id: "salary", name: "Salário", type: "income", color: "#10B981", icon: "banknote" },
  { id: "freelance", name: "Freelance", type: "income", color: "#059669", icon: "laptop" },
  { id: "passive", name: "Rendimentos Passivos", type: "income", color: "#047857", icon: "trending-up" },
  { id: "bonus", name: "Bónus", type: "income", color: "#34D399", icon: "gift" },
  { id: "other-income", name: "Outros Rendimentos", type: "income", color: "#6EE7B7", icon: "plus-circle" },

  // Despesas
  { id: "housing", name: "Habitação", type: "expense", color: "#EF4444", icon: "home" },
  { id: "food", name: "Alimentação", type: "expense", color: "#F97316", icon: "utensils" },
  { id: "transport", name: "Transportes", type: "expense", color: "#F59E0B", icon: "car" },
  { id: "health", name: "Saúde", type: "expense", color: "#EC4899", icon: "heart" },
  { id: "leisure", name: "Lazer", type: "expense", color: "#8B5CF6", icon: "gamepad" },
  { id: "education", name: "Educação", type: "expense", color: "#3B82F6", icon: "book" },
  { id: "subscriptions", name: "Subscrições", type: "expense", color: "#6366F1", icon: "credit-card" },
  { id: "clothing", name: "Vestuário", type: "expense", color: "#A855F7", icon: "shirt" },
  { id: "utilities", name: "Serviços (Água, Luz, Gás)", type: "expense", color: "#14B8A6", icon: "zap" },
  { id: "communication", name: "Comunicações", type: "expense", color: "#0EA5E9", icon: "phone" },
  { id: "insurance", name: "Seguros", type: "expense", color: "#64748B", icon: "shield" },
  { id: "pets", name: "Animais", type: "expense", color: "#F472B6", icon: "paw-print" },
  { id: "other-expense", name: "Outras Despesas", type: "expense", color: "#94A3B8", icon: "more-horizontal" },

  // Investimentos
  { id: "stocks", name: "Ações", type: "investment", color: "#3B82F6", icon: "trending-up" },
  { id: "crypto", name: "Cripto", type: "investment", color: "#F59E0B", icon: "bitcoin" },
  { id: "funds", name: "Fundos de Investimento", type: "investment", color: "#8B5CF6", icon: "pie-chart" },
  { id: "real-estate", name: "Imobiliário", type: "investment", color: "#10B981", icon: "building" },
  { id: "bonds", name: "Obrigações", type: "investment", color: "#06B6D4", icon: "landmark" },

  // Poupança
  { id: "emergency", name: "Fundo de Emergência", type: "savings", color: "#EF4444", icon: "shield" },
  { id: "vacation", name: "Férias", type: "savings", color: "#F59E0B", icon: "plane" },
  { id: "retirement", name: "Reforma", type: "savings", color: "#8B5CF6", icon: "umbrella" },
  { id: "goals", name: "Objetivos", type: "savings", color: "#10B981", icon: "target" },
]

export const DEFAULT_ACCOUNTS = [
  { name: "Conta à Ordem", type: "checking" as const, balance: 0, color: "#10B981", icon: "credit-card" },
  { name: "Conta Poupança", type: "savings" as const, balance: 0, color: "#3B82F6", icon: "piggy-bank" },
  { name: "Dinheiro", type: "cash" as const, balance: 0, color: "#F59E0B", icon: "banknote" },
]
