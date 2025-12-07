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
  RefreshCw,
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
    "Simula investir 200€/mês durante 20 anos a 7%",
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
• **Calcular** juros compostos e poupanças
• **Sugerir** onde cortar despesas
• **Planear** como atingir metas mais rápido
• **Ensinar** conceitos de investimento

Escolhe um tema acima ou pergunta-me qualquer coisa!`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0)
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)

  const { transactions, accounts, goals, categories } = useFinance()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id)
      }
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

  // Generate response based on user data and question
  const generateResponse = useCallback(
    (question: string): string => {
      const q = question.toLowerCase()

      // Calculate financial data
      const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0)
      const savingsAccounts = accounts.filter((a) => a.type === "savings" || a.type === "poupanca")
      const investmentAccounts = accounts.filter((a) => a.type === "investment" || a.type === "investimento")
      const totalSavings = savingsAccounts.reduce((acc, a) => acc + (a.balance || 0), 0)
      const totalInvestments = investmentAccounts.reduce((acc, a) => acc + (a.balance || 0), 0)

      const now = new Date()
      const thisMonthTrans = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })

      const monthlyIncomeValue = thisMonthTrans.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
      const monthlyExpensesValue = thisMonthTrans
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0)

      setMonthlyExpenses(monthlyExpensesValue)
      setMonthlyIncome(monthlyIncomeValue)

      // Group expenses by category
      const expensesByCategory: Record<string, number> = {}
      thisMonthTrans
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const cat = t.category || "Outros"
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount
        })
      const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)

      // Saldo questions
      if (q.includes("saldo") && (q.includes("total") || q.includes("atual"))) {
        return `**Resumo do teu património:**

• **Saldo Total:** €${totalBalance.toFixed(2)}
• **Poupanças:** €${totalSavings.toFixed(2)}
• **Investimentos:** €${totalInvestments.toFixed(2)}

**Contas:**
${accounts.map((a) => `• ${a.name}: €${(a.balance || 0).toFixed(2)}`).join("\n")}

${totalSavings > totalInvestments ? "Tens mais em poupanças do que investimentos. Considera diversificar!" : "Boa distribuição entre poupanças e investimentos!"}`
      }

      if (q.includes("cada conta") || q.includes("quanto tenho")) {
        return `**Saldo de cada conta:**

${accounts.map((a) => `• **${a.name}** (${a.type}): €${(a.balance || 0).toFixed(2)}`).join("\n")}

**Total:** €${totalBalance.toFixed(2)}`
      }

      if (q.includes("gastei") && q.includes("mês")) {
        return `**Gastos deste mês:**

• **Total de despesas:** €${monthlyExpenses.toFixed(2)}
• **Total de receitas:** €${monthlyIncome.toFixed(2)}
• **Balanço:** €${(monthlyIncome - monthlyExpenses).toFixed(2)}

**Por categoria:**
${sortedCategories
  .slice(0, 5)
  .map(([cat, val]) => `• ${cat}: €${val.toFixed(2)}`)
  .join("\n")}

${monthlyExpenses > monthlyIncome ? "⚠️ Atenção: Estás a gastar mais do que ganhas este mês!" : "✅ Estás dentro do orçamento!"}`
      }

      if (q.includes("maior despesa")) {
        const biggestExpense = thisMonthTrans.filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount)[0]
        if (biggestExpense) {
          return `**Maior despesa recente:**

• **Descrição:** ${biggestExpense.description}
• **Valor:** €${biggestExpense.amount.toFixed(2)}
• **Categoria:** ${biggestExpense.category || "Não categorizada"}
• **Data:** ${new Date(biggestExpense.date).toLocaleDateString("pt-PT")}

${biggestExpense.amount > monthlyIncome * 0.3 ? "Esta despesa representa mais de 30% do teu rendimento mensal. Considera se foi essencial." : ""}`
        }
        return "Não encontrei despesas registadas este mês."
      }

      if (q.includes("gastar mais") || q.includes("mais do que ganho")) {
        const balance = monthlyIncome - monthlyExpenses
        const savingsRate = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0

        return `**Análise Receitas vs Despesas:**

