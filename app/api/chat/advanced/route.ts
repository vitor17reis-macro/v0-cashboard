import { streamText } from "ai"
import { createClient } from "@supabase/supabase-js"
import {
  analyzeConversation,
  generateProactiveRecommendations,
  type ConversationAnalysis,
} from "@/lib/chatbot-intelligence"
import type { Message } from "@/lib/types"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getUserFinancialData(userId: string) {
  const [accountsRes, transactionsRes, goalsRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId).limit(200),
    supabase.from("goals").select("*").eq("user_id", userId),
  ])

  return {
    accounts: accountsRes.data || [],
    transactions: transactionsRes.data || [],
    goals: goalsRes.data || [],
  }
}

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json()

    let financialData: any = null
    let analysis: ConversationAnalysis | null = null
    let recommendations: any[] = []

    if (userId) {
      financialData = await getUserFinancialData(userId)

      analysis = analyzeConversation(messages as Message[])
      console.log("[v0] Conversation analysis:", analysis)

      recommendations = generateProactiveRecommendations(
        financialData.transactions,
        financialData.accounts,
        financialData.goals,
        analysis,
      )
    }

    // Build enhanced context with conversation analysis
    const analysisContext = analysis
      ? `
ANÁLISE DA CONVERSA:
- Tópicos principais: ${analysis.mainTopics.join(", ")}
- Sentimento do utilizador: ${analysis.sentimentScore > 0.6 ? "Positivo" : analysis.sentimentScore > 0.4 ? "Neutro" : "Preocupado"}
- Preocupações: ${analysis.concerns.length > 0 ? analysis.concerns.join(", ") : "Nenhuma"}
- Ações sugeridas: ${analysis.recommendedActions.length > 0 ? analysis.recommendedActions.join(", ") : "Nenhuma"}
`
      : ""

    const systemPrompt = `Tu és CashBot, com capacidades de análise avançada de conversas.
${analysisContext}

Baseado nesta análise:
1. Personaliza as respostas para os tópicos que o utilizador está a explorar
2. Antecipa necessidades baseado no padrão de perguntas
3. Oferece recomendações proativas quando apropriado
4. Mantém o contexto da conversa anterior

Responde SEMPRE em português de Portugal.`

    const result = await streamText({
      model: "openai/gpt-4",
      system: systemPrompt,
      messages,
      maxTokens: 1500,
      temperature: 0.7,
    })

    return new Response(result, { status: 200 })
  } catch (error) {
    console.error("[v0] Advanced chat error:", error)
    return new Response(JSON.stringify({ error: "Erro ao processar pedido" }), { status: 500 })
  }
}
