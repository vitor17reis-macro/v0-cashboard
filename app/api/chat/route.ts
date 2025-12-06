import { streamText } from "ai"
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
Mantém as respostas concisas mas úteis.
Usa formatação markdown com **negrito** para destacar pontos importantes.`

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: systemPrompt,
    messages,
  })

  return result.toDataStreamResponse()
}
