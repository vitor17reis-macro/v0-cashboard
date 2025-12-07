"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  SendIcon,
  XIcon,
  Sparkles,
  UserIcon,
  Loader2,
  Wallet,
  Target,
  TrendingUp,
  Lightbulb,
  GraduationCap,
  HelpCircle,
  ChevronDown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@supabase/ssr"
import { useFinance } from "@/components/providers/finance-provider"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIChatbotProps {
  onClose?: () => void
}

const topicQuestions = {
  saldo: [
    "Qual é o meu saldo total atual?",
    "Quanto tenho em cada conta?",
    "Quanto gastei este mês?",
    "Qual foi a minha maior despesa recente?",
    "Estou a gastar mais do que ganho?",
  ],
  metas: [
    "Como estão as minhas metas financeiras?",
    "Quanto falta para atingir cada meta?",
    "Qual meta devo priorizar?",
    "Como posso atingir as metas mais rápido?",
    "Devo criar uma nova meta de poupança?",
  ],
  investir: [
    "Por onde devo começar a investir?",
    "O que são ETFs e como funcionam?",
    "Quanto do meu salário devo investir?",
    "Qual a diferença entre ações e fundos?",
    "Simula investir 200€/mês durante 20 anos",
  ],
  poupar: [
    "Onde posso cortar despesas?",
    "Como aplicar a regra 50/30/20?",
    "Quanto devo ter em fundo de emergência?",
    "Quais despesas posso eliminar?",
    "Analisa as minhas despesas por categoria",
  ],
  aprender: [
    "O que são juros compostos?",
    "Como funciona a diversificação?",
    "O que é inflação e como me protejo?",
    "Qual a diferença entre poupar e investir?",
    "O que é um fundo de emergência?",
  ],
  ajuda: [
    "O que podes fazer por mim?",
    "Como adiciono uma transação?",
    "Como crio uma automação?",
    "Como funcionam as metas?",
    "Como exporto os meus dados?",
  ],
}

function matchesAny(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase()
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))
}

