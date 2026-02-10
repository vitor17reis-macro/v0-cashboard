import { streamText, tool } from "ai"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const maxDuration = 30

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Helper to get user financial data
async function getUserFinancialData(userId: string) {
  const [accountsRes, transactionsRes, goalsRes, categoriesRes, budgetsRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(100),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId).not("budget", "is", null),
  ])

  return {
    accounts: accountsRes.data || [],
    transactions: transactionsRes.data || [],
    goals: goalsRes.data || [],
    categories: categoriesRes.data || [],
    budgets: budgetsRes.data?.filter((c: any) => c.budget && c.budget > 0) || [],
  }
}

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json()

    // Fetch user data for context
    let financialData: any = null
    let userContext = ""

    if (userId) {
      try {
        financialData = await getUserFinancialData(userId)

        const { accounts, transactions, goals, categories, budgets } = financialData

        const totalBalance = accounts.reduce((sum: number, a: any) => sum + (a.balance || 0), 0)
        const totalSavings = accounts
          .filter((a: any) => a.type === "savings" || a.type === "poupanca")
          .reduce((sum: number, a: any) => sum + (a.balance || 0), 0)
        const totalInvestments = accounts
          .filter((a: any) => a.type === "investment" || a.type === "investimento")
          .reduce((sum: number, a: any) => sum + (a.balance || 0), 0)

        // Get current month transactions
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthTransactions = transactions.filter((t: any) => new Date(t.date) >= startOfMonth)

        const monthlyIncome = monthTransactions
          .filter((t: any) => t.type === "income")
          .reduce((sum: number, t: any) => sum + t.amount, 0)
        const monthlyExpenses = monthTransactions
          .filter((t: any) => t.type === "expense")
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        // Group expenses by category
        const expensesByCategory: Record<string, number> = {}
        monthTransactions
          .filter((t: any) => t.type === "expense")
          .forEach((t: any) => {
            const cat = t.category || "Outros"
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount
          })

        // Calculate savings rate
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0

        userContext = `
DADOS FINANCEIROS ATUAIS DO UTILIZADOR:

💰 PATRIMÓNIO TOTAL: €${totalBalance.toFixed(2)}
- Poupança: €${totalSavings.toFixed(2)}
- Investimentos: €${totalInvestments.toFixed(2)}

📊 CONTAS:
${accounts.map((a: any) => `- ${a.name} (${a.type}): €${a.balance?.toFixed(2)}`).join("\n")}

📈 ESTE MÊS:
- Receitas: €${monthlyIncome.toFixed(2)}
- Despesas: €${monthlyExpenses.toFixed(2)}
- Saldo: €${(monthlyIncome - monthlyExpenses).toFixed(2)}
- Taxa de poupança: ${savingsRate.toFixed(1)}%

📂 DESPESAS POR CATEGORIA:
${
  Object.entries(expensesByCategory)
    .map(([cat, val]) => `- ${cat}: €${(val as number).toFixed(2)}`)
    .join("\n") || "- Sem despesas registadas"
}

🎯 METAS FINANCEIRAS:
${
  goals
    .map((g: any) => {
      const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
      const remaining = g.target_amount - g.current_amount
      return `- ${g.name}: €${g.current_amount?.toFixed(2)} / €${g.target_amount?.toFixed(2)} (${progress.toFixed(0)}%) - Faltam €${remaining.toFixed(2)}`
    })
    .join("\n") || "- Nenhuma meta definida"
}

💵 ORÇAMENTOS:
${
  budgets
    .map((b: any) => {
      const spent = expensesByCategory[b.name] || 0
      const remaining = b.budget - spent
      const percentage = b.budget > 0 ? (spent / b.budget) * 100 : 0
      return `- ${b.name}: €${spent.toFixed(2)} / €${b.budget.toFixed(2)} (${percentage.toFixed(0)}%) - ${remaining >= 0 ? `Sobram €${remaining.toFixed(2)}` : `Excedido em €${Math.abs(remaining).toFixed(2)}`}`
    })
    .join("\n") || "- Sem orçamentos definidos"
}
`
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
      }
    }

    const systemPrompt = `Tu és o CashBot, o assistente financeiro inteligente do CashBoard. 
Respondes SEMPRE em português de Portugal (não brasileiro).
És especializado em finanças pessoais, poupança e investimentos.
Dás conselhos práticos, personalizados e baseados nos dados reais do utilizador.

PERSONALIDADE:
- Simpático e profissional
- Direto mas acolhedor
- Usa linguagem clara e acessível
- Motivas o utilizador a poupar e investir

CAPACIDADES:
1. ANÁLISE FINANCEIRA - Analisar saldo, despesas, receitas e tendências
2. CONSELHOS DE POUPANÇA - Dicas para reduzir gastos e poupar mais
3. PLANEAMENTO DE METAS - Estratégias para atingir objetivos financeiros
4. EDUCAÇÃO FINANCEIRA - Explicar conceitos como ETFs, juros compostos, diversificação
5. OTIMIZAÇÃO DE ORÇAMENTO - Sugerir ajustes nos orçamentos por categoria
6. DETEÇÃO DE ANOMALIAS - Identificar gastos excessivos ou padrões preocupantes

${userContext}

REGRAS:
- Quando perguntarem sobre finanças, USA os dados acima para personalizar a resposta
- Se não tiveres dados suficientes, pede ao utilizador para adicionar mais transações
- Usa **negrito** para destacar valores e pontos importantes
- Usa listas e formatação para organizar informação complexa
- Mantém as respostas focadas e úteis (não demasiado longas)
- Sugere sempre próximos passos ou ações concretas
- Se te perguntarem algo fora do contexto financeiro, responde brevemente e redireciona para finanças`

    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
      toolCallStreaming: true,
      maxSteps: 3,
      tools: {
        // Tool para calcular quanto poupar para uma meta
        calcularPoupancaMeta: tool({
          description: "Calcula quanto o utilizador precisa de poupar por mês para atingir uma meta financeira",
          parameters: z.object({
            valorMeta: z.number().describe("Valor total da meta em euros"),
            valorAtual: z.number().describe("Valor já poupado em euros"),
            meses: z.number().describe("Número de meses para atingir a meta"),
          }),
          execute: async ({ valorMeta, valorAtual, meses }) => {
            const falta = valorMeta - valorAtual
            const porMes = falta / meses
            return {
              valorFalta: falta.toFixed(2),
              poupancaMensal: porMes.toFixed(2),
              total: valorMeta.toFixed(2),
            }
          },
        }),

        // Tool para calcular juros compostos
        calcularJurosCompostos: tool({
          description: "Calcula o crescimento de um investimento com juros compostos",
          parameters: z.object({
            capitalInicial: z.number().describe("Capital inicial em euros"),
            contribuicaoMensal: z.number().describe("Contribuição mensal em euros"),
            taxaAnual: z.number().describe("Taxa de juro anual em percentagem"),
            anos: z.number().describe("Número de anos"),
          }),
          execute: async ({ capitalInicial, contribuicaoMensal, taxaAnual, anos }) => {
            const taxaMensal = taxaAnual / 100 / 12
            const meses = anos * 12

            let total = capitalInicial
            let totalContribuicoes = capitalInicial

            for (let i = 0; i < meses; i++) {
              total = total * (1 + taxaMensal) + contribuicaoMensal
              totalContribuicoes += contribuicaoMensal
            }

            const jurosGanhos = total - totalContribuicoes

            return {
              valorFinal: total.toFixed(2),
              totalInvestido: totalContribuicoes.toFixed(2),
              jurosGanhos: jurosGanhos.toFixed(2),
              rendimento: ((jurosGanhos / totalContribuicoes) * 100).toFixed(1),
            }
          },
        }),

        // Tool para analisar despesas por categoria
        analisarDespesas: tool({
          description: "Analisa as despesas do utilizador e identifica onde pode poupar",
          parameters: z.object({
            categoria: z.string().optional().describe("Categoria específica para analisar"),
          }),
          execute: async ({ categoria }) => {
            if (!financialData) return { erro: "Dados não disponíveis" }

            const { transactions } = financialData
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

            const despesas = transactions.filter((t: any) => t.type === "expense" && new Date(t.date) >= startOfMonth)

            if (categoria) {
              const catDespesas = despesas.filter((t: any) =>
                t.category?.toLowerCase().includes(categoria.toLowerCase()),
              )
              const total = catDespesas.reduce((sum: number, t: any) => sum + t.amount, 0)
              return {
                categoria,
                total: total.toFixed(2),
                transacoes: catDespesas.length,
                media: catDespesas.length > 0 ? (total / catDespesas.length).toFixed(2) : "0",
              }
            }

            // Agrupar por categoria
            const porCategoria: Record<string, { total: number; count: number }> = {}
            despesas.forEach((t: any) => {
              const cat = t.category || "Outros"
              if (!porCategoria[cat]) porCategoria[cat] = { total: 0, count: 0 }
              porCategoria[cat].total += t.amount
              porCategoria[cat].count++
            })

            // Ordenar por valor
            const ordenado = Object.entries(porCategoria)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([cat, data]) => ({
                categoria: cat,
                total: data.total.toFixed(2),
                transacoes: data.count,
              }))

            return {
              totalDespesas: despesas.reduce((sum: number, t: any) => sum + t.amount, 0).toFixed(2),
              porCategoria: ordenado,
            }
          },
        }),

        // Tool para calcular fundo de emergência ideal
        calcularFundoEmergencia: tool({
          description: "Calcula o valor ideal do fundo de emergência baseado nas despesas do utilizador",
          parameters: z.object({
            mesesCobertura: z.number().default(6).describe("Número de meses de despesas a cobrir (padrão: 6)"),
          }),
          execute: async ({ mesesCobertura }) => {
            if (!financialData) return { erro: "Dados não disponíveis" }

            const { transactions, accounts } = financialData
            const now = new Date()

            // Calcular média de despesas dos últimos 3 meses
            const tresMesesAtras = new Date(now.getFullYear(), now.getMonth() - 3, 1)
            const despesas = transactions.filter((t: any) => t.type === "expense" && new Date(t.date) >= tresMesesAtras)
            const totalDespesas = despesas.reduce((sum: number, t: any) => sum + t.amount, 0)
            const mediaMensal = totalDespesas / 3

            const fundoIdeal = mediaMensal * mesesCobertura

            // Verificar poupança atual
            const poupancaAtual = accounts
              .filter((a: any) => a.type === "savings" || a.type === "poupanca")
              .reduce((sum: number, a: any) => sum + (a.balance || 0), 0)

            const falta = Math.max(0, fundoIdeal - poupancaAtual)
            const percentual = fundoIdeal > 0 ? (poupancaAtual / fundoIdeal) * 100 : 0

            return {
              despesaMediaMensal: mediaMensal.toFixed(2),
              fundoIdeal: fundoIdeal.toFixed(2),
              mesesCobertura,
              poupancaAtual: poupancaAtual.toFixed(2),
              falta: falta.toFixed(2),
              percentualCoberto: percentual.toFixed(1),
            }
          },
        }),

        // Tool para sugerir alocação de investimentos
        sugerirAlocacao: tool({
          description: "Sugere uma alocação de investimentos baseada no perfil de risco",
          parameters: z.object({
            perfilRisco: z.enum(["conservador", "moderado", "agressivo"]).describe("Perfil de risco do investidor"),
            valorInvestir: z.number().describe("Valor disponível para investir em euros"),
          }),
          execute: async ({ perfilRisco, valorInvestir }) => {
            const alocacoes: Record<string, { acoes: number; obrigacoes: number; depositos: number; etfs: number }> = {
              conservador: { acoes: 10, obrigacoes: 40, depositos: 40, etfs: 10 },
              moderado: { acoes: 30, obrigacoes: 30, depositos: 20, etfs: 20 },
              agressivo: { acoes: 50, obrigacoes: 15, depositos: 10, etfs: 25 },
            }

            const aloc = alocacoes[perfilRisco]

            return {
              perfil: perfilRisco,
              valorTotal: valorInvestir.toFixed(2),
              alocacao: {
                acoes: { percentual: aloc.acoes, valor: ((valorInvestir * aloc.acoes) / 100).toFixed(2) },
                obrigacoes: {
                  percentual: aloc.obrigacoes,
                  valor: ((valorInvestir * aloc.obrigacoes) / 100).toFixed(2),
                },
                depositos: { percentual: aloc.depositos, valor: ((valorInvestir * aloc.depositos) / 100).toFixed(2) },
                etfs: { percentual: aloc.etfs, valor: ((valorInvestir * aloc.etfs) / 100).toFixed(2) },
              },
              recomendacao:
                perfilRisco === "conservador"
                  ? "Foca em preservar capital. Considera Certificados de Aforro e depósitos a prazo."
                  : perfilRisco === "moderado"
                    ? "Equilíbrio entre crescimento e segurança. ETFs globais são uma boa opção."
                    : "Foco em crescimento a longo prazo. Investe em ETFs de ações globais e tecnologia.",
            }
          },
        }),
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response(JSON.stringify({ error: "Erro ao processar pedido" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
