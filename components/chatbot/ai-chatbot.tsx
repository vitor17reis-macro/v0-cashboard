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
  Bot,
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
    "Como está o meu fluxo de caixa?", // Added
    "Quanto recebi este mês?", // Added
    "Qual o balanço entre receitas e despesas?", // Added
  ],
  metas: [
    "Como estão as minhas metas financeiras?",
    "Quanto falta para atingir cada meta?",
    "Qual meta devo priorizar?",
    "Como posso atingir as metas mais rápido?",
    "Devo criar uma nova meta de poupança?",
    "Quanto preciso poupar por mês para cada meta?", // Added
    "Qual meta está mais próxima de ser atingida?", // Added
    "Analisa o progresso das minhas metas", // Added
  ],
  investir: [
    "Por onde devo começar a investir?",
    "O que são ETFs e como funcionam?",
    "Quanto do meu salário devo investir?",
    "Qual a diferença entre ações e fundos?",
    "Simula investir 200€/mês durante 20 anos",
    "O que é diversificação de carteira?", // Added
    "Quais os melhores investimentos para iniciantes?", // Added
    "Como funciona o mercado de ações?", // Added
  ],
  poupar: [
    "Onde posso cortar despesas?",
    "Como aplicar a regra 50/30/20?",
    "Quanto devo ter em fundo de emergência?",
    "Quais despesas posso eliminar?",
    "Analisa as minhas despesas por categoria",
    "Dicas para poupar mais dinheiro", // Added
    "Como reduzir gastos mensais?", // Added
    "Estou a poupar o suficiente?", // Added
  ],
  aprender: [
    "O que são juros compostos?",
    "Como funciona a diversificação?",
    "O que é inflação e como me protejo?",
    "Qual a diferença entre poupar e investir?",
    "O que é um fundo de emergência?",
    "Como funciona o IRS em Portugal?", // Added
    "O que são obrigações vs ações?", // Added
    "Como calcular o retorno de investimentos?", // Added
  ],
  ajuda: [
    "O que podes fazer por mim?",
    "Como adiciono uma transação?",
    "Como crio uma automação?",
    "Como funcionam as metas?",
    "Como exporto os meus dados?",
    "Como edito uma transação?", // Added
    "Como funciona a previsão?", // Added
    "Como configuro categorias?", // Added
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

Tenho acesso aos teus dados financeiros e posso ajudar-te com:

• **Analisar** o teu saldo, despesas e receitas
• **Planear** como atingir as tuas metas financeiras
• **Ensinar** conceitos de investimento e poupança
• **Simular** cenários de investimento
• **Sugerir** onde podes cortar gastos

Escolhe um tema acima ou pergunta-me qualquer coisa!`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // Removed `error` state as it's not used in the provided update

  const { transactions, accounts, goals, categories } = useFinance()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Destructured data to get user directly
      if (user) setUserId(user.id)
    })
  }, [])

  // Simplified useEffect for scrolling
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const getCategoryName = useCallback(
    (categoryId: string): string => {
      const category = categories.find((c) => c.id === categoryId)
      return category?.name || "Outros"
    },
    [categories],
  )

  const generateIntelligentResponse = useCallback(
    (question: string): string => {
      const q = question.toLowerCase()
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Filter transactions for current month
      const thisMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })

      const totalIncome = thisMonthTransactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
      const totalExpenses = thisMonthTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0)
      const balance = totalIncome - totalExpenses
      const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0)

      // Get expenses by category with names
      const expensesByCategory: Record<string, { amount: number; name: string }> = {}
      thisMonthTransactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const catId = t.category || "outros" // Default to 'outros' if category is null/undefined
          const catName = getCategoryName(catId)
          if (!expensesByCategory[catId]) {
            expensesByCategory[catId] = { amount: 0, name: catName }
          }
          expensesByCategory[catId].amount += t.amount
        })

      const sortedCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b.amount - a.amount)
        .slice(0, 5) // Keep only top 5 for brevity

      // SALDO / GASTOS
      if (matchesAny(q, ["saldo", "quanto tenho", "patrimonio", "dinheiro total", "valor total"])) {
        let response = `**O teu património total é €${totalBalance.toFixed(2)}**\n\n`
        response += `**Distribuição por contas:**\n`
        accounts.forEach((acc) => {
          const icon =
            acc.type === "savings" || acc.type === "poupanca"
              ? "🐷"
              : acc.type === "investment" || acc.type === "investimento"
                ? "📈"
                : "💳"
          response += `${icon} ${acc.name}: **€${(acc.balance || 0).toFixed(2)}**\n`
        })
        return response
      }

      if (matchesAny(q, ["quanto gastei", "gastos", "despesas", "gastei este"])) {
        let response = `**Gastos de ${now.toLocaleString("pt-PT", { month: "long" })}:**\n\n`
        response += `📊 **Resumo:**\n`
        response += `• Despesas: **€${totalExpenses.toFixed(2)}**\n`
        response += `• Receitas: **€${totalIncome.toFixed(2)}**\n`
        response += `• Balanço: **€${balance.toFixed(2)}** ${balance >= 0 ? "✅" : "⚠️"}\n\n`

        if (sortedCategories.length > 0) {
          response += `**Top categorias de despesas:**\n`
          sortedCategories.forEach(([_, data], i) => {
            const pct = totalExpenses > 0 ? ((data.amount / totalExpenses) * 100).toFixed(0) : 0
            response += `${i + 1}. ${data.name}: **€${data.amount.toFixed(2)}** (${pct}%)\n`
          })
        }

        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : 0
        response += `\n💡 Estás a poupar **${savingsRate}%** do teu rendimento este mês.`

        return response
      }

      if (matchesAny(q, ["recebi", "receitas", "rendimento", "salário", "ganho"])) {
        let response = `**Receitas de ${now.toLocaleString("pt-PT", { month: "long" })}:**\n\n`
        response += `💰 Total recebido: **€${totalIncome.toFixed(2)}**\n\n`

        const incomes = thisMonthTransactions.filter((t) => t.type === "income")
        if (incomes.length > 0) {
          response += `**Detalhes:**\n`
          incomes.slice(0, 5).forEach((t) => {
            // Show up to 5 income transactions
            response += `• ${t.description}: **€${t.amount.toFixed(2)}**\n`
          })
        }
        return response
      }

      if (matchesAny(q, ["maior despesa", "gastei mais", "despesa maior"])) {
        const topExpenses = thisMonthTransactions
          .filter((t) => t.type === "expense")
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5) // Get top 5 expenses

        if (topExpenses.length === 0) {
          return "Não encontrei despesas registadas este mês."
        }

        let response = `**Top 5 maiores despesas deste mês:**\n\n`
        topExpenses.forEach((t, i) => {
          const catName = getCategoryName(t.category)
          response += `${i + 1}. **${t.description}** - €${t.amount.toFixed(2)}\n   📁 ${catName}\n\n`
        })
        return response
      }

      if (matchesAny(q, ["fluxo", "cash flow", "entrada saída"])) {
        const inflow = totalIncome
        const outflow = totalExpenses
        const net = inflow - outflow

        let response = `**Fluxo de Caixa - ${now.toLocaleString("pt-PT", { month: "long" })}:**\n\n`
        response += `⬆️ Entradas: **€${inflow.toFixed(2)}**\n`
        response += `⬇️ Saídas: **€${outflow.toFixed(2)}**\n`
        response += `━━━━━━━━━━━━\n`
        response += `📊 Líquido: **€${net.toFixed(2)}** ${net >= 0 ? "✅" : "🔴"}\n\n`

        if (net < 0) {
          response += `⚠️ **Atenção:** Estás a gastar mais do que ganhas! Considera rever as tuas despesas.`
        } else if (net > 0) {
          response += `✅ **Excelente!** Tens um saldo positivo. Considera investir ou aumentar a poupança.`
        }
        return response
      }

      // METAS
      if (matchesAny(q, ["metas", "objetivos", "goals", "progresso"])) {
        if (goals.length === 0) {
          return "Ainda não tens metas definidas. Cria uma meta na secção 'Metas Financeiras' para começar a acompanhar o teu progresso!"
        }

        let response = `**As tuas ${goals.length} metas financeiras:**\n\n`
        goals.forEach((goal) => {
          const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
          const remaining = goal.target_amount - goal.current_amount
          // Assign emojis based on progress percentage
          const emoji =
            progress >= 100 ? "🎉" : progress >= 75 ? "🔥" : progress >= 50 ? "💪" : progress >= 25 ? "📈" : "🚀"

          response += `${emoji} **${goal.name}**\n`
          response += `   €${goal.current_amount.toFixed(2)} / €${goal.target_amount.toFixed(2)} (${progress.toFixed(0)}%)\n`
          if (progress < 100) {
            response += `   Faltam: **€${remaining.toFixed(2)}**\n`
          }
          response += `\n`
        })

        // Calculate average progress for a summary
        const avgProgress =
          goals.reduce((acc, g) => acc + (g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0), 0) /
          goals.length
        response += `📊 **Progresso médio:** ${avgProgress.toFixed(0)}%`

        return response
      }

      if (matchesAny(q, ["priorizar", "qual meta", "focar"])) {
        if (goals.length === 0) {
          return "Ainda não tens metas definidas."
        }

        // Sort goals by progress (highest first)
        const sortedGoals = [...goals].sort((a, b) => {
          const progA = a.target_amount > 0 ? a.current_amount / a.target_amount : 0
          const progB = b.target_amount > 0 ? b.current_amount / b.target_amount : 0
          return progB - progA // Sort descending
        })

        const closest = sortedGoals[0]
        const closestProg = closest.target_amount > 0 ? (closest.current_amount / closest.target_amount) * 100 : 0

        let response = `**Recomendação de priorização:**\n\n`
        response += `🎯 A meta mais próxima é **"${closest.name}"** com ${closestProg.toFixed(0)}% concluído.\n\n`
        response += `Faltam apenas **€${(closest.target_amount - closest.current_amount).toFixed(2)}** para atingir!\n\n`
        response += `💡 **Dica:** Concentra esforços numa meta de cada vez para sentires progresso mais rápido.`

        return response
      }

      // INVESTIMENTOS E EDUCAÇÃO
      if (matchesAny(q, ["começar investir", "iniciar investimento", "como investir", "primeiro investimento"])) {
        return `**Guia para começar a investir:**

1️⃣ **Fundo de emergência primeiro**
   Antes de investir, garante 3-6 meses de despesas em poupança líquida.

2️⃣ **Define o teu perfil de risco**
   • Conservador: Prefere segurança
   • Moderado: Equilíbrio risco/retorno
   • Agressivo: Aceita volatilidade por maiores ganhos

3️⃣ **Começa com ETFs diversificados**
   • ETF World (ex: IWDA, VWCE) - exposição global
   • Baixas comissões e diversificação automática

4️⃣ **Investe regularmente**
   • Técnica DCA (Dollar Cost Averaging)
   • Mesmo valor todos os meses
   • Reduz impacto da volatilidade

💡 **Sugestão inicial:** Começa com €50-100/mês num ETF global.`
      }

      if (matchesAny(q, ["etf", "fundo índice", "exchange traded"])) {
        return `**O que são ETFs?**

📊 **ETF** = Exchange Traded Fund (Fundo negociado em bolsa)

**Como funcionam:**
• Replicam um índice (ex: S&P 500, MSCI World)
• Diversificação instantânea com uma compra
• Negociados como ações na bolsa
• Comissões baixas (0.07% a 0.50%/ano)

**Vantagens:**
✅ Diversificação automática
✅ Custos muito baixos
✅ Fácil de comprar/vender
✅ Transparência

**ETFs populares:**
• **IWDA** - iShares MSCI World (países desenvolvidos)
• **VWCE** - Vanguard FTSE All-World (global)
• **CSPX** - iShares S&P 500 (EUA)

💡 **Para iniciantes:** Um ETF global como VWCE é uma excelente escolha.`
      }

      if (matchesAny(q, ["juros compostos", "compound", "efeito bola de neve"])) {
        return `**O Poder dos Juros Compostos** 📈

A "8ª maravilha do mundo" segundo Einstein!

**Fórmula:** Valor Final = Principal × (1 + taxa)^anos

**Exemplo prático:**
• Investimento: €200/mês
• Retorno: 7% ao ano
• Período: 30 anos

**Resultado:**
• Total investido: €72.000
• Valor final: **€227.000**
• Juros ganhos: **€155.000** 🎉

**A magia está no tempo!**
• 10 anos → €34.500
• 20 anos → €98.600
• 30 anos → €227.000

💡 **Conclusão:** Quanto mais cedo começares, mais os juros compostos trabalham por ti!`
      }

      if (matchesAny(q, ["simula", "simulação", "investir durante"])) {
        // Default simulation parameters, can be enhanced to parse from query
        const monthlyAmount = 200
        const annualReturn = 0.07
        const years = 20

        let total = 0
        for (let i = 0; i < years * 12; i++) {
          total = (total + monthlyAmount) * (1 + annualReturn / 12)
        }
        const invested = monthlyAmount * 12 * years
        const gains = total - invested

        // Format numbers with dots for thousands separator
        const formatNumber = (num: number) => num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")

        return `**Simulação de Investimento:**

📊 **Parâmetros:**
• Valor mensal: €${monthlyAmount}
• Retorno anual: ${(annualReturn * 100).toFixed(0)}%
• Período: ${years} anos

**Resultados:**
• Total investido: €${formatNumber(invested)}
• Valor final: **€${formatNumber(total)}**
• Juros ganhos: **€${formatNumber(gains)}** 🎉

Isso é um retorno de **${((gains / invested) * 100).toFixed(0)}%** sobre o investido!

💡 Quer simular outros valores? Pergunta-me!`
      }

      if (matchesAny(q, ["diversificação", "diversificar", "não colocar ovos"])) {
        return `**Diversificação de Investimentos** 🥚🧺

"Não coloques todos os ovos no mesmo cesto"

**O que é?**
Distribuir investimentos por diferentes ativos para reduzir risco.

**Tipos de diversificação:**

1️⃣ **Por classe de ativos**
   • Ações (maior risco, maior retorno)
   • Obrigações (menor risco, menor retorno)
   • Imobiliário
   • Matérias-primas

2️⃣ **Por geografia**
   • EUA, Europa, Mercados emergentes

3️⃣ **Por setor**
   • Tecnologia, Saúde, Financeiro, etc.

**Portfolio exemplo (moderado):**
• 60% Ações globais (ETF World)
• 30% Obrigações
• 10% Reserva líquida

💡 **Dica:** Um único ETF global já oferece diversificação em 1500+ empresas!`
      }

      if (matchesAny(q, ["inflação", "perder valor", "custo de vida"])) {
        return `**Inflação: O Imposto Invisível** 💸

**O que é?**
Aumento generalizado dos preços, que reduz o poder de compra do dinheiro.

**Impacto real:**
• Inflação média: 2-3%/ano
• €1.000 hoje → €744 em 10 anos (poder de compra)

**Como te proteger:**

1️⃣ **Não deixar dinheiro parado**
   O dinheiro na conta perde valor todos os anos

2️⃣ **Investir em ativos reais**
   • Ações (empresas ajustam preços)
   • Imobiliário
   • Obrigações indexadas à inflação

3️⃣ **Negociar aumentos salariais**
   Pelo menos acompanhar a inflação

**Exemplo:**
• Poupança: €10.000 a 1%/ano = €10.100
• Inflação: 3%
• Perda real: €200/ano 😰

💡 **Conclusão:** Investir é essencial para preservar riqueza!`
      }

      // POUPANÇA
      if (matchesAny(q, ["cortar despesas", "reduzir gastos", "poupar mais", "economizar"])) {
        if (sortedCategories.length === 0) {
          return "Não tenho dados suficientes sobre as tuas despesas. Regista algumas transações primeiro!"
        }

        let response = `**Análise para reduzir despesas:**\n\n`
        response += `📊 **As tuas maiores categorias de gastos:**\n`

        sortedCategories.forEach(([_, data], i) => {
          // Use emojis for visual emphasis on top categories
          const emoji = i === 0 ? "🔴" : i === 1 ? "🟠" : "🟡"
          response += `${emoji} ${data.name}: **€${data.amount.toFixed(2)}**\n`
        })

        response += `\n💡 **Sugestões:**\n`
        response += `• Revê subscrições não utilizadas\n`
        response += `• Compara preços antes de comprar\n`
        response += `• Define um limite mensal por categoria\n`
        response += `• Usa a regra das 48h para compras impulsivas` // Added tip

        return response
      }

      if (matchesAny(q, ["50/30/20", "regra 50", "orçamento"])) {
        // Calculate target amounts based on totalIncome
        const needs = totalIncome * 0.5
        const wants = totalIncome * 0.3
        const savings = totalIncome * 0.2

        return `**Regra 50/30/20 aplicada às tuas finanças:**

📊 Com rendimento de **€${totalIncome.toFixed(2)}**/mês:

**50% Necessidades** - €${needs.toFixed(2)}
• Renda, alimentação, contas, transporte

**30% Desejos** - €${wants.toFixed(2)}
• Lazer, restaurantes, hobbies

**20% Poupança/Investimento** - €${savings.toFixed(2)}
• Fundo emergência, investimentos, metas

**A tua situação atual:**
• Gastas: €${totalExpenses.toFixed(2)} (${totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 0}%)
• Poupas: €${Math.max(balance, 0).toFixed(2)} (${totalIncome > 0 ? ((Math.max(balance, 0) / totalIncome) * 100).toFixed(0) : 0}%)

${balance >= savings ? "✅ Estás a cumprir a meta de 20% de poupança!" : "💡 Tenta aumentar a poupança para atingir os 20%"}`
      }

      if (matchesAny(q, ["fundo de emergência", "emergencia", "reserva", "imprevistos"])) {
        // Calculate recommended amounts based on current monthly expenses (default to 1000 if no expenses found)
        const monthlyExpenses = totalExpenses || 1000
        const recommended3 = monthlyExpenses * 3
        const recommended6 = monthlyExpenses * 6
        // Filter accounts to find only savings accounts
        const savingsAccounts = accounts.filter((a) => a.type === "savings" || a.type === "poupanca")
        // Sum balances of savings accounts
        const currentSavings = savingsAccounts.reduce((acc, a) => acc + (a.balance || 0), 0)
        // Calculate how many months of expenses are covered by current savings
        const monthsCovered = currentSavings / monthlyExpenses

        return `**Fundo de Emergência** 🛡️

**O que é?**
Reserva líquida para imprevistos (perda emprego, doença, reparações).

**Quanto deves ter?**
• Mínimo: 3 meses de despesas = **€${recommended3.toFixed(2)}**
• Ideal: 6 meses de despesas = **€${recommended6.toFixed(2)}**

**A tua situação:**
• Despesas mensais: €${monthlyExpenses.toFixed(2)}
• Poupança atual: €${currentSavings.toFixed(2)}
• Cobertura: **${monthsCovered.toFixed(1)} meses** ${monthsCovered >= 6 ? "✅" : monthsCovered >= 3 ? "🟡" : "🔴"}

**Onde guardar?**
• Conta poupança separada
• Depósitos a prazo com liquidez
• Certificados de Aforro

💡 **Dica:** Automatiza uma transferência mensal para esta reserva!`
      }

      // AJUDA APP
      if (matchesAny(q, ["o que podes", "ajuda", "consegues fazer", "funcionalidades"])) {
        return `**O que posso fazer por ti:** 🤖

📊 **Análise Financeira**
• Ver saldo total e por conta
• Analisar despesas por categoria
• Comparar receitas vs despesas

🎯 **Gestão de Metas**
• Ver progresso das metas
• Sugerir qual priorizar
• Calcular quanto poupar

📈 **Educação Financeira**
• Explicar juros compostos
• Ensinar sobre ETFs e ações
• Dicas de poupança

🔮 **Simulações**
• Simular investimentos
• Calcular tempo para metas
• Projetar cenários

💡 **Sugestões**
• Onde cortar despesas
• Como aplicar regras de orçamento
• Melhores práticas financeiras

Experimenta perguntar algo específico!`
      }

      if (matchesAny(q, ["adicionar transação", "nova transação", "registar"])) {
        return `**Como adicionar uma transação:**

1️⃣ Clica no botão **"+ Nova Transação"** no menu lateral

2️⃣ Preenche os campos:
   • Tipo: Receita ou Despesa
   • Valor
   • Categoria
   • Descrição
   • Data
   • Conta

3️⃣ Opcional: Marca como **recorrente** para transações fixas

4️⃣ Clica em **Guardar**

💡 **Dica:** Usa categorias consistentes para melhor análise!`
      }

      if (matchesAny(q, ["automação", "automações", "regras automáticas"])) {
        return `**Como funcionam as Automações:**

🤖 **O que são?**
Regras que executam ações automaticamente quando certas condições são cumpridas.

**Exemplos de automações:**
• Transferir 20% do salário para poupança quando receber
• Adicionar a uma meta quando receber bónus
• Alertar quando uma categoria ultrapassar orçamento

**Como criar:**
1. Vai a "Automações" no menu
2. Clica em "Nova Regra"
3. Define o gatilho (ex: receber salário)
4. Define a ação (ex: transferir para meta)
5. Ativa a regra

💡 **Sugestão:** Automatiza a poupança para não depender de força de vontade!`
      }

      // SAUDAÇÕES E CONVERSAÇÃO
      if (matchesAny(q, ["olá", "ola", "oi", "bom dia", "boa tarde", "boa noite", "hey", "hello"])) {
        return `Olá! 👋 Como posso ajudar-te hoje com as tuas finanças?

Podes perguntar-me sobre:
• O teu saldo e despesas
• As tuas metas financeiras
• Dicas de poupança e investimento
• Conceitos financeiros

Ou escolhe um dos temas nos botões acima!`
      }

      if (matchesAny(q, ["obrigado", "obrigada", "thanks", "valeu"])) {
        return `De nada! 😊 Fico feliz em ajudar.

Se tiveres mais alguma dúvida sobre as tuas finanças, é só perguntar!`
      }

      if (matchesAny(q, ["adeus", "tchau", "até", "bye"])) {
        return `Até à próxima! 👋 

Lembra-te: pequenos passos consistentes levam a grandes resultados financeiros. Boas finanças!`
      }

      // DEFAULT
      return `Hmm, não tenho certeza sobre isso. 🤔

Posso ajudar-te com:
• **Saldo e despesas** - "Quanto gastei este mês?"
• **Metas** - "Como estão as minhas metas?"
• **Investimentos** - "Como começar a investir?"
• **Poupança** - "Onde posso cortar despesas?"
• **Educação** - "O que são juros compostos?"

Ou escolhe um tema nos botões acima!`
    },
    [transactions, accounts, goals, categories, getCategoryName], // Dependencies for useCallback
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return // Prevent submission if input is empty or loading

    const userMessage: Message = {
      id: `user-${Date.now()}`, // Unique ID for user message
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input // Store input value before clearing
    setInput("") // Clear input field
    setIsLoading(true) // Set loading state

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateIntelligentResponse(currentInput) // Generate response based on user input
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`, // Unique ID for assistant message
        role: "assistant",
        content: response,
      }
      setMessages((prev) => [...prev, assistantMessage]) // Add assistant message to state
      setIsLoading(false) // Reset loading state
    }, 500) // Delay of 500ms
  }

  // Function to handle quick questions from dropdown
  const handleQuickQuestion = (question: string) => {
    setInput(question) // Set input field value
    // Simulate form submission for the quick question
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    setTimeout(() => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: question,
      }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      setTimeout(() => {
        const response = generateIntelligentResponse(question)
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response,
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 500)
    }, 100)
  }

  // Refactored message rendering for better HTML handling
  const formatMessage = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Handle bold text: Replace **text** with <strong>text</strong>
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')

      // Handle bullet points: Check for lines starting with '• '
      if (line.startsWith("• ")) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-primary">•</span>
            <span dangerouslySetInnerHTML={{ __html: line.substring(2) }} />
          </div>
        )
      }

      // Handle numbered items: Check for lines starting with a number followed by '.' or '️⃣'
      const numMatch = line.match(/^(\d+)[.️⃣]\s*/)
      if (numMatch) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-primary font-medium">{numMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: line.substring(numMatch[0].length) }} />
          </div>
        )
      }

      // Handle empty lines: Render a small vertical space
      if (line.trim() === "") {
        return <div key={i} className="h-2" />
      }

      // Regular lines: Render as is, using dangerouslySetInnerHTML for HTML content
      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
    })
  }

  // Simplified topic configuration for quick actions
  const topicConfig = {
    saldo: { icon: Wallet, label: "Saldo", color: "text-emerald-600" },
    metas: { icon: Target, label: "Metas", color: "text-purple-600" },
    investir: { icon: TrendingUp, label: "Investir", color: "text-blue-600" },
    poupar: { icon: Lightbulb, label: "Poupar", color: "text-amber-600" },
    aprender: { icon: GraduationCap, label: "Aprender", color: "text-pink-600" },
    ajuda: { icon: HelpCircle, label: "Ajuda", color: "text-slate-600" },
  }

  return (
    // Adjusted container styling for a more compact chat window
    <div className="flex flex-col h-[500px] w-[340px] bg-background border rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" /> {/* Use Bot icon */}
          </div>
          <div>
            <h3 className="font-semibold text-sm">CashBot</h3>
            <p className="text-xs text-muted-foreground">Assistente Financeiro IA</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Topic Buttons */}
      <div className="p-2 border-b bg-muted/30">
        <div className="grid grid-cols-3 gap-1.5">
          {/* Iterate over topicConfig to create buttons */}
          {(Object.keys(topicConfig) as Array<keyof typeof topicConfig>).map((topic) => {
            const config = topicConfig[topic]
            const Icon = config.icon
            return (
              <DropdownMenu key={topic}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs gap-1 justify-between px-2 bg-transparent">
                    <div className="flex items-center gap-1">
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      <span>{config.label}</span>
                    </div>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {/* Render questions for the selected topic */}
                  {topicQuestions[topic].map((question, i) => (
                    <DropdownMenuItem
                      key={i}
                      onClick={() => handleQuickQuestion(question)} // Use handler for quick questions
                      className="text-xs cursor-pointer"
                    >
                      {question}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="space-y-1">{formatMessage(message.content)}</div> // Use formatted message for assistant
              ) : (
                message.content // Plain text for user messages
              )}
            </div>
            {message.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-muted rounded-xl px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> {/* Loading indicator */}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-muted/30">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunta-me qualquer coisa sobre finanças"
            className="flex-1 text-sm h-9"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading || !input.trim()}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          CashBot analisa os teus dados financeiros reais para respostas personalizadas.
        </p>
      </div>
    </div>
  )
}