export function AIChatbot({ onClose }: AIChatbotProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá! Sou o **CashBot**, o teu assistente financeiro inteligente.

Tenho acesso aos teus dados financeiros e posso:
• **Analisar** as tuas finanças em tempo real
• **Calcular** juros compostos e simulações
• **Sugerir** onde cortar despesas
• **Planear** como atingir metas mais rápido
• **Ensinar** conceitos de investimento

Escolhe um tema acima ou pergunta-me qualquer coisa!`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { transactions, accounts, goals, categories } = useFinance()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id)
    })
  }, [])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const generateResponse = useCallback(
    (question: string): string => {
      const q = question.toLowerCase().trim()

      // Calculate all financial data upfront
      const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0)
      const savingsAccounts = accounts.filter(
        (a) => a.type === "savings" || a.type === "poupanca" || a.type === "poupança",
      )
      const investmentAccounts = accounts.filter((a) => a.type === "investment" || a.type === "investimento")
      const checkingAccounts = accounts.filter(
        (a) => a.type === "checking" || a.type === "corrente" || a.type === "ordem",
      )
      const totalSavings = savingsAccounts.reduce((acc, a) => acc + (a.balance || 0), 0)
      const totalInvestments = investmentAccounts.reduce((acc, a) => acc + (a.balance || 0), 0)
      const totalChecking = checkingAccounts.reduce((acc, a) => acc + (a.balance || 0), 0)

      const now = new Date()
      const thisMonthTrans = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })

      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthTrans = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear()
      })

      const monthlyIncome = thisMonthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
      const monthlyExpenses = thisMonthTrans.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
      const lastMonthExpenses = lastMonthTrans.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
      const lastMonthIncome = lastMonthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)

      // Group expenses by category
      const expensesByCategory: Record<string, number> = {}
      thisMonthTrans
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const cat = t.category || "Outros"
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount
        })
      const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)

      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
      const monthlyBalance = monthlyIncome - monthlyExpenses

      // ====== SALDO & CONTAS ======
      if (matchesAny(q, ["saldo total", "quanto tenho", "património", "dinheiro total", "valor total"])) {
        const savingsPercent = totalBalance > 0 ? ((totalSavings / totalBalance) * 100).toFixed(0) : 0
        const investPercent = totalBalance > 0 ? ((totalInvestments / totalBalance) * 100).toFixed(0) : 0

        return `**Resumo do teu património:**

💰 **Saldo Total:** €${totalBalance.toFixed(2)}

**Distribuição:**
• Conta Corrente: €${totalChecking.toFixed(2)}
• Poupanças: €${totalSavings.toFixed(2)} (${savingsPercent}%)
• Investimentos: €${totalInvestments.toFixed(2)} (${investPercent}%)

**Contas:**
${accounts.map((a) => `• ${a.name}: €${(a.balance || 0).toFixed(2)}`).join("\n")}

${
  totalInvestments === 0 && totalBalance > 1000
    ? "💡 **Dica:** Tens dinheiro parado! Considera investir parte em ETFs para combater a inflação."
    : totalSavings > totalInvestments * 3
      ? "💡 **Dica:** Tens muito em poupanças vs investimentos. Considera diversificar!"
      : "✅ Boa distribuição de ativos!"
}`
      }

      if (matchesAny(q, ["cada conta", "minhas contas", "contas tenho", "lista de contas", "ver contas"])) {
        return `**As tuas contas:**

${accounts
  .map((a) => {
    const icon =
      a.type === "savings" || a.type === "poupanca"
        ? "🐷"
        : a.type === "investment" || a.type === "investimento"
          ? "📈"
          : "💳"
    return `${icon} **${a.name}** (${a.type})
   Saldo: €${(a.balance || 0).toFixed(2)}`
  })
  .join("\n\n")}

**Total:** €${totalBalance.toFixed(2)}`
      }

      if (matchesAny(q, ["gastei este mês", "despesas do mês", "gastos mensais", "quanto gastei", "gastos este mês"])) {
        const comparison =
          lastMonthExpenses > 0 ? (((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100).toFixed(0) : 0

        return `**Gastos de ${now.toLocaleString("pt-PT", { month: "long" })}:**

📊 **Resumo:**
• Despesas: €${monthlyExpenses.toFixed(2)}
• Receitas: €${monthlyIncome.toFixed(2)}
• Balanço: €${monthlyBalance.toFixed(2)} ${monthlyBalance >= 0 ? "✅" : "⚠️"}

**Comparação com mês anterior:**
${
  Number(comparison) > 0
    ? `📈 Gastaste +${comparison}% mais que o mês passado`
    : Number(comparison) < 0
      ? `📉 Gastaste ${Math.abs(Number(comparison))}% menos que o mês passado! 👏`
      : "Gastos iguais ao mês anterior"
}

**Top categorias:**
${sortedCategories
  .slice(0, 5)
  .map(([cat, val], i) => `${i + 1}. ${cat}: €${val.toFixed(2)} (${((val / monthlyExpenses) * 100).toFixed(0)}%)`)
  .join("\n")}

${
  monthlyExpenses > monthlyIncome
    ? "\n⚠️ **Alerta:** Estás a gastar mais do que ganhas! Revê as despesas."
    : `\n✅ Estás a poupar €${monthlyBalance.toFixed(2)} este mês (${savingsRate.toFixed(0)}%)`
}`
      }

      if (matchesAny(q, ["maior despesa", "despesa mais alta", "gastei mais", "maiores gastos"])) {
        const topExpenses = thisMonthTrans
          .filter((t) => t.type === "expense")
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        if (topExpenses.length === 0) {
          return "Não encontrei despesas registadas este mês. Adiciona transações para eu poder analisar!"
        }

        return `**Top 5 maiores despesas do mês:**

${topExpenses
  .map(
    (e, i) =>
      `${i + 1}. **${e.description}** - €${e.amount.toFixed(2)}
   📁 ${e.category || "Sem categoria"} | 📅 ${new Date(e.date).toLocaleDateString("pt-PT")}`,
  )
  .join("\n\n")}

**Total das 5 maiores:** €${topExpenses.reduce((acc, e) => acc + e.amount, 0).toFixed(2)}

${
  topExpenses[0].amount > monthlyIncome * 0.2
    ? `\n💡 A maior despesa representa ${((topExpenses[0].amount / monthlyIncome) * 100).toFixed(0)}% do teu rendimento. Considera se foi essencial.`
    : ""
}`
      }

      if (
        matchesAny(q, [
          "gastar mais do que ganho",
          "a gastar demais",
          "gastos vs receitas",
          "balanço mensal",
          "positivo ou negativo",
        ])
      ) {
        const status = monthlyBalance >= 0 ? "positivo" : "negativo"

        return `**Análise Receitas vs Despesas:**

📥 **Receitas:** €${monthlyIncome.toFixed(2)}
📤 **Despesas:** €${monthlyExpenses.toFixed(2)}
📊 **Balanço:** €${monthlyBalance.toFixed(2)} (${status})
💹 **Taxa de poupança:** ${savingsRate.toFixed(1)}%

${
  monthlyBalance < 0
    ? `
⚠️ **Sim, estás a gastar €${Math.abs(monthlyBalance).toFixed(2)} mais do que ganhas!**

**Plano de ação:**
1. Identifica gastos não essenciais nas categorias maiores
2. Define um limite máximo por categoria
3. Usa a regra 50/30/20 como guia
4. Considera fontes de rendimento extra

**Categorias onde podes cortar:**
${sortedCategories
  .slice(0, 3)
  .map(([cat, val]) => `• ${cat}: €${val.toFixed(2)}`)
  .join("\n")}
`
    : `
✅ **Parabéns! Estás a poupar €${monthlyBalance.toFixed(2)} por mês!**

${
  savingsRate >= 20
    ? "Excelente! Ultrapassas a recomendação de 20%. Considera investir o excedente."
    : savingsRate >= 10
      ? "Bom começo! Tenta aumentar gradualmente para 20%."
      : "Tenta aumentar a taxa de poupança para pelo menos 10-20%."
}`
}`
      }

      // ====== METAS ======
      if (
        matchesAny(q, ["metas financeiras", "minhas metas", "objetivos", "como estão as metas", "progresso das metas"])
      ) {
        if (goals.length === 0) {
          return `Ainda não tens metas definidas! 🎯

**Como criar uma meta:**
1. Vai à secção "Metas" no menu lateral
2. Clica em "+ Nova Meta"
3. Define nome, valor objetivo e prazo

**Sugestões de metas:**
• Fundo de emergência (3-6 meses de despesas)
• Férias dos sonhos
• Entrada para casa
• Reforma antecipada

Ter metas claras aumenta a probabilidade de as atingir em 42%!`
        }

        const totalGoalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0)
        const totalGoalCurrent = goals.reduce((acc, g) => acc + g.current_amount, 0)
        const overallProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0

        return `**Estado das tuas ${goals.length} metas:**

📊 **Progresso geral:** ${overallProgress.toFixed(0)}%
💰 **Total acumulado:** €${totalGoalCurrent.toFixed(2)} / €${totalGoalTarget.toFixed(2)}

${goals
  .map((g) => {
    const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
    const remaining = g.target_amount - g.current_amount
    const monthsNeeded = monthlyBalance > 0 ? Math.ceil(remaining / monthlyBalance) : "∞"
    const progressBar = "█".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10))

    return `**${g.name}**
${progressBar} ${progress.toFixed(0)}%
€${g.current_amount.toFixed(2)} / €${g.target_amount.toFixed(2)}
⏱️ ~${monthsNeeded} meses ao ritmo atual`
  })
  .join("\n\n")}

