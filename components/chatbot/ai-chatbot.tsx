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
    "Como está o meu fluxo de caixa?",
    "Quanto recebi este mês?",
    "Qual o balanço entre receitas e despesas?",
    "Mostra-me um resumo financeiro",
    "Qual a minha situação financeira atual?",
  ],
  metas: [
    "Como estão as minhas metas financeiras?",
    "Quanto falta para atingir cada meta?",
    "Qual meta devo priorizar?",
    "Como posso atingir as metas mais rápido?",
    "Devo criar uma nova meta de poupança?",
    "Quanto preciso poupar por mês para cada meta?",
    "Qual meta está mais próxima de ser atingida?",
    "Analisa o progresso das minhas metas",
    "Que metas tenho definidas?",
    "Como criar uma boa meta financeira?",
  ],
  investir: [
    "Por onde devo começar a investir?",
    "O que são ETFs e como funcionam?",
    "Quanto do meu salário devo investir?",
    "Qual a diferença entre ações e fundos?",
    "Simula investir 200 euros por mês durante 20 anos",
    "O que é diversificação de carteira?",
    "Quais os melhores investimentos para iniciantes?",
    "Como funciona o mercado de ações?",
    "O que são obrigações?",
    "Como calcular o retorno de investimentos?",
  ],
  poupar: [
    "Onde posso cortar despesas?",
    "Como aplicar a regra 50/30/20?",
    "Quanto devo ter em fundo de emergência?",
    "Quais despesas posso eliminar?",
    "Analisa as minhas despesas por categoria",
    "Dicas para poupar mais dinheiro",
    "Como reduzir gastos mensais?",
    "Estou a poupar o suficiente?",
    "Quais são as minhas maiores categorias de gastos?",
    "Como criar um orçamento mensal?",
  ],
  aprender: [
    "O que são juros compostos?",
    "Como funciona a diversificação?",
    "O que é inflação e como me protejo?",
    "Qual a diferença entre poupar e investir?",
    "O que é um fundo de emergência?",
    "Como funciona o IRS em Portugal?",
    "O que são obrigações vs ações?",
    "Como calcular o retorno de investimentos?",
    "O que é o FIRE (independência financeira)?",
    "Como funciona a capitalização?",
  ],
  ajuda: [
    "O que podes fazer por mim?",
    "Como adiciono uma transação?",
    "Como crio uma automação?",
    "Como funcionam as metas?",
    "Como exporto os meus dados?",
    "Como edito uma transação?",
    "Como funciona a previsão?",
    "Como configuro categorias?",
    "Como funciona a secção de relatórios?",
    "Como transfiro dinheiro entre contas?",
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

  const { transactions, accounts, goals, categories } = useFinance()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const getCategoryName = useCallback(
    (categoryId: string): string => {
      if (!categoryId) return "Outros"
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

      const expensesByCategory: Record<string, { amount: number; name: string }> = {}
      thisMonthTransactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const catId = t.category || "outros"
          const catName = getCategoryName(catId)
          if (!expensesByCategory[catId]) {
            expensesByCategory[catId] = { amount: 0, name: catName }
          }
          expensesByCategory[catId].amount += t.amount
        })

      const sortedCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b.amount - a.amount)
        .slice(0, 5)

      // PREVISÃO - NEW
      if (matchesAny(q, ["previsão", "previsao", "prever", "projeção", "futuro", "forecast"])) {
        const avgMonthlyExpenses = totalExpenses || 1000
        const avgMonthlyIncome = totalIncome || 2000
        const projectedSavings = (avgMonthlyIncome - avgMonthlyExpenses) * 12

        return `**Como funciona a Previsão Financeira:**

A secção de Previsão analisa os teus padrões históricos para projetar:

**O que calculamos:**
• Despesas projetadas para os próximos meses
• Receitas esperadas baseadas no histórico
• Evolução provável do teu património

**Com base nos teus dados atuais:**
• Receitas médias: **€${avgMonthlyIncome.toFixed(2)}**/mês
• Despesas médias: **€${avgMonthlyExpenses.toFixed(2)}**/mês
• Poupança projetada (12 meses): **€${projectedSavings.toFixed(2)}**

**Dica:** Quanto mais transações registares, mais precisas serão as previsões!`
      }

      // EDITAR TRANSAÇÃO - NEW
      if (
        matchesAny(q, [
          "editar transação",
          "edito transação",
          "editar transacao",
          "modificar transação",
          "alterar transação",
          "corrigir transação",
        ])
      ) {
        return `**Como editar uma transação:**

1. Vai à secção **"Histórico"** no menu lateral

2. Encontra a transação que queres editar

3. Clica nos **três pontos** (⋮) à direita da transação

4. Seleciona **"Editar"**

5. Modifica os campos desejados:
   • Valor
   • Categoria
   • Descrição
   • Data
   • Conta

6. Clica em **"Guardar"**

**Dica:** Também podes eliminar transações no mesmo menu se foram registadas por engano.`
      }

      // RELATÓRIOS - NEW
      if (matchesAny(q, ["relatórios", "relatorios", "relatório", "relatorio", "reports", "análise detalhada"])) {
        return `**Como funciona a secção de Relatórios:**

Os Relatórios oferecem uma análise detalhada das tuas finanças:

**Separadores disponíveis:**

1. **Geral** - Visão anual de receitas vs despesas
   • Gráfico mensal comparativo
   • Resumo do património total

2. **Tendências** - Evolução dos últimos 6 meses
   • Padrões de gastos
   • Variação do saldo líquido

3. **Categorias** - Onde gastas o dinheiro
   • Distribuição por categoria
   • Percentagens de cada área

4. **Detalhes** - Informação específica
   • Top 5 maiores despesas
   • Progresso das metas

**Dica:** Usa o seletor de período para analisar diferentes intervalos de tempo!`
      }

      // TRANSFERIR - NEW
      if (matchesAny(q, ["transferir", "transferência", "transferencia", "mover dinheiro", "entre contas"])) {
        return `**Como fazer uma transferência entre contas:**

1. Clica no botão **"Transferir"** na secção "As Minhas Contas"

2. Seleciona a **conta de origem**

3. Seleciona a **conta de destino**

4. Introduz o **valor** a transferir

5. Adiciona uma **descrição** (opcional)

6. Clica em **"Confirmar Transferência"**

**Notas:**
• A transferência atualiza automaticamente os saldos
• É registada no histórico de ambas as contas
• Podes transferir entre qualquer tipo de conta`
      }

      // CATEGORIAS - NEW
      if (
        matchesAny(q, [
          "configurar categorias",
          "config categoria",
          "criar categoria",
          "categorias personalizadas",
          "gerir categorias",
        ])
      ) {
        return `**Como gerir as categorias:**

As categorias ajudam a organizar as tuas transações.

**Categorias padrão incluídas:**
• Alimentação, Transporte, Habitação
• Lazer, Saúde, Educação
• Salário, Freelance, Investimentos

**Para adicionar categoria personalizada:**
1. Vai às **Definições** (ícone de engrenagem)
2. Seleciona **"Categorias"**
3. Clica em **"Nova Categoria"**
4. Define nome, ícone e cor
5. Guarda as alterações

**Dica:** Categorias bem definidas melhoram a análise dos teus gastos!`
      }

      // FIRE - NEW
      if (matchesAny(q, ["fire", "independência financeira", "reforma antecipada", "liberdade financeira"])) {
        return `**FIRE - Financial Independence, Retire Early**

**O que é?**
Movimento que visa atingir independência financeira para deixar de depender de um emprego.

**A matemática do FIRE:**
• Precisas de 25x as tuas despesas anuais investidas
• A "regra dos 4%" permite retirar 4%/ano sem esgotar

**Exemplo:**
• Despesas: €2.000/mês = €24.000/ano
• Objetivo FIRE: €24.000 × 25 = **€600.000**

**Os teus números:**
• Despesas atuais: €${totalExpenses.toFixed(2)}/mês
• Objetivo FIRE estimado: **€${(totalExpenses * 12 * 25).toFixed(2)}**
• Património atual: €${totalBalance.toFixed(2)}
• Progresso: ${totalBalance > 0 && totalExpenses > 0 ? ((totalBalance / (totalExpenses * 12 * 25)) * 100).toFixed(1) : 0}%

**Tipos de FIRE:**
• **Lean FIRE** - Estilo de vida minimalista
• **Fat FIRE** - Manter estilo de vida atual
• **Barista FIRE** - Semi-reforma com trabalho part-time`
      }

      // ORÇAMENTO - NEW
      if (matchesAny(q, ["orçamento", "orcamento", "criar orçamento", "budget", "planear gastos"])) {
        const needs = totalIncome * 0.5
        const wants = totalIncome * 0.3
        const savings = totalIncome * 0.2

        return `**Como criar um orçamento mensal:**

**Passo 1: Conhece os teus números**
• Rendimento atual: €${totalIncome.toFixed(2)}
• Despesas atuais: €${totalExpenses.toFixed(2)}

**Passo 2: Aplica a regra 50/30/20**
• **50% Necessidades:** €${needs.toFixed(2)}
  (Renda, contas, alimentação, transporte)
• **30% Desejos:** €${wants.toFixed(2)}
  (Lazer, restaurantes, hobbies)
• **20% Poupança:** €${savings.toFixed(2)}
  (Emergência, investimentos, metas)

**Passo 3: Monitoriza semanalmente**
• Revê os gastos a cada semana
• Ajusta se necessário

**Passo 4: Usa o CashBoard**
• Regista todas as transações
• Analisa os relatórios
• Define alertas de orçamento

**A tua taxa de poupança atual:** ${totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : 0}%`
      }

      // RESUMO FINANCEIRO - NEW
      if (matchesAny(q, ["resumo", "situação financeira", "visão geral", "como estou"])) {
        let response = `**Resumo da tua situação financeira:**\n\n`
        response += `**Património Total:** €${totalBalance.toFixed(2)}\n\n`
        response += `**Este mês (${now.toLocaleString("pt-PT", { month: "long" })}):**\n`
        response += `• Receitas: €${totalIncome.toFixed(2)}\n`
        response += `• Despesas: €${totalExpenses.toFixed(2)}\n`
        response += `• Saldo: €${balance.toFixed(2)} ${balance >= 0 ? "✓" : "!"}\n\n`

        const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
        response += `**Taxa de poupança:** ${savingsRate.toFixed(0)}%\n`
        response +=
          savingsRate >= 20
            ? `Excelente! Estás acima dos 20% recomendados.\n`
            : savingsRate >= 10
              ? `Bom progresso! Tenta chegar aos 20%.\n`
              : `Atenção: Tenta aumentar a poupança.\n`

        if (goals.length > 0) {
          const avgProgress =
            goals.reduce((acc, g) => acc + (g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0), 0) /
            goals.length
          response += `\n**Metas:** ${goals.length} ativas (${avgProgress.toFixed(0)}% progresso médio)`
        }

        return response
      }

      // SALDO / GASTOS - existing with expanded keywords
      if (matchesAny(q, ["saldo", "quanto tenho", "patrimonio", "dinheiro total", "valor total", "contas"])) {
        let response = `**O teu património total é €${totalBalance.toFixed(2)}**\n\n`
        response += `**Distribuição por contas:**\n`
        accounts.forEach((acc) => {
          const icon =
            acc.type === "savings" || acc.type === "poupanca"
              ? "[Poupança]"
              : acc.type === "investment" || acc.type === "investimento"
                ? "[Investimento]"
                : "[Conta]"
          response += `${icon} ${acc.name}: **€${(acc.balance || 0).toFixed(2)}**\n`
        })
        return response
      }

      if (matchesAny(q, ["quanto gastei", "gastos", "despesas", "gastei este", "gasto mensal"])) {
        let response = `**Gastos de ${now.toLocaleString("pt-PT", { month: "long" })}:**\n\n`
        response += `**Resumo:**\n`
        response += `• Despesas: **€${totalExpenses.toFixed(2)}**\n`
        response += `• Receitas: **€${totalIncome.toFixed(2)}**\n`
        response += `• Balanço: **€${balance.toFixed(2)}** ${balance >= 0 ? "✓" : "!"}\n\n`

        if (sortedCategories.length > 0) {
          response += `**Top categorias de despesas:**\n`
          sortedCategories.forEach(([_, data], i) => {
            const pct = totalExpenses > 0 ? ((data.amount / totalExpenses) * 100).toFixed(0) : 0
            response += `${i + 1}. ${data.name}: **€${data.amount.toFixed(2)}** (${pct}%)\n`
          })
        }

        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : 0
        response += `\nEstás a poupar **${savingsRate}%** do teu rendimento este mês.`

        return response
      }

      if (matchesAny(q, ["recebi", "receitas", "rendimento", "salário", "ganho", "entradas"])) {
        let response = `**Receitas de ${now.toLocaleString("pt-PT", { month: "long" })}:**\n\n`
        response += `Total recebido: **€${totalIncome.toFixed(2)}**\n\n`

        const incomes = thisMonthTransactions.filter((t) => t.type === "income")
        if (incomes.length > 0) {
          response += `**Detalhes:**\n`
          incomes.slice(0, 5).forEach((t) => {
            response += `• ${t.description}: **€${t.amount.toFixed(2)}**\n`
          })
        }
        return response
      }

      if (matchesAny(q, ["maior despesa", "gastei mais", "despesa maior", "maiores gastos"])) {
        const topExpenses = thisMonthTransactions
          .filter((t) => t.type === "expense")
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        if (topExpenses.length === 0) {
          return "Não encontrei despesas registadas este mês."
        }

        let response = `**Top 5 maiores despesas deste mês:**\n\n`
        topExpenses.forEach((t, i) => {
          const catName = getCategoryName(t.category)
          response += `${i + 1}. **${t.description}** - €${t.amount.toFixed(2)}\n   Categoria: ${catName}\n\n`
        })
        return response
      }

      if (matchesAny(q, ["fluxo", "cash flow", "entrada saída", "balanço"])) {
        const inflow = totalIncome
        const outflow = totalExpenses
        const net = inflow - outflow

        let response = `**Fluxo de Caixa - ${now.toLocaleString("pt-PT", { month: "long" })}:**\n\n`
        response += `Entradas: **€${inflow.toFixed(2)}**\n`
        response += `Saídas: **€${outflow.toFixed(2)}**\n`
        response += `---\n`
        response += `Líquido: **€${net.toFixed(2)}** ${net >= 0 ? "✓" : "!"}\n\n`

        if (net < 0) {
          response += `**Atenção:** Estás a gastar mais do que ganhas! Considera rever as tuas despesas.`
        } else if (net > 0) {
          response += `**Excelente!** Tens um saldo positivo. Considera investir ou aumentar a poupança.`
        }
        return response
      }

      // METAS
      if (matchesAny(q, ["metas", "objetivos", "goals", "progresso metas", "minhas metas"])) {
        if (goals.length === 0) {
          return "Ainda não tens metas definidas. Cria uma meta na secção 'Metas Financeiras' para começar a acompanhar o teu progresso!"
        }

        let response = `**As tuas ${goals.length} metas financeiras:**\n\n`
        goals.forEach((goal) => {
          const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
          const remaining = goal.target_amount - goal.current_amount
          const status =
            progress >= 100
              ? "[Concluída]"
              : progress >= 75
                ? "[Quase lá]"
                : progress >= 50
                  ? "[Metade]"
                  : "[Em progresso]"

          response += `${status} **${goal.name}**\n`
          response += `   €${goal.current_amount.toFixed(2)} / €${goal.target_amount.toFixed(2)} (${progress.toFixed(0)}%)\n`
          if (progress < 100) {
            response += `   Faltam: **€${remaining.toFixed(2)}**\n`
          }
          response += `\n`
        })

        const avgProgress =
          goals.reduce((acc, g) => acc + (g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0), 0) /
          goals.length
        response += `**Progresso médio:** ${avgProgress.toFixed(0)}%`

        return response
      }

      if (matchesAny(q, ["priorizar", "qual meta", "focar", "que meta"])) {
        if (goals.length === 0) {
          return "Ainda não tens metas definidas."
        }

        const sortedGoals = [...goals].sort((a, b) => {
          const progA = a.target_amount > 0 ? a.current_amount / a.target_amount : 0
          const progB = b.target_amount > 0 ? b.current_amount / b.target_amount : 0
          return progB - progA
        })

        const closest = sortedGoals[0]
        const closestProg = closest.target_amount > 0 ? (closest.current_amount / closest.target_amount) * 100 : 0

        let response = `**Recomendação de priorização:**\n\n`
        response += `A meta mais próxima é **"${closest.name}"** com ${closestProg.toFixed(0)}% concluído.\n\n`
        response += `Faltam apenas **€${(closest.target_amount - closest.current_amount).toFixed(2)}** para atingir!\n\n`
        response += `**Dica:** Concentra esforços numa meta de cada vez para sentires progresso mais rápido.`

        return response
      }

      // INVESTIMENTOS E EDUCAÇÃO
      if (
        matchesAny(q, [
          "começar investir",
          "iniciar investimento",
          "como investir",
          "primeiro investimento",
          "onde investir",
        ])
      ) {
        return `**Guia para começar a investir:**

1. **Fundo de emergência primeiro**
   Antes de investir, garante 3-6 meses de despesas em poupança líquida.

2. **Define o teu perfil de risco**
   • Conservador: Prefere segurança
   • Moderado: Equilíbrio risco/retorno
   • Agressivo: Aceita volatilidade por maiores ganhos

3. **Começa com ETFs diversificados**
   • ETF World (ex: IWDA, VWCE) - exposição global
   • Baixas comissões e diversificação automática

4. **Investe regularmente**
   • Técnica DCA (Dollar Cost Averaging)
   • Mesmo valor todos os meses
   • Reduz impacto da volatilidade

**Sugestão inicial:** Começa com €50-100/mês num ETF global.`
      }

      if (matchesAny(q, ["etf", "fundo índice", "exchange traded", "fundos"])) {
        return `**O que são ETFs?**

**ETF** = Exchange Traded Fund (Fundo negociado em bolsa)

**Como funcionam:**
• Replicam um índice (ex: S&P 500, MSCI World)
• Diversificação instantânea com uma compra
• Negociados como ações na bolsa
• Comissões baixas (0.07% a 0.50%/ano)

**Vantagens:**
• Diversificação automática
• Custos muito baixos
• Fácil de comprar/vender
• Transparência

**ETFs populares:**
• **IWDA** - iShares MSCI World (países desenvolvidos)
• **VWCE** - Vanguard FTSE All-World (global)
• **CSPX** - iShares S&P 500 (EUA)

**Para iniciantes:** Um ETF global como VWCE é uma excelente escolha.`
      }

      if (matchesAny(q, ["juros compostos", "compound", "efeito bola de neve", "capitalização"])) {
        return `**O Poder dos Juros Compostos**

A "8ª maravilha do mundo" segundo Einstein!

**Fórmula:** Valor Final = Principal x (1 + taxa)^anos

**Exemplo prático:**
• Investimento: €200/mês
• Retorno: 7% ao ano
• Período: 30 anos

**Resultado:**
• Total investido: €72.000
• Valor final: **€227.000**
• Juros ganhos: **€155.000**

**A magia está no tempo!**
• 10 anos -> €34.500
• 20 anos -> €98.600
• 30 anos -> €227.000

**Conclusão:** Quanto mais cedo começares, mais os juros compostos trabalham por ti!`
      }

      if (matchesAny(q, ["simula", "simulação", "investir durante", "projeção investimento"])) {
        const monthlyAmount = 200
        const annualReturn = 0.07
        const years = 20

        let total = 0
        for (let i = 0; i < years * 12; i++) {
          total = (total + monthlyAmount) * (1 + annualReturn / 12)
        }
        const invested = monthlyAmount * 12 * years
        const gains = total - invested

        const formatNumber = (num: number) => num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")

        return `**Simulação de Investimento:**

**Parâmetros:**
• Valor mensal: €${monthlyAmount}
• Retorno anual: ${(annualReturn * 100).toFixed(0)}%
• Período: ${years} anos

**Resultados:**
• Total investido: €${formatNumber(invested)}
• Valor final: **€${formatNumber(total)}**
• Juros ganhos: **€${formatNumber(gains)}**

Isso é um retorno de **${((gains / invested) * 100).toFixed(0)}%** sobre o investido!

Quer simular outros valores? Pergunta-me!`
      }

      if (matchesAny(q, ["diversificação", "diversificar", "não colocar ovos", "distribuir investimentos"])) {
        return `**Diversificação de Investimentos**

"Não coloques todos os ovos no mesmo cesto"

**O que é?**
Distribuir investimentos por diferentes ativos para reduzir risco.

**Tipos de diversificação:**

1. **Por classe de ativos**
   • Ações (maior risco, maior retorno)
   • Obrigações (menor risco, menor retorno)
   • Imobiliário
   • Matérias-primas

2. **Por geografia**
   • EUA, Europa, Mercados emergentes

3. **Por setor**
   • Tecnologia, Saúde, Financeiro, etc.

**Portfolio exemplo (moderado):**
• 60% Ações globais (ETF World)
• 30% Obrigações
• 10% Reserva líquida

**Dica:** Um único ETF global já oferece diversificação em 1500+ empresas!`
      }

      if (matchesAny(q, ["inflação", "perder valor", "custo de vida", "preços sobem"])) {
        return `**Inflação: O Imposto Invisível**

**O que é?**
Aumento generalizado dos preços, que reduz o poder de compra do dinheiro.

**Impacto real:**
• Inflação média: 2-3%/ano
• €1.000 hoje -> €744 em 10 anos (poder de compra)

**Como te proteger:**

1. **Não deixar dinheiro parado**
   O dinheiro na conta perde valor todos os anos

2. **Investir em ativos reais**
   • Ações (empresas ajustam preços)
   • Imobiliário
   • Obrigações indexadas à inflação

3. **Negociar aumentos salariais**
   Pelo menos acompanhar a inflação

**Exemplo:**
• Poupança: €10.000 a 1%/ano = €10.100
• Inflação: 3%
• Perda real: €200/ano

**Conclusão:** Investir é essencial para preservar riqueza!`
      }

      // OBRIGAÇÕES - NEW
      if (matchesAny(q, ["obrigações", "obrigacoes", "bonds", "certificados", "divida"])) {
        return `**O que são Obrigações?**

**Definição:**
Títulos de dívida onde emprestas dinheiro a governos ou empresas em troca de juros.

**Como funcionam:**
1. Compras uma obrigação por €1.000
2. Recebes juros anuais (ex: 3%)
3. No vencimento, recebes os €1.000 de volta

**Tipos principais:**
• **Certificados de Aforro** - Estado português, muito seguros
• **Obrigações do Tesouro** - Governos
• **Obrigações empresariais** - Maior risco, maior retorno

**Vantagens:**
• Rendimento previsível
• Menor volatilidade que ações
• Diversificação da carteira

**Desvantagens:**
• Retornos geralmente mais baixos
• Risco de inflação

**Para iniciantes:** Certificados de Aforro são uma boa opção segura em Portugal.`
      }

      // AÇÕES VS FUNDOS - NEW
      if (matchesAny(q, ["ações vs fundos", "diferença ações", "ações ou fundos", "individual vs fundo"])) {
        return `**Ações vs Fundos de Investimento**

**Ações individuais:**
• Compras parte de UMA empresa
• Maior risco (tudo numa empresa)
• Potencial de maior ganho (ou perda)
• Requer mais conhecimento e tempo
• Exemplo: Comprar ações da Apple

**Fundos/ETFs:**
• Compras parte de MUITAS empresas
• Risco diversificado
• Retornos mais estáveis
• Gestão passiva ou ativa
• Exemplo: ETF com 500 empresas

**Comparação:**
| Aspeto | Ações | Fundos/ETFs |
|--------|-------|-------------|
| Risco | Alto | Moderado |
| Diversificação | Baixa | Alta |
| Tempo necessário | Muito | Pouco |
| Conhecimento | Avançado | Básico |

**Recomendação para iniciantes:** Começa com ETFs e, se quiseres, adiciona ações individuais mais tarde.`
      }

      // POUPANÇA
      if (matchesAny(q, ["cortar despesas", "reduzir gastos", "poupar mais", "economizar", "gastar menos"])) {
        if (sortedCategories.length === 0) {
          return "Não tenho dados suficientes sobre as tuas despesas. Regista algumas transações primeiro!"
        }

        let response = `**Análise para reduzir despesas:**\n\n`
        response += `**As tuas maiores categorias de gastos:**\n`

        sortedCategories.forEach(([_, data], i) => {
          const marker = i === 0 ? "[Maior]" : i === 1 ? "[2º]" : "[3º]"
          response += `${marker} ${data.name}: **€${data.amount.toFixed(2)}**\n`
        })

        response += `\n**Sugestões:**\n`
        response += `• Revê subscrições não utilizadas\n`
        response += `• Compara preços antes de comprar\n`
        response += `• Define um limite mensal por categoria\n`
        response += `• Usa a regra das 48h para compras impulsivas`

        return response
      }

      if (matchesAny(q, ["50/30/20", "regra 50", "orçamento básico", "dividir salário"])) {
        const needs = totalIncome * 0.5
        const wants = totalIncome * 0.3
        const savings = totalIncome * 0.2

        return `**Regra 50/30/20 aplicada às tuas finanças:**

Com rendimento de **€${totalIncome.toFixed(2)}**/mês:

**50% Necessidades** - €${needs.toFixed(2)}
• Renda, alimentação, contas, transporte

**30% Desejos** - €${wants.toFixed(2)}
• Lazer, restaurantes, hobbies

**20% Poupança/Investimento** - €${savings.toFixed(2)}
• Fundo emergência, investimentos, metas

**A tua situação atual:**
• Gastas: €${totalExpenses.toFixed(2)} (${totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 0}%)
• Poupas: €${Math.max(balance, 0).toFixed(2)} (${totalIncome > 0 ? ((Math.max(balance, 0) / totalIncome) * 100).toFixed(0) : 0}%)

${balance >= savings ? "Estás a cumprir a meta de 20% de poupança!" : "Tenta aumentar a poupança para atingir os 20%"}`
      }

      if (matchesAny(q, ["fundo de emergência", "emergencia", "reserva", "imprevistos"])) {
        const monthlyExpenses = totalExpenses || 1000
        const recommended3 = monthlyExpenses * 3
        const recommended6 = monthlyExpenses * 6
        const savingsAccounts = accounts.filter((a) => a.type === "savings" || a.type === "poupanca")
        const currentSavings = savingsAccounts.reduce((acc, a) => acc + (a.balance || 0), 0)
        const monthsCovered = currentSavings / monthlyExpenses

        return `**Fundo de Emergência**

**O que é?**
Reserva líquida para imprevistos (perda emprego, doença, reparações).

**Quanto deves ter?**
• Mínimo: 3 meses de despesas = **€${recommended3.toFixed(2)}**
• Ideal: 6 meses de despesas = **€${recommended6.toFixed(2)}**

**A tua situação:**
• Despesas mensais: €${monthlyExpenses.toFixed(2)}
• Poupança atual: €${currentSavings.toFixed(2)}
• Cobertura: **${monthsCovered.toFixed(1)} meses** ${monthsCovered >= 6 ? "✓ Excelente" : monthsCovered >= 3 ? "~ Bom" : "! Insuficiente"}

**Onde guardar?**
• Conta poupança separada
• Depósitos a prazo com liquidez
• Certificados de Aforro

**Dica:** Automatiza uma transferência mensal para esta reserva!`
      }

      // AJUDA APP
      if (matchesAny(q, ["o que podes", "ajuda", "consegues fazer", "funcionalidades", "capacidades"])) {
        return `**O que posso fazer por ti:**

**Análise Financeira**
• Ver saldo total e por conta
• Analisar despesas por categoria
• Comparar receitas vs despesas

**Gestão de Metas**
• Ver progresso das metas
• Sugerir qual priorizar
• Calcular quanto poupar

**Educação Financeira**
• Explicar juros compostos
• Ensinar sobre ETFs e ações
• Dicas de poupança

**Simulações**
• Simular investimentos
• Calcular tempo para metas
• Projetar cenários

**Sugestões**
• Onde cortar despesas
• Como aplicar regras de orçamento
• Melhores práticas financeiras

Experimenta perguntar algo específico!`
      }

      if (
        matchesAny(q, ["adicionar transação", "nova transação", "registar", "adiciono transação", "criar transação"])
      ) {
        return `**Como adicionar uma transação:**

1. Clica no botão **"+ Nova Transação"** no menu lateral

2. Preenche os campos:
   • Tipo: Receita ou Despesa
   • Valor
   • Categoria
   • Descrição
   • Data
   • Conta

3. Opcional: Marca como **recorrente** para transações fixas

4. Clica em **Guardar**

**Dica:** Usa categorias consistentes para melhor análise!`
      }

      if (matchesAny(q, ["automação", "automações", "regras automáticas", "automatizar"])) {
        return `**Como funcionam as Automações:**

**O que são?**
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

**Sugestão:** Automatiza a poupança para não depender de força de vontade!`
      }

      // SAUDAÇÕES E CONVERSAÇÃO
      if (matchesAny(q, ["olá", "ola", "oi", "bom dia", "boa tarde", "boa noite", "hey", "hello"])) {
        return `Olá! Como posso ajudar-te hoje com as tuas finanças?

Podes perguntar-me sobre:
• O teu saldo e despesas
• As tuas metas financeiras
• Dicas de poupança e investimento
• Conceitos financeiros

Ou escolhe um dos temas nos botões acima!`
      }

      if (matchesAny(q, ["obrigado", "obrigada", "thanks", "valeu"])) {
        return `De nada! Fico feliz em ajudar.

Se tiveres mais alguma dúvida sobre as tuas finanças, é só perguntar!`
      }

      if (matchesAny(q, ["adeus", "tchau", "até", "bye"])) {
        return `Até à próxima!

Lembra-te: pequenos passos consistentes levam a grandes resultados financeiros. Boas finanças!`
      }

      // IRS - NEW
      if (matchesAny(q, ["irs", "impostos", "declaração", "deduções", "fiscal"])) {
        return `**IRS em Portugal - O Básico**

**O que é?**
Imposto sobre o Rendimento das Pessoas Singulares, declarado anualmente.

**Escalões 2024:**
• Até €7.703: 13.25%
• €7.703 - €11.623: 18%
• €11.623 - €16.472: 23%
• €16.472 - €21.321: 26%
• €21.321 - €27.146: 32.75%
• €27.146 - €39.791: 37%
• €39.791 - €51.997: 43.5%
• €51.997 - €81.199: 45%
• Mais de €81.199: 48%

**Deduções comuns:**
• Despesas de saúde (15% até €1.000)
• Educação (30% até €800)
• Habitação (15% até €502)
• Despesas gerais familiares (35% até €250)

**Dicas:**
• Guarda todas as faturas com NIF
• Valida despesas no e-fatura
• Usa simulador das Finanças antes de entregar`
      }

      // DEFAULT - improved
      return `Não tenho uma resposta específica para essa pergunta, mas posso ajudar-te com muitos temas financeiros!

**Experimenta perguntar sobre:**
• "Qual é o meu saldo?" - Ver o teu património
• "Quanto gastei este mês?" - Analisar despesas
• "Como estão as minhas metas?" - Ver progresso
• "O que são ETFs?" - Aprender a investir
• "Como funciona a previsão?" - Entender funcionalidades

Ou escolhe um tema nos botões acima para ver mais opções!`
    },
    [transactions, accounts, goals, categories, getCategoryName],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      const response = generateIntelligentResponse(currentInput)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 500)
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
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

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, i) => {
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')

      if (line.startsWith("• ")) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-primary">•</span>
            <span dangerouslySetInnerHTML={{ __html: line.substring(2) }} />
          </div>
        )
      }

      const numMatch = line.match(/^(\d+)[.️⃣]\s*/)
      if (numMatch) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-primary font-medium">{numMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: line.substring(numMatch[0].length) }} />
          </div>
        )
      }

      if (line.trim() === "") {
        return <div key={i} className="h-2" />
      }

      if (line.startsWith("---")) {
        return <hr key={i} className="my-2 border-muted" />
      }

      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
    })
  }

  const topicConfig = {
    saldo: { icon: Wallet, label: "Saldo", color: "text-emerald-600" },
    metas: { icon: Target, label: "Metas", color: "text-purple-600" },
    investir: { icon: TrendingUp, label: "Investir", color: "text-blue-600" },
    poupar: { icon: Lightbulb, label: "Poupar", color: "text-amber-600" },
    aprender: { icon: GraduationCap, label: "Aprender", color: "text-pink-600" },
    ajuda: { icon: HelpCircle, label: "Ajuda", color: "text-slate-600" },
  }

  return (
    <div className="flex flex-col h-[550px] w-[380px] bg-background border rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
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
          {(Object.keys(topicConfig) as Array<keyof typeof topicConfig>).map((topic) => {
            const config = topicConfig[topic]
            const Icon = config.icon
            return (
              <DropdownMenu key={topic}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs gap-1 justify-between px-2 bg-background">
                    <div className="flex items-center gap-1">
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      <span>{config.label}</span>
                    </div>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 max-h-64 overflow-y-auto">
                  {topicQuestions[topic].map((question, i) => (
                    <DropdownMenuItem
                      key={i}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs cursor-pointer py-2"
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
                <div className="space-y-1">{formatMessage(message.content)}</div>
              ) : (
                message.content
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
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
