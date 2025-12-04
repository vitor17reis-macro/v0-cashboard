// Multi-Agent Orchestrator - Routes queries to specialized agents
import type { AgentType, AgentContext } from "./types"

interface IntentClassification {
  intent: AgentType
  confidence: number
  entities: Record<string, any>
}

const INTENT_PATTERNS: Record<AgentType, RegExp[]> = {
  sql: [
    /quanto\s+(gastei|recebi|paguei|transferi)/i,
    /total\s+(de\s+)?(despesas|receitas|gastos)/i,
    /listar\s+(todas|as)?\s*(transac|despesa|receita)/i,
    /quantas?\s+(transac|despesa|receita)/i,
    /soma\s+(de|das|dos)/i,
    /media\s+(de|das|dos)/i,
    /últimos?\s+\d+\s+(dias|meses|semanas)/i,
    /entre\s+.*\s+e\s+/i,
    /por\s+categoria/i,
    /em\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
  ],
  finance: [
    /investir|investimento|ações|acoes|etf|fundos/i,
    /mercado|bolsa|trading|trade/i,
    /rentabilidade|rendimento|lucro|retorno/i,
    /portfolio|portefólio|carteira/i,
    /risco|diversific/i,
    /crypto|bitcoin|ethereum/i,
    /análise\s+(técnica|fundamental)/i,
  ],
  education: [
    /como\s+funciona|o\s+que\s+é|explica/i,
    /aprend|ensina|educar|literacia/i,
    /juros\s+compostos/i,
    /inflação|inflacao/i,
    /orçamento|orcamento|budget/i,
    /poupança|poupar|economizar/i,
    /dicas?\s+(de|para)/i,
    /estratégia|estrategia/i,
  ],
  planner: [
    /planear|planejar|plano|objetivo/i,
    /quero\s+(poupar|juntar|guardar|atingir)/i,
    /em\s+\d+\s+(meses|anos)/i,
    /meta\s+(de|para)/i,
    /como\s+consigo|como\s+posso/i,
    /preciso\s+de\s+\d+/i,
    /cronograma|timeline/i,
  ],
  support: [
    /ajuda|help|suporte/i,
    /como\s+(usar|utilizar|funciona\s+o)/i,
    /onde\s+(fica|está|encontro)/i,
    /problema|erro|bug|não\s+funciona/i,
    /tutorial|guia/i,
    /funcionalidade/i,
  ],
  rag: [/pesquisa|procura|busca/i, /informação\s+sobre/i, /documentação/i],
  orchestrator: [],
}

export function classifyIntent(query: string, context: AgentContext): IntentClassification {
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  let bestMatch: IntentClassification = {
    intent: "support",
    confidence: 0.3,
    entities: {},
  }

  // Check each agent's patterns
  for (const [agent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (agent === "orchestrator") continue

    let matchCount = 0
    const entities: Record<string, any> = {}

    for (const pattern of patterns) {
      const match = normalizedQuery.match(pattern)
      if (match) {
        matchCount++
        // Extract entities from match
        if (match.groups) {
          Object.assign(entities, match.groups)
        }
      }
    }

    const confidence = patterns.length > 0 ? matchCount / patterns.length : 0

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        intent: agent as AgentType,
        confidence: Math.min(confidence * 1.5, 1), // Boost confidence slightly
        entities,
      }
    }
  }

  // Extract common entities
  bestMatch.entities = {
    ...bestMatch.entities,
    ...extractEntities(normalizedQuery),
  }

  return bestMatch
}

function extractEntities(query: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // Extract amounts
  const amountMatch = query.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€|eur)/i)
  if (amountMatch) {
    entities.amount = Number.parseFloat(amountMatch[1].replace(",", "."))
  }

  // Extract time periods
  const periodMatch = query.match(/últimos?\s+(\d+)\s+(dias?|meses?|semanas?|anos?)/i)
  if (periodMatch) {
    entities.period = {
      value: Number.parseInt(periodMatch[1]),
      unit: periodMatch[2].toLowerCase(),
    }
  }

  // Extract months
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ]
  for (let i = 0; i < months.length; i++) {
    if (query.includes(months[i])) {
      entities.month = i + 1
      break
    }
  }

  // Extract categories
  const categoryKeywords = [
    "alimentação",
    "alimentacao",
    "comida",
    "restaurante",
    "transporte",
    "uber",
    "combustível",
    "combustivel",
    "entretenimento",
    "lazer",
    "netflix",
    "spotify",
    "saúde",
    "saude",
    "farmácia",
    "farmacia",
    "educação",
    "educacao",
    "curso",
    "livro",
  ]
  for (const keyword of categoryKeywords) {
    if (query.includes(keyword)) {
      entities.categoryKeyword = keyword
      break
    }
  }

  return entities
}

export function getAgentSystemPrompt(agentType: AgentType, context: AgentContext): string {
  const baseContext = `
Contexto do utilizador:
- ${context.accounts.length} contas registadas
- ${context.transactions.length} transações
- ${context.goals.length} metas financeiras
- ${context.categories.length} categorias
- Moeda: ${context.currency}
`

  switch (agentType) {
    case "sql":
      return `És um agente especializado em consultas à base de dados financeiros.
${baseContext}
Tabelas disponíveis: accounts, transactions, goals, categories
Responde sempre em português de Portugal com os resultados formatados.`

    case "finance":
      return `És um consultor financeiro especializado em investimentos.
${baseContext}
Fornece análises de mercado, recomendações de investimento e insights sobre o portefólio.
Sê prudente nas recomendações e menciona sempre os riscos.`

    case "education":
      return `És um educador financeiro paciente e didático.
${baseContext}
Explica conceitos financeiros de forma simples e clara.
Usa exemplos práticos e relaciona com a situação do utilizador.`

    case "planner":
      return `És um planeador financeiro que cria planos personalizados.
${baseContext}
Cria planos detalhados com passos concretos e prazos realistas.
Considera a situação atual do utilizador e sugere automações.`

    case "support":
      return `És o suporte técnico do CashBoard.
${baseContext}
Funcionalidades do app: Contas, Transações, Metas, Automações, Comparação, Relatórios, Previsão, Assinaturas.
Guia o utilizador passo a passo de forma clara e amigável.`

    case "rag":
      return `És um agente de pesquisa e recuperação de informação.
${baseContext}
Pesquisa informação relevante e apresenta de forma estruturada.`

    default:
      return `És o assistente principal do CashBoard.
${baseContext}
Ajuda o utilizador com todas as questões financeiras.`
  }
}