${
  goals.some((g) => g.current_amount / g.target_amount >= 0.9)
    ? "\n🎉 Tens metas quase concluídas! O sprint final é o mais importante!"
    : ""
}`
      }

      if (matchesAny(q, ["quanto falta", "falta para", "atingir meta", "completar meta"])) {
        if (goals.length === 0) {
          return "Não tens metas definidas. Cria uma na secção Metas para começar a acompanhar!"
        }

        return `**Quanto falta para cada meta:**

${goals
  .map((g) => {
    const remaining = Math.max(g.target_amount - g.current_amount, 0)
    const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
    const monthsNeeded = monthlyBalance > 0 ? Math.ceil(remaining / monthlyBalance) : null
    const weeksNeeded = monthlyBalance > 0 ? Math.ceil(remaining / (monthlyBalance / 4)) : null

    return `🎯 **${g.name}**
• Faltam: €${remaining.toFixed(2)}
• Progresso: ${progress.toFixed(0)}%
${monthsNeeded ? `• Tempo estimado: ~${monthsNeeded} meses (${weeksNeeded} semanas)` : "• Precisas poupar mais para calcular tempo"}`
  })
  .join("\n\n")}

💡 **Dica:** Para acelerar, considera:
• Cortar 10% em cada categoria de despesa
• Automatizar transferências no dia do salário
• Procurar rendimentos extra`
      }

      if (matchesAny(q, ["priorizar", "qual meta", "meta primeiro", "focar qual"])) {
        if (goals.length === 0) {
          return "Cria algumas metas primeiro para eu poder aconselhar qual priorizar!"
        }

        // Sort by closest to completion
        const sortedGoals = [...goals].sort((a, b) => {
          const progressA = a.target_amount > 0 ? a.current_amount / a.target_amount : 0
          const progressB = b.target_amount > 0 ? b.current_amount / b.target_amount : 0
          return progressB - progressA
        })

        const nearestGoal = sortedGoals[0]
        const progress =
          nearestGoal.target_amount > 0 ? (nearestGoal.current_amount / nearestGoal.target_amount) * 100 : 0
        const remaining = nearestGoal.target_amount - nearestGoal.current_amount

        return `**Recomendação de priorização:**

🥇 **Foco principal:** ${nearestGoal.name}
• Está a ${progress.toFixed(0)}% - mais perto de concluir!
• Faltam apenas €${remaining.toFixed(2)}

**Estratégia recomendada:**

1. **Método Avalanche (racional):**
   Prioriza metas com maior impacto financeiro

2. **Método Bola de Neve (motivacional):** ⭐
   Completa as mais próximas primeiro para ganhar momentum

**Sugestão para ti:**
• Aloca 70% das poupanças para "${nearestGoal.name}"
• Distribui 30% pelas outras ${goals.length - 1} metas
• Quando completares uma, celebra e redireciona!

Completar metas mais cedo gera dopamina e mantém-te motivado! 🧠`
      }

      if (matchesAny(q, ["atingir mais rápido", "acelerar metas", "metas mais rápido", "como poupar mais"])) {
        const potentialSavings = monthlyExpenses * 0.15

        return `**Como atingir metas mais rápido:**

**1. Cortar despesas (impacto imediato)**
• Revê subscrições não utilizadas
• Reduz 15% em ${sortedCategories[0]?.[0] || "categorias principais"} = €${potentialSavings.toFixed(2)}/mês
• "Dia sem gastos" semanal

**2. Aumentar rendimento**
• Freelancing ou trabalho extra
• Vender itens não utilizados
• Pedir aumento (se aplicável)

**3. Automatizar**
• Transferência automática no dia do salário
• "Paga-te a ti primeiro" - 20% direto para metas

**4. Desafios de poupança**
• Desafio das 52 semanas
• Arredondar compras para cima
• Igualar gastos supérfluos com poupança

**Impacto de poupar +€100/mês:**
${goals
  .slice(0, 2)
  .map((g) => {
    const remaining = g.target_amount - g.current_amount
    const currentMonths = monthlyBalance > 0 ? Math.ceil(remaining / monthlyBalance) : 999
    const newMonths = monthlyBalance + 100 > 0 ? Math.ceil(remaining / (monthlyBalance + 100)) : 999
    return `• ${g.name}: ${currentMonths} → ${newMonths} meses (${currentMonths - newMonths} meses mais cedo!)`
  })
  .join("\n")}`
      }

      // ====== INVESTIR ======
      if (
        matchesAny(q, [
          "começar a investir",
          "como investir",
          "quero investir",
          "iniciar investimento",
          "primeiro investimento",
        ])
      ) {
        const emergencyFund = monthlyExpenses * 6
        const hasEmergencyFund = totalSavings >= monthlyExpenses * 3

        return `**Guia para começar a investir:**

**Passo 1: Verificar pré-requisitos**
${
  hasEmergencyFund
    ? "✅ Tens fundo de emergência adequado!"
    : `⚠️ Primeiro, cria fundo de emergência de €${emergencyFund.toFixed(2)} (6 meses)`
}
${
  monthlyBalance > 0
    ? `✅ Tens capacidade de poupança (€${monthlyBalance.toFixed(2)}/mês)`
    : "⚠️ Equilibra primeiro receitas e despesas"
}

**Passo 2: Definir montante**
• Recomendado: 10-20% do rendimento
• Para ti: €${(monthlyIncome * 0.1).toFixed(2)} - €${(monthlyIncome * 0.2).toFixed(2)}/mês
• Começa pequeno e aumenta gradualmente

**Passo 3: Escolher onde investir**
• **ETFs globais** (VWCE, IWDA) - Diversificação automática
• **PPR** - Benefícios fiscais em Portugal
• **Certificados de Aforro** - Sem risco, baixo retorno

**Passo 4: Escolher corretora**
• Degiro, XTB, Trading 212 (baixas comissões)
• Banco tradicional (mais caro mas conveniente)

