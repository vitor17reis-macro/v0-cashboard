import { MonthlyComparison } from "@/components/analytics/monthly-comparison"

export default function ComparisonPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-serif font-bold">Comparação Mensal</h2>
        <p className="text-muted-foreground">Compare as suas finanças entre meses diferentes.</p>
      </div>
      <MonthlyComparison />
    </div>
  )
}
