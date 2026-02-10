"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Download } from "lucide-react"
import { generateEmailSummary } from "@/lib/email-summary"

export function EmailSummaryPreview() {
  const { accounts, transactions, categories, goals } = useFinance()

  const handleSendTestEmail = async () => {
    // Simular envio de email de teste
    const summary = generateEmailSummary({
      accounts,
      transactions: transactions || [],
      categories,
      goals,
      period: "weekly",
    })
    console.log("Email Summary:", summary)
    alert("Email de teste enviado! Verifique a consola para ver o conteúdo.")
  }

  const handleDownloadPDF = () => {
    const summary = generateEmailSummary({
      accounts,
      transactions: transactions || [],
      categories,
      goals,
      period: "monthly",
    })
    // Aqui integraríamos uma library como jsPDF
    console.log("PDF gerado:", summary)
    alert("PDF seria gerado com o resumo")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          Pré-visualização de Resumo
        </CardTitle>
        <CardDescription>Veja como será o seu resumo financeiro</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleSendTestEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email de Teste
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm space-y-2">
          <p className="font-semibold">Conteúdo do Resumo Semanal:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Despesa total da semana e comparação</li>
            <li>Categorias com maior gasto</li>
            <li>Progresso em relação aos orçamentos</li>
            <li>Status das metas de poupança</li>
            <li>Insights IA e recomendações</li>
            <li>Alertas críticos se aplicável</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