**Passo 5: Investir regularmente**
• Mesmo valor todo mês (DCA)
• Ignora volatilidade de curto prazo
• Horizonte mínimo: 5-10 anos

${
  hasEmergencyFund && monthlyBalance > 100
    ? "\n🚀 Estás pronto para começar a investir!"
    : "\n📌 Foca primeiro nos pré-requisitos antes de investir."
}`
      }

      if (matchesAny(q, ["etf", "o que são etfs", "etfs funcionam", "exchange traded"])) {
        return `**ETFs explicados de forma simples:**

**O que é um ETF?**
Exchange Traded Fund = Cabaz de ações num só produto
Como comprar um pacote com 500+ empresas de uma vez!

**Vantagens:**
• 🌍 Diversificação automática
• 💰 Custos muito baixos (0.1-0.5%/ano)
• 📈 Acompanha o mercado
• 🔄 Fácil comprar/vender

**ETFs populares para portugueses:**

| ETF | O que inclui | Custo/ano |
|-----|-------------|-----------|
| VWCE | 3000+ empresas globais | 0.22% |
| IWDA | Países desenvolvidos | 0.20% |
| SXR8 | S&P 500 (EUA) | 0.07% |

**Exemplo prático:**
Compras 1 unidade de VWCE (~€115):
→ Tens automaticamente parte da Apple, Microsoft, Nestlé, Toyota, e mais 3000 empresas!

**Simulação: €200/mês durante 20 anos a 7%:**
• Investido: €48.000
• Valor final: ~€104.000
• Ganho: €56.000 em juros compostos!

Os ETFs são a forma mais simples de investir para iniciantes. 👍`
      }

      if (matchesAny(q, ["simula", "simulação", "calcular investimento", "juros compostos", "quanto terei"])) {
        // Parse numbers from question or use defaults
        let monthlyAmount = 200
        let years = 20
        let rate = 7

        // Try to extract numbers from question
        const numbers = q.match(/\d+/g)
        if (numbers) {
          if (numbers[0]) monthlyAmount = Number.parseInt(numbers[0])
          if (numbers[1]) years = Number.parseInt(numbers[1])
          if (numbers[2]) rate = Number.parseInt(numbers[2])
        }

        const annualRate = rate / 100
        const months = years * 12
        const monthlyRate = annualRate / 12
        const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
        const totalInvested = monthlyAmount * months
        const gains = futureValue - totalInvested

        // Different scenarios
        const conservative = monthlyAmount * ((Math.pow(1 + 0.05 / 12, months) - 1) / (0.05 / 12))
        const aggressive = monthlyAmount * ((Math.pow(1 + 0.1 / 12, months) - 1) / (0.1 / 12))

        return `**Simulação de Investimento:**

📊 **Parâmetros:**
• Investimento mensal: €${monthlyAmount}
• Período: ${years} anos
• Retorno anual: ${rate}%

💰 **Resultado:**
• Total investido: €${totalInvested.toLocaleString("pt-PT")}
• Valor final: **€${Math.round(futureValue).toLocaleString("pt-PT")}**
• Ganho com juros: €${Math.round(gains).toLocaleString("pt-PT")}
• Multiplicador: ${(futureValue / totalInvested).toFixed(1)}x

📈 **Cenários alternativos:**
• Conservador (5%): €${Math.round(conservative).toLocaleString("pt-PT")}
• Agressivo (10%): €${Math.round(aggressive).toLocaleString("pt-PT")}

**O poder dos juros compostos:**
Os teus €${totalInvested.toLocaleString("pt-PT")} transformam-se em €${Math.round(futureValue).toLocaleString("pt-PT")}!
O dinheiro gera mais dinheiro automaticamente.

⏰ **Quanto mais cedo começares, melhor!**
Cada ano de atraso custa milhares de euros em ganhos perdidos.`
      }

      if (matchesAny(q, ["quanto investir", "percentagem investir", "parte do salário", "quanto devo investir"])) {
        const conservative = monthlyIncome * 0.1
        const moderate = monthlyIncome * 0.15
        const aggressive = monthlyIncome * 0.2

        return `**Quanto deves investir do salário:**

📊 **Recomendações gerais:**
• Mínimo: 10% = €${conservative.toFixed(2)}/mês
• Ideal: 15% = €${moderate.toFixed(2)}/mês  
• Agressivo: 20% = €${aggressive.toFixed(2)}/mês

**A tua situação atual:**
• Rendimento: €${monthlyIncome.toFixed(2)}/mês
• Poupança atual: €${monthlyBalance.toFixed(2)} (${savingsRate.toFixed(0)}%)
• ${savingsRate >= 20 ? "✅ Já poupas 20%+! Excelente!" : savingsRate >= 10 ? "👍 Bom começo, tenta aumentar gradualmente" : "⚠️ Tenta aumentar a taxa de poupança"}

**Prioridade de alocação:**
1. Fundo emergência: €${(monthlyExpenses * 6).toFixed(2)} (6 meses)
2. Dívidas de juros altos: Pagar primeiro!
3. Investimentos: O que sobrar

**Estratégia recomendada:**
${
  totalSavings < monthlyExpenses * 3
    ? `Foca primeiro em construir €${(monthlyExpenses * 3).toFixed(2)} de emergência, depois investe.`
    : `Com fundo de emergência adequado, podes investir €${moderate.toFixed(2)}/mês em ETFs.`
}

💡 **Dica:** Automatiza a transferência no dia do salário!`
      }

      // ====== POUPAR ======
      if (matchesAny(q, ["cortar despesas", "reduzir gastos", "onde poupar", "economizar", "gastar menos"])) {
        if (sortedCategories.length === 0) {
          return "Não encontrei despesas este mês para analisar. Adiciona transações primeiro!"
        }

        const potentialSavings10 = monthlyExpenses * 0.1
        const potentialSavings20 = monthlyExpenses * 0.2

        return `**Análise para cortar despesas:**

