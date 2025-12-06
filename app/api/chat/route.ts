import { streamText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 30

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  const { messages, userId } = await req.json()

  // Fetch user data for context
  let userContext = ""
  if (userId) {
    try {
      const [accountsRes, transactionsRes, goalsRes, categoriesRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", userId),
        supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(50),
        supabase.from("goals").select("*").eq("user_id", userId),
        supabase.from("categories").select("*").eq("user_id", userId),
      ])

      const accounts = accountsRes.data || []
      const transactions = transactionsRes.data || []
      const goals = goalsRes.data || []
      const categories = categoriesRes.data || []

      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
      const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      // Group expenses by category
      const expensesByCategory: Record<string, number> = {}
      transactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const cat = t.category || "Outros"
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount
        })

      userContext = `
DADOS FINANCEIROS DO UTILIZADOR:
- Saldo Total: €${totalBalance.toFixed(2)}
- Contas: ${accounts.map((a) => `${a.name}: €${a.balance?.toFixed(2)}`).join(", ")}
- Receitas (últimos 50 movimentos): €${totalIncome.toFixed(2)}
- Despesas (últimos 50 movimentos): €${totalExpenses.toFixed(2)}
- Despesas por categoria: ${Object.entries(expensesByCategory)
        .map(([cat, val]) => `${cat}: €${val.toFixed(2)}`)
        .join(", ")}
- Metas: ${goals.map((g) => `${g.name}: €${g.current_amount}/${g.target_amount}`).join(", ") || "Nenhuma"}
- Categorias: ${categories.map((c) => c.name).join(", ")}
`
    } catch (error) {
      console.error("[v0] Error fetching user data:", error)
    }
  }

  const systemPrompt = `Tu és o assistente financeiro do CashBoard, uma aplicação de finanças pessoais. 
Respondes sempre em português de Portugal.
Dás conselhos financeiros práticos e personalizados.
És simpático, direto e útil.

${userContext}

Podes ajudar o utilizador com:
- Análise das suas finanças (receitas, despesas, saldo)
- Conselhos de poupança e investimento
- Sugestões para reduzir despesas
- Planos financeiros para atingir metas
- Explicações sobre conceitos financeiros (juros compostos, ETFs, etc.)
- Como usar melhor a aplicação CashBoard

Quando o utilizador perguntar sobre as suas finanças, usa os dados acima para dar respostas personalizadas.
Mantém as respostas concisas mas úteis.`

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: systemPrompt,
    messages,
    tools: {
      getFinancialSummary: tool({
        description: "Obtém um resumo financeiro detalhado do utilizador",
        parameters: z.object({}),
        execute: async () => {
          return userContext || "Dados financeiros não disponíveis"
        },
      }),
      suggestSavings: tool({
        description: "Sugere formas de poupar dinheiro baseado nos gastos do utilizador",
        parameters: z.object({
          targetAmount: z.number().optional().describe("Valor objetivo de poupança"),
        }),
        execute: async ({ targetAmount }) => {
          return `Sugestões de poupança${targetAmount ? ` para atingir €${targetAmount}` : ""}:
1. Analise as suas subscrições mensais e cancele as que não usa
2. Defina um orçamento para cada categoria de despesa
3. Use a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança
4. Configure automações no CashBoard para transferir automaticamente para poupança`
        },
      }),
      explainConcept: tool({
        description: "Explica um conceito financeiro",
        parameters: z.object({
          concept: z.string().describe("O conceito financeiro a explicar"),
        }),
        execute: async ({ concept }) => {
          const concepts: Record<string, string> = {
            "juros compostos":
              "Juros compostos são juros que incidem sobre o capital inicial mais os juros acumulados. É o 'juros sobre juros' que faz o dinheiro crescer exponencialmente ao longo do tempo.",
            etf: "ETF (Exchange Traded Fund) é um fundo de investimento negociado em bolsa que replica um índice. Permite diversificar com baixo custo.",
            "fundo de emergência":
              "É uma reserva de dinheiro para imprevistos, idealmente 3-6 meses de despesas mensais, guardada numa conta de fácil acesso.",
            inflação:
              "Inflação é o aumento generalizado dos preços ao longo do tempo, que reduz o poder de compra do dinheiro.",
          }
          return (
            concepts[concept.toLowerCase()] ||
            `${concept}: Conceito financeiro importante para a gestão das suas finanças pessoais.`
          )
        },
      }),
    },
    maxSteps: 3,
  })

  return result.toUIMessageStreamResponse()
}
