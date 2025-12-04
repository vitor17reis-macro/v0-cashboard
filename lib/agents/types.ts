// Multi-Agent System Types
export interface AgentContext {
  userId: string
  accounts: any[]
  transactions: any[]
  goals: any[]
  categories: any[]
  rules: any[]
  currency: string
}

export interface AgentResponse {
  content: string
  suggestions?: string[]
  data?: any
  agentUsed: AgentType
  confidence: number
}

export type AgentType = "orchestrator" | "sql" | "finance" | "education" | "planner" | "support" | "rag"

export interface AgentMessage {
  role: "user" | "assistant" | "system"
  content: string
  agentType?: AgentType
  timestamp: string
}

export interface SQLQueryResult {
  query: string
  result: any[]
  explanation: string
}

export interface FinancialPlan {
  id: string
  name: string
  description: string
  steps: PlanStep[]
  targetDate: string
  targetAmount: number
  currentProgress: number
}

export interface PlanStep {
  id: string
  description: string
  amount: number
  frequency: "daily" | "weekly" | "monthly"
  completed: boolean
  dueDate: string
}

export interface EducationTopic {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  content: string
  relatedTopics: string[]
}

export interface MarketInsight {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  recommendation: "buy" | "hold" | "sell"
  analysis: string
}