📊 **As tuas maiores categorias:**
${sortedCategories
  .slice(0, 5)
  .map(([cat, val], i) => {
    const percent = ((val / monthlyExpenses) * 100).toFixed(0)
    const potentialCut = val * 0.2
    return `${i + 1}. **${cat}**: €${val.toFixed(2)} (${percent}%)
   💡 Cortar 20% = poupar €${potentialCut.toFixed(2)}/mês`
  })
  .join("\n")}

**Estratégias de corte:**
${
  sortedCategories[0] && sortedCategories[0][1] > monthlyExpenses * 0.25
    ? `• ⚠️ "${sortedCategories[0][0]}" representa ${((sortedCategories[0][1] / monthlyExpenses) * 100).toFixed(0)}% dos gastos. Foco aqui!`
    : ""
}
• Revê todas as subscrições (Netflix, Spotify, ginásio...)
• Compara preços antes de compras >€50
• Leva almoço de casa 2-3x por semana
• Usa transportes públicos quando possível
• Desafio "sem gastos" 1 dia por semana

**Impacto potencial:**
• Cortar 10%: +€${potentialSavings10.toFixed(2)}/mês = €${(potentialSavings10 * 12).toFixed(2)}/ano
• Cortar 20%: +€${potentialSavings20.toFixed(2)}/mês = €${(potentialSavings20 * 12).toFixed(2)}/ano

🎯 Começa por identificar 3 gastos não essenciais para eliminar esta semana!`
      }

      if (matchesAny(q, ["50/30/20", "regra 50", "cinquenta trinta", "orçamento regra"])) {
        const needs50 = monthlyIncome * 0.5
        const wants30 = monthlyIncome * 0.3
        const savings20 = monthlyIncome * 0.2

        const actualSavings = monthlyIncome - monthlyExpenses
        const actualSavingsPercent = savingsRate

        return `**Regra 50/30/20 aplicada às tuas finanças:**

📊 **Com rendimento de €${monthlyIncome.toFixed(2)}:**

| Categoria | % | Valor | Descrição |
|-----------|---|-------|-----------|
| Necessidades | 50% | €${needs50.toFixed(2)} | Renda, contas, comida, transporte |
| Desejos | 30% | €${wants30.toFixed(2)} | Restaurantes, lazer, compras |
| Poupança | 20% | €${savings20.toFixed(2)} | Emergência, metas, investir |

**A tua realidade atual:**
• Gastas: €${monthlyExpenses.toFixed(2)} (${(100 - savingsRate).toFixed(0)}%)
• Poupas: €${actualSavings.toFixed(2)} (${actualSavingsPercent.toFixed(0)}%)

${
  actualSavingsPercent >= 20
    ? `✅ **Parabéns!** Poupas ${actualSavingsPercent.toFixed(0)}%, acima da recomendação!`
    : actualSavingsPercent >= 10
      ? `👍 **Bom progresso!** Poupas ${actualSavingsPercent.toFixed(0)}%. Faltam €${(savings20 - actualSavings).toFixed(2)}/mês para os 20%.`
      : `⚠️ **Atenção!** Poupas apenas ${actualSavingsPercent.toFixed(0)}%. Tenta reduzir despesas em €${(savings20 - actualSavings).toFixed(2)}/mês.`
}

**Como ajustar:**
${
  monthlyExpenses > needs50 + wants30
    ? `• Reduz despesas em €${(monthlyExpenses - needs50 - wants30).toFixed(2)} para cumprir a regra`
    : "• Estás dentro do orçamento recomendado!"
}

💡 Esta regra é um guia, não uma lei. Adapta às tuas circunstâncias!`
      }

      if (
        matchesAny(q, [
          "fundo de emergência",
          "emergência",
          "reserva financeira",
          "dinheiro emergência",
          "quanto reserva",
        ])
      ) {
        const minimum = monthlyExpenses * 3
        const recommended = monthlyExpenses * 6
        const coverage = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0

        return `**Fundo de Emergência explicado:**

**O que é?**
Reserva para imprevistos: perda de emprego, doença, reparações urgentes, etc.

📊 **Quanto ter:**
• Mínimo: 3 meses = €${minimum.toFixed(2)}
• Recomendado: 6 meses = €${recommended.toFixed(2)}
• Conservador: 12 meses = €${(monthlyExpenses * 12).toFixed(2)}

**O teu estado atual:**
• Poupanças: €${totalSavings.toFixed(2)}
• Cobertura: ${coverage.toFixed(1)} meses de despesas
${
  coverage >= 6
    ? `\n✅ **Excelente!** Tens ${coverage.toFixed(1)} meses de reserva. Podes começar a investir o excedente!`
    : coverage >= 3
      ? `\n👍 **Bom!** Tens o mínimo. Tenta aumentar para €${recommended.toFixed(2)} (6 meses).`
      : `\n⚠️ **Atenção!** Faltam €${(minimum - totalSavings).toFixed(2)} para o mínimo de 3 meses.`
}

**Onde guardar:**
• Conta poupança separada (nunca mexer!)
• Acesso fácil mas não imediato
• Nunca investir em ativos voláteis

**Plano para construir:**
${
  totalSavings < minimum
    ? `• Precisas poupar €${(minimum - totalSavings).toFixed(2)}
• Ao ritmo atual: ~${monthlyBalance > 0 ? Math.ceil((minimum - totalSavings) / monthlyBalance) : "∞"} meses`
    : "• Já tens fundo adequado! Mantém e investe o resto."
}`
      }

      if (matchesAny(q, ["despesas por categoria", "análise categorias", "onde gasto mais", "categorias de gastos"])) {
        if (sortedCategories.length === 0) {
          return "Sem despesas registadas este mês para analisar por categoria."
        }

        const total = monthlyExpenses

        return `**Análise de despesas por categoria:**