• **Receitas:** €${monthlyIncome.toFixed(2)}
• **Despesas:** €${monthlyExpenses.toFixed(2)}
• **Diferença:** €${balance.toFixed(2)}
• **Taxa de poupança:** ${savingsRate.toFixed(1)}%

${
  balance < 0
    ? `⚠️ **Sim, estás a gastar mais do que ganhas!**

Sugestões:
1. Revê as despesas por categoria
2. Identifica gastos não essenciais
3. Define um orçamento por categoria`
    : `✅ **Não, estás a poupar ${savingsRate.toFixed(1)}% do rendimento!**

${savingsRate >= 20 ? "Excelente! Estás acima da recomendação de 20%." : "Tenta aumentar para pelo menos 20% para atingir metas mais rápido."}`
}`
      }

      // Metas questions
      if (q.includes("metas") && (q.includes("como estão") || q.includes("financeiras"))) {
        if (goals.length === 0) {
          return "Ainda não tens metas definidas. Cria uma meta na secção de Metas para começar a acompanhar os teus objetivos!"
        }

        return `**Estado das tuas metas:**

${goals
  .map((g) => {
    const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
    const remaining = g.target_amount - g.current_amount
    return `• **${g.name}**
  Progresso: ${progress.toFixed(1)}% (€${g.current_amount.toFixed(2)} / €${g.target_amount.toFixed(2)})
  Faltam: €${remaining.toFixed(2)}`
  })
  .join("\n\n")}

${goals.some((g) => g.current_amount / g.target_amount >= 0.8) ? "🎉 Tens metas quase concluídas! Continua assim!" : ""}`
      }

      if (q.includes("falta") && q.includes("meta")) {
        if (goals.length === 0) {
          return "Não tens metas definidas. Cria uma para acompanhar os teus objetivos!"
        }

        return `**Quanto falta para cada meta:**

${goals
  .map((g) => {
    const remaining = g.target_amount - g.current_amount
    const monthsNeeded =
      monthlyIncome > monthlyExpenses ? Math.ceil(remaining / (monthlyIncome - monthlyExpenses)) : "∞"
    return `• **${g.name}:** €${remaining.toFixed(2)}
  ${typeof monthsNeeded === "number" ? `(~${monthsNeeded} meses ao ritmo atual)` : "(precisas poupar mais)"}`
  })
  .join("\n\n")}`
      }

      if (q.includes("priorizar") || q.includes("qual meta")) {
        if (goals.length === 0) {
          return "Cria algumas metas primeiro para eu poder aconselhar qual priorizar!"
        }

        const sortedGoals = [...goals].sort((a, b) => {
          const progressA = a.current_amount / a.target_amount
          const progressB = b.current_amount / b.target_amount
          return progressB - progressA
        })

        const nearestGoal = sortedGoals[0]
        const progress = (nearestGoal.current_amount / nearestGoal.target_amount) * 100

        return `**Recomendação de priorização:**

1. **${nearestGoal.name}** - Está a ${progress.toFixed(0)}%, mais perto de concluir!

**Estratégia sugerida:**
• Foca 70% das poupanças na meta mais próxima
• Distribui 30% pelas outras metas
• Assim celebras vitórias mais cedo e manténs motivação!`
      }

      // Investir questions
      if (q.includes("começar") && q.includes("investir")) {
        return `**Como começar a investir:**

1. **Fundo de emergência primeiro**
   Garante 3-6 meses de despesas em poupança (€${(monthlyExpenses * 3).toFixed(2)} - €${(monthlyExpenses * 6).toFixed(2)})

2. **Define quanto investir**
   Idealmente 10-20% do rendimento (€${(monthlyIncome * 0.1).toFixed(2)} - €${(monthlyIncome * 0.2).toFixed(2)}/mês)

3. **Começa com ETFs globais**
   Diversificação automática e baixas comissões

4. **Investe regularmente**
   Mesmo valor todo mês (DCA - Dollar Cost Average)

5. **Pensa a longo prazo**
   Mínimo 5-10 anos para reduzir risco