📊 **${now.toLocaleString("pt-PT", { month: "long", year: "numeric" })}**
Total: €${total.toFixed(2)}

${sortedCategories
  .map(([cat, val], i) => {
    const percent = ((val / total) * 100).toFixed(1)
    const bar = "█".repeat(Math.round(Number(percent) / 5)) + "░".repeat(20 - Math.round(Number(percent) / 5))
    return `**${i + 1}. ${cat}**
${bar} ${percent}%
€${val.toFixed(2)}`
  })
  .join("\n\n")}

**Insights:**
${
  sortedCategories[0] && Number((sortedCategories[0][1] / total) * 100) > 30
    ? `• ⚠️ "${sortedCategories[0][0]}" ocupa ${((sortedCategories[0][1] / total) * 100).toFixed(0)}% do orçamento`
    : "• ✅ Distribuição equilibrada entre categorias"
}
${sortedCategories.length > 5 ? `• Tens gastos em ${sortedCategories.length} categorias diferentes` : ""}`
      }

      // ====== APRENDER ======
      if (matchesAny(q, ["juros compostos", "compound interest", "juro composto"])) {
        const example10Years = 200 * ((Math.pow(1 + 0.07 / 12, 120) - 1) / (0.07 / 12))
        const example20Years = 200 * ((Math.pow(1 + 0.07 / 12, 240) - 1) / (0.07 / 12))
        const example30Years = 200 * ((Math.pow(1 + 0.07 / 12, 360) - 1) / (0.07 / 12))

        return `**Juros Compostos - A 8ª maravilha do mundo:**

**O que são?**
Ganhas juros não só sobre o dinheiro investido, mas também sobre os juros anteriores. O dinheiro cresce exponencialmente!

**Fórmula simplificada:**
Valor Final = Contribuição × ((1 + taxa)^tempo - 1) / taxa

**Exemplo prático (€200/mês a 7%):**

| Anos | Investido | Valor Final | Ganho |
|------|-----------|-------------|-------|
| 10 | €24.000 | €${Math.round(example10Years).toLocaleString("pt-PT")} | €${Math.round(example10Years - 24000).toLocaleString("pt-PT")} |
| 20 | €48.000 | €${Math.round(example20Years).toLocaleString("pt-PT")} | €${Math.round(example20Years - 48000).toLocaleString("pt-PT")} |
| 30 | €72.000 | €${Math.round(example30Years).toLocaleString("pt-PT")} | €${Math.round(example30Years - 72000).toLocaleString("pt-PT")} |

📈 **O segredo:** TEMPO
• 10 anos: multiplicas por ${(example10Years / 24000).toFixed(1)}x
• 30 anos: multiplicas por ${(example30Years / 72000).toFixed(1)}x

**A regra dos 72:**
Divide 72 pela taxa de retorno = anos para duplicar
Ex: 72 ÷ 7% = ~10 anos para duplicar

⏰ Cada ano que adias custa milhares de euros!`
      }

      if (matchesAny(q, ["diversificação", "diversificar", "não pôr ovos", "distribuir investimentos"])) {
        return `**Diversificação explicada:**

**O que é?**
"Não pôr todos os ovos no mesmo cesto"
Distribuir investimentos para reduzir risco.

**Tipos de diversificação:**

1. **Por classe de ativos:**
• Ações (crescimento)
• Obrigações (estabilidade)
• Imobiliário (rendimento)
• Ouro (proteção)

2. **Por geografia:**
• Europa, EUA, Ásia
• Mercados emergentes

3. **Por setor:**
• Tecnologia, Saúde, Energia
• Consumo, Financeiro

**Exemplo de carteira diversificada:**
• 60% ETF Global (VWCE)
• 20% Obrigações
• 10% Imobiliário
• 10% Ouro

**Porque funciona:**
Se tecnologia cai 30%, mas só tens 20% em tech → perdes 6%
Se tivesses tudo em tech → perdes 30%

**Regra de ouro:**
Com ETFs globais já tens diversificação automática em 3000+ empresas!

${totalInvestments > 0 ? `\n💡 Os teus €${totalInvestments.toFixed(2)} em investimentos estão diversificados?` : ""}`
      }

      if (matchesAny(q, ["inflação", "inflation", "perda de valor", "preços sobem"])) {
        const value10Years = 1000 / Math.pow(1.03, 10)
        const value20Years = 1000 / Math.pow(1.03, 20)

        return `**Inflação explicada:**

**O que é?**
Aumento geral dos preços ao longo do tempo.
O teu dinheiro perde poder de compra!

**Exemplo real:**
€1000 hoje com inflação de 3%/ano:
• Daqui a 10 anos: poder de compra de €${value10Years.toFixed(0)}
• Daqui a 20 anos: poder de compra de €${value20Years.toFixed(0)}

**Impacto nos teus €${totalBalance.toFixed(2)}:**
• Sem investir, daqui a 10 anos valem ~€${(totalBalance * 0.74).toFixed(2)} em poder de compra
• É como perder €${(totalBalance * 0.26).toFixed(2)}!

**Como te proteger:**

| Estratégia | Retorno típico | vs Inflação |
|------------|---------------|-------------|
| Conta poupança | 1-2% | Perdes 1-2%/ano |
| Certificados | 2-3% | Empatas |
| ETFs | 7%+ | Ganhas 4%+/ano |
| Imobiliário | 5-8% | Ganhas 2-5%/ano |

**A solução:**
Investir em ativos que crescem acima da inflação!
ETFs globais historicamente rendem 7-10%/ano.

⚠️ Dinheiro parado em conta é garantia de perder valor!`
      }

      if (
        matchesAny(q, [
          "diferença poupar investir",
          "poupar vs investir",
          "poupar ou investir",
          "poupança vs investimento",
        ])
      ) {
        return `**Poupar vs Investir:**

| Aspeto | Poupar | Investir |
|--------|--------|----------|
| Retorno | 0-2%/ano | 5-10%/ano |
| Risco | Zero | Médio-Alto |
| Liquidez | Imediata | Variável |
| Ideal para | Curto prazo | Longo prazo |
| Proteção inflação | ❌ Não | ✅ Sim |

**Quando poupar:**
• Fundo de emergência
• Objetivos < 2 anos (férias, carro)
• Dinheiro que podes precisar rapidamente

**Quando investir:**
• Reforma (20+ anos)
• Comprar casa (5+ anos)
• Objetivos a longo prazo
• Dinheiro que não precisas tocar

**Ordem recomendada:**
1. 🆘 Fundo emergência (3-6 meses) → POUPAR
2. 💰 Sobra mensal → INVESTIR
3. 🎯 Metas curto prazo → POUPAR
4. 📈 Metas longo prazo → INVESTIR

**A tua situação:**
• Poupanças: €${totalSavings.toFixed(2)}
• Investimentos: €${totalInvestments.toFixed(2)}
${
  totalSavings < monthlyExpenses * 3
    ? "\n💡 Foca primeiro em poupar para emergência!"
    : totalInvestments === 0
      ? "\n💡 Tens poupança adequada! Considera começar a investir."
      : "\n✅ Boa combinação de poupança e investimento!"
}`
      }

      // ====== AJUDA ======
      if (matchesAny(q, ["o que podes fazer", "ajudar", "capacidades", "funcionalidades", "como funciona"])) {
        return `**O que o CashBot pode fazer por ti:**

🔍 **Análise Financeira:**
• "Qual é o meu saldo total?"
• "Quanto gastei este mês?"
• "Onde gasto mais dinheiro?"
• "Estou a poupar o suficiente?"

🎯 **Planeamento de Metas:**
• "Como estão as minhas metas?"
• "Qual meta devo priorizar?"
• "Como atingir metas mais rápido?"

📈 **Investimentos:**
• "Como começar a investir?"
• "O que são ETFs?"
• "Simula investir X€ durante Y anos"

💡 **Educação Financeira:**
• "O que são juros compostos?"
• "Como funciona a diversificação?"
• "Regra 50/30/20"

🛠️ **Ajuda com a App:**
• "Como adiciono uma transação?"
• "Como funcionam as automações?"

Pergunta-me o que quiseres! Tenho acesso aos teus dados financeiros para dar respostas personalizadas.`
      }

      if (matchesAny(q, ["adicionar transação", "nova transação", "registar gasto", "adiciono despesa"])) {
        return `**Como adicionar uma transação:**

1. Clica em **"+ Nova Transação"** na barra lateral esquerda

2. Preenche os campos:
   • **Tipo:** Receita, Despesa ou Transferência
   • **Valor:** Montante da transação
   • **Descrição:** O que foi (ex: "Almoço restaurante")
   • **Categoria:** Alimentação, Transporte, etc.
   • **Conta:** De onde sai/entra o dinheiro
   • **Data:** Quando aconteceu

3. Clica em **"Guardar"**

💡 **Dicas:**
• Usa descrições claras para encontrar depois
• Categoriza sempre para análises melhores
• Para gastos recorrentes, usa a secção "Recorrentes"

📱 Adiciona transações logo após gastares para não esqueceres!`
      }

      if (matchesAny(q, ["automação", "automações", "automatizar", "automático"])) {
        return `**Como funcionam as automações:**

As automações executam ações automaticamente baseadas em condições.

**Exemplos úteis:**
• Transferir 20% do salário para poupança
• Alertar quando gastos > €500/mês em categoria
• Contribuir para metas automaticamente

**Como criar:**
1. Vai a **"Automações"** no menu
2. Clica em **"+ Nova Automação"**
3. Define:
   • **Trigger:** Quando executar (ex: receber salário)
   • **Ação:** O que fazer (ex: transferir €200)
   • **Frequência:** Diário, semanal, mensal
4. Ativa a automação

**Automações recomendadas:**
• "Paga-te a ti primeiro" - 20% do salário para poupança
• Contribuição automática para metas
• Alerta de gastos excessivos

💡 Automatizar é a melhor forma de poupar sem esforço!`
      }

      if (matchesAny(q, ["metas funcionam", "criar meta", "como usar metas", "sistema de metas"])) {
        return `**Como funcionam as metas:**

**Criar uma meta:**
1. Vai a **"Metas"** no menu lateral
2. Clica em **"+ Nova Meta"**
3. Define:
   • Nome (ex: "Férias Tailândia")
   • Valor objetivo (ex: €2.000)
   • Data limite (opcional)
   • Imagem/ícone (motivação!)

**Adicionar dinheiro:**
• Transferir de uma conta para a meta
• Configurar contribuição automática
• O saldo da meta é separado das contas

**Acompanhar:**
• Barra de progresso visual
• Estimativa de conclusão
• Histórico de contribuições

💡 **Dicas de sucesso:**
• Nomes específicos motivam mais ("Férias Bali" vs "Viagem")
• Metas menores primeiro = vitórias rápidas
• Automatiza contribuições para não falhar

**As tuas metas atuais:**
${
  goals.length > 0
    ? goals.map((g) => `• ${g.name}: ${((g.current_amount / g.target_amount) * 100).toFixed(0)}%`).join("\n")
    : "Ainda não tens metas. Cria uma para começar!"
}`
      }

      if (matchesAny(q, ["exportar", "download dados", "excel", "backup"])) {
        return `**Como exportar os teus dados:**

1. Vai a **Definições** (ícone engrenagem)
2. Secção **"Exportar Dados"**
3. Escolhe formato:
   • **CSV** - Para Excel/Google Sheets
   • **PDF** - Relatório formatado
   • **JSON** - Backup completo

**O que podes exportar:**
• Todas as transações
• Resumo por categoria
• Histórico de metas
• Relatórios mensais