${totalSavings >= monthlyExpenses * 3 ? "✅ Já tens fundo de emergência! Podes começar a investir." : `⚠️ Primeiro, aumenta a poupança para €${(monthlyExpenses * 3).toFixed(2)} (3 meses de despesas).`}`
      }

      if (q.includes("etf")) {
        return `**O que são ETFs:**

ETF = Exchange Traded Fund (Fundo Negociado em Bolsa)

**Vantagens:**
• Diversificação automática (centenas de empresas num só produto)
• Custos muito baixos (0.1-0.5% ao ano)
• Fácil de comprar/vender
• Ideal para iniciantes

**ETFs recomendados para portugueses:**
• **IWDA** - Mercados desenvolvidos mundiais
• **VWCE** - Mundo todo (desenvolvidos + emergentes)
• **SXR8** - S&P 500 (500 maiores empresas EUA)

**Como funcionam:**
1. Compras uma "fatia" do ETF
2. O ETF compra ações das empresas por ti
3. O teu dinheiro cresce com o mercado

**Exemplo com €200/mês a 7% durante 20 anos:**
• Total investido: €48.000
• Valor final estimado: ~€104.000
• Ganho: ~€56.000 em juros compostos!`
      }

      if (q.includes("simula") || q.includes("juros compostos")) {
        // Parse numbers from question or use defaults
        const monthlyAmount = 200
        const years = 20
        const rate = 0.07

        const months = years * 12
        const monthlyRate = rate / 12
        const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
        const totalInvested = monthlyAmount * months
        const gains = futureValue - totalInvested

        return `**Simulação de Investimento:**

• **Investimento mensal:** €${monthlyAmount}
• **Período:** ${years} anos
• **Retorno anual estimado:** ${rate * 100}%

**Resultado:**
• Total investido: €${totalInvested.toFixed(2)}
• Valor final: €${futureValue.toFixed(2)}
• **Ganho com juros compostos:** €${gains.toFixed(2)}

O teu dinheiro mais que duplicou graças aos juros compostos!

**Como funcionam juros compostos:**
Os ganhos de cada ano geram mais ganhos no ano seguinte. É como uma bola de neve que cresce exponencialmente.`
      }

      // Poupar questions
      if (q.includes("cortar") || q.includes("eliminar") || q.includes("despesas")) {
        if (sortedCategories.length === 0) {
          return "Não encontrei despesas este mês para analisar. Adiciona algumas transações primeiro!"
        }

        const topCategory = sortedCategories[0]

        return `**Análise de despesas para cortar:**

**Maiores categorias de gastos:**
${sortedCategories
  .slice(0, 5)
  .map(([cat, val], i) => `${i + 1}. ${cat}: €${val.toFixed(2)} (${((val / monthlyExpenses) * 100).toFixed(1)}%)`)
  .join("\n")}

**Sugestões:**
${topCategory[1] > monthlyExpenses * 0.3 ? `• **${topCategory[0]}** representa ${((topCategory[1] / monthlyExpenses) * 100).toFixed(0)}% das despesas. Tenta reduzir 10-20%.` : ""}
• Revê subscrições e serviços não utilizados
• Compara preços antes de compras grandes
• Define um "dia sem gastos" por semana

**Potencial de poupança:**
Se reduzires 10% em cada categoria, poupas €${(monthlyExpenses * 0.1).toFixed(2)}/mês ou €${(monthlyExpenses * 0.1 * 12).toFixed(2)}/ano!`
      }

      if (q.includes("50/30/20") || q.includes("regra")) {
        const needs = monthlyIncome * 0.5
        const wants = monthlyIncome * 0.3
        const savings = monthlyIncome * 0.2

        return `**Regra 50/30/20 para ti:**

Com rendimento de €${monthlyIncome.toFixed(2)}/mês:

• **50% Necessidades:** €${needs.toFixed(2)}
  (renda, contas, alimentação essencial, transportes)

• **30% Desejos:** €${wants.toFixed(2)}
  (restaurantes, entretenimento, compras não essenciais)

• **20% Poupança/Investimento:** €${savings.toFixed(2)}
  (fundo emergência, metas, investimentos)

**Comparação com a realidade:**
• Gastas: €${monthlyExpenses.toFixed(2)} (${((monthlyExpenses / monthlyIncome) * 100).toFixed(0)}%)
• Poupas: €${(monthlyIncome - monthlyExpenses).toFixed(2)} (${(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(0)}%)

${(monthlyIncome - monthlyExpenses) >= savings ? "✅ Estás a cumprir a regra!" : `⚠️ Devias poupar mais €${(savings - (monthlyIncome - monthlyExpenses)).toFixed(2)}/mês para atingir os 20%.`}`
      }

      if (q.includes("fundo de emergência") || q.includes("emergência")) {
        const recommended = monthlyExpenses * 6

        return `**Fundo de Emergência:**

**O que é:**
Reserva financeira para imprevistos (perda de emprego, doença, reparações urgentes).

**Quanto ter:**
• Mínimo: 3 meses de despesas = €${(monthlyExpenses * 3).toFixed(2)}
• Ideal: 6 meses de despesas = €${(monthlyExpenses * 6).toFixed(2)}

**O teu estado:**
• Poupanças atuais: €${totalSavings.toFixed(2)}
• ${totalSavings >= recommended ? `✅ Tens ${(totalSavings / monthlyExpenses).toFixed(1)} meses de reserva. Excelente!` : `⚠️ Faltam €${(recommended - totalSavings).toFixed(2)} para 6 meses de reserva.`}

**Onde guardar:**
• Conta poupança com acesso imediato
• Nunca investir o fundo de emergência
• Separado das outras poupanças`
      }

      // Aprender questions
      if (q.includes("diversificação")) {
        return `**Diversificação explicada:**

**O que é:**
Não pôr todos os ovos no mesmo cesto. Distribuir investimentos por diferentes ativos para reduzir risco.

**Tipos de diversificação:**
1. **Por classe de ativos**
   Ações, obrigações, imobiliário, ouro

2. **Por geografia**
   Europa, EUA, Ásia, mercados emergentes

3. **Por setor**
   Tecnologia, saúde, energia, consumo

**Exemplo prático:**
Em vez de comprar só ações da Apple:
• 60% ETF global (VWCE)
• 20% Obrigações (segurança)
• 20% Imobiliário/Ouro (proteção inflação)

**Benefício:**
Se um setor cai, outros compensam. Reduces volatilidade sem sacrificar muito retorno.`
      }

      if (q.includes("inflação")) {
        return `**Inflação explicada:**

**O que é:**
Aumento geral dos preços ao longo do tempo. O teu dinheiro perde poder de compra.

**Exemplo:**
€100 hoje com inflação de 3%/ano:
• Daqui a 10 anos = poder de compra de €74
• Daqui a 20 anos = poder de compra de €55

**Como te proteger:**
1. **Investir** - Retornos acima da inflação
2. **Evitar cash parado** - Dinheiro em conta perde valor
3. **Imobiliário** - Rendas sobem com inflação
4. **Ações** - Empresas aumentam preços
5. **ETFs de inflação** - Obrigações indexadas

**Taxas importantes:**
• Inflação Portugal ~3%/ano
• Conta poupança ~1%/ano = perdes 2%/ano
• ETF global ~7%/ano = ganhas 4%/ano real`
      }

      if (q.includes("poupar") && q.includes("investir") && q.includes("diferença")) {
        return `**Poupar vs Investir:**

**Poupar:**
• Guardar dinheiro em local seguro
• Retorno baixo (0-2%/ano)
• Sem risco de perda
• Acesso imediato
• Ideal para: emergências, curto prazo

**Investir:**
• Aplicar dinheiro em ativos
• Retorno potencial alto (5-10%/ano)
• Risco de perdas temporárias
• Menos liquidez
• Ideal para: longo prazo (5+ anos)

**Quando cada um:**
| Objetivo | Prazo | Escolha |
|----------|-------|---------|
| Emergência | - | Poupar |
| Férias | <1 ano | Poupar |
| Carro | 2-3 anos | 50/50 |
| Casa | 5+ anos | Investir |
| Reforma | 20+ anos | Investir |

**Regra geral:**
Primeiro poupa (fundo emergência), depois investe (resto).`
      }

      // Ajuda questions
      if (q.includes("o que podes fazer") || q.includes("ajudar")) {
        return `**O que posso fazer por ti:**

**Análise Financeira:**
• Ver saldos e património total
• Analisar despesas por categoria
• Comparar receitas vs despesas
• Identificar padrões de gastos

**Planeamento:**
• Criar planos de poupança
• Sugerir cortes de despesas
• Calcular tempos para metas
• Aplicar regra 50/30/20

**Educação:**
• Explicar juros compostos
• Ensinar sobre ETFs e investimentos
• Conceitos como diversificação e inflação

**Simulações:**
• Calcular investimentos futuros
• Projetar crescimento de poupanças

Pergunta-me o que quiseres sobre finanças!`
      }

      if (q.includes("transação") || q.includes("adiciono")) {
        return `**Como adicionar uma transação:**

1. Clica no botão **"+ Nova Transação"** na barra lateral
2. Preenche os campos:
   • Tipo (Receita/Despesa/Transferência)
   • Valor
   • Descrição
   • Categoria
   • Conta
   • Data
3. Clica em **"Guardar"**

**Dica:** Podes também configurar transações recorrentes em "Recorrentes" para salário, rendas, etc.`
      }

      if (q.includes("automação") || q.includes("automações")) {
        return `**Como funcionam as automações:**

As automações executam ações automaticamente quando certas condições são cumpridas.

**Exemplos:**
• Transferir 10% do salário para poupança
• Alertar quando gastos excedem orçamento
• Contribuir para metas automaticamente

**Como criar:**
1. Vai a **"Automações"** no menu
2. Clica em **"+ Nova Automação"**
3. Define o trigger (quando executar)
4. Define a ação (o que fazer)
5. Ativa a automação

É uma forma excelente de poupar sem pensar!`
      }

      if (q.includes("metas") && q.includes("funcionam")) {
        return `**Como funcionam as metas:**

1. **Criar uma meta** na secção "Metas"
   • Nome (ex: "Férias", "Carro novo")
   • Valor objetivo
   • Data limite (opcional)

2. **Adicionar dinheiro**
   • Transferir de uma conta para a meta
   • Usar automações para contribuições automáticas

3. **Acompanhar progresso**
   • Barra de progresso visual
   • Estimativa de conclusão
   • Histórico de contribuições

**Dica:** Metas com imagens e nomes concretos motivam mais!`
      }

      // Default response
      return `Obrigado pela tua pergunta! 

Posso ajudar-te com:
• **Análise financeira** - Saldo, despesas, receitas
• **Metas** - Progresso e estratégias
• **Investimentos** - ETFs, juros compostos
• **Poupança** - Onde cortar, regra 50/30/20
• **Educação** - Conceitos financeiros

Tenta ser mais específico na tua pergunta, por exemplo:
• "Qual é o meu saldo total?"
• "Onde posso cortar despesas?"
• "O que são ETFs?"`
    },
    [accounts, transactions, goals, monthlyExpenses, monthlyIncome],
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

      // Generate response locally based on user's data
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
        500 + Math.random() * 500,
      ) // Small delay for natural feel
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
    return text.split("\n").map((line, i) => {
      // Handle bullet points
      if (line.startsWith("• ") || line.startsWith("- ")) {
        const content = line.slice(2)
        return (
          <p key={i} className="mb-1 last:mb-0 pl-2 flex gap-2">
            <span className="text-primary">•</span>
            <span>{content.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}</span>
          </p>
        )
      }
      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={i} className="mb-1 last:mb-0 pl-2">
            {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
          </p>
        )
      }
      // Handle headers
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="font-semibold mb-2 mt-3 first:mt-0">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      }
      // Regular paragraph
      return (
        <p key={i} className="mb-1 last:mb-0">
          {line.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
        </p>
      )
    })
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
          {error && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setError(null)}
              className="rounded-xl"
              title="Limpar erro"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted rounded-bl-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">A analisar...</span>
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
          CashBot analisa os teus dados financeiros para dar respostas personalizadas.
        </p>
      </div>
    </div>
  )
}

export default AIChatbot