💡 Exporta regularmente para teres backup dos teus dados!`
      }

      // ====== CONVERSATIONAL / DEFAULT ======
      if (matchesAny(q, ["olá", "oi", "bom dia", "boa tarde", "boa noite", "hey", "hello"])) {
        return `Olá! 👋 

Sou o **CashBot**, o teu assistente financeiro pessoal.

**Resumo rápido das tuas finanças:**
• Saldo total: €${totalBalance.toFixed(2)}
• Este mês: ${monthlyBalance >= 0 ? `+€${monthlyBalance.toFixed(2)}` : `-€${Math.abs(monthlyBalance).toFixed(2)}`}
• Metas ativas: ${goals.length}

Como posso ajudar-te hoje?`
      }

      if (matchesAny(q, ["obrigado", "obrigada", "thanks", "valeu", "agradeço"])) {
        return `De nada! 😊

Estou sempre aqui para ajudar com as tuas finanças.

Algumas coisas que podes perguntar:
• "Análise das minhas despesas"
• "Simula investir €100/mês"
• "Como atingir metas mais rápido"

Boa sorte com as tuas finanças! 💪`
      }

      // Default fallback with suggestions
      return `Obrigado pela pergunta! Deixa-me ajudar-te melhor.

**Posso responder sobre:**
• 💰 **Saldo e contas** - "Quanto tenho?", "Minhas contas"
• 📊 **Despesas** - "Quanto gastei?", "Análise por categoria"
• 🎯 **Metas** - "Como estão as metas?", "Priorizar qual?"
• 📈 **Investir** - "Como começar?", "O que são ETFs?"
• 💡 **Poupar** - "Onde cortar?", "Regra 50/30/20"
• 📚 **Aprender** - "Juros compostos", "Diversificação"

**Tenta perguntar algo como:**
• "Qual é o meu saldo total?"
• "Onde posso cortar despesas?"
• "Simula investir 200€/mês durante 20 anos"

Ou escolhe um tema nos botões acima! 👆`
    },
    [accounts, transactions, goals],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading || !text.trim()) return

      setError(null)
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      setTimeout(
        () => {
          const response = generateResponse(text)
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response,
          }
          setMessages((prev) => [...prev, assistantMessage])
          setIsLoading(false)
        },
        400 + Math.random() * 400,
      )
    },
    [isLoading, generateResponse],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const quickActions = [
    { icon: Wallet, label: "Saldo", topic: "saldo" as const, color: "text-emerald-500" },
    { icon: Target, label: "Metas", topic: "metas" as const, color: "text-blue-500" },
    { icon: TrendingUp, label: "Investir", topic: "investir" as const, color: "text-purple-500" },
    { icon: Lightbulb, label: "Poupar", topic: "poupar" as const, color: "text-amber-500" },
    { icon: GraduationCap, label: "Aprender", topic: "aprender" as const, color: "text-pink-500" },
    { icon: HelpCircle, label: "Ajuda", topic: "ajuda" as const, color: "text-gray-500" },
  ]

  const renderFormattedText = (text: string) => {
    if (!text) return null

    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Handle tables
      if (line.includes("|") && line.trim().startsWith("|")) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].includes("|")) {
          tableLines.push(lines[i])
          i++
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].split("|").filter((c) => c.trim())
          const bodyRows = tableLines.slice(2).map((row) => row.split("|").filter((c) => c.trim()))

          elements.push(
            <div key={`table-${i}`} className="overflow-x-auto my-2">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b">
                    {headerCells.map((cell, j) => (
                      <th key={j} className="px-2 py-1 text-left font-semibold">
                        {cell.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, j) => (
                    <tr key={j} className="border-b border-border/50">
                      {row.map((cell, k) => (
                        <td key={k} className="px-2 py-1">
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>,
          )
          continue
        }
      }

      // Handle bullet points
      if (line.startsWith("• ") || line.startsWith("- ")) {
        const content = line.slice(2)
        elements.push(
          <p key={i} className="mb-1 last:mb-0 pl-2 flex gap-2">
            <span className="text-primary">•</span>
            <span>{content.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}</span>
          </p>,
        )
      }
      // Handle numbered lists
      else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <p key={i} className="mb-1 last:mb-0 pl-2">
            {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
          </p>,
        )
      }
      // Handle headers
      else if (line.startsWith("**") && line.endsWith("**")) {
        elements.push(
          <p key={i} className="font-semibold mb-2 mt-3 first:mt-0">
            {line.replace(/\*\*/g, "")}
          </p>,
        )
      }
      // Handle progress bars (custom)
      else if (line.includes("█") || line.includes("░")) {
        elements.push(
          <p key={i} className="mb-1 font-mono text-xs">
            {line}
          </p>,
        )
      }
      // Empty lines
      else if (line.trim() === "") {
        elements.push(<div key={i} className="h-2" />)
      }
      // Regular paragraph
      else {
        elements.push(
          <p key={i} className="mb-1 last:mb-0">
            {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
          </p>,
        )
      }

      i++
    }

    return elements
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">CashBot</h3>
            <p className="text-xs text-muted-foreground">Assistente Financeiro IA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <DropdownMenu key={action.label}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 flex flex-col gap-1 rounded-xl hover:bg-primary/10 hover:border-primary/30 bg-transparent"
                  disabled={isLoading}
                >
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  <span className="text-xs flex items-center gap-1">
                    {action.label}
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {topicQuestions[action.topic].map((question, idx) => (
                  <DropdownMenuItem key={idx} onClick={() => sendMessage(question)} className="cursor-pointer text-sm">
                    {question}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                <div className="text-sm">{renderFormattedText(message.content)}</div>
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted rounded-bl-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">A analisar os teus dados...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunta-me qualquer coisa sobre finanças..."
            disabled={isLoading}
            className="rounded-xl"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-xl shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          CashBot analisa os teus dados financeiros reais para respostas personalizadas.
        </p>
      </div>
    </div>
  )
}

export default AIChatbot
