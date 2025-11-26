import { useFinance } from "@/components/providers/finance-provider"
import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import { CalendarIcon, CreditCardIcon, CheckCircle2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SubscriptionsView() {
  const { transactions, categories } = useFinance()

  // Filter only recurring transactions (templates) or transactions marked as recurring
  // In our current logic, we mark "isRecurring" on the transaction.
  // We want to list unique subscriptions.
  const subscriptions = transactions.filter((t) => t.isRecurring)

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || id
  }

  const totalMonthlyCommitment = subscriptions.reduce((acc, t) => {
    if (t.recurringFrequency === "monthly") return acc + t.amount
    if (t.recurringFrequency === "weekly") return acc + t.amount * 4
    if (t.recurringFrequency === "yearly") return acc + t.amount / 12
    return acc
  }, 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Assinaturas e Recorrentes</h2>
          <p className="text-muted-foreground">Gerencie seus gastos fixos mensais.</p>
        </div>
        <div className="bg-card/50 border border-border/50 p-4 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Custo Mensal Estimado</p>
          <p className="text-2xl font-bold text-primary">
            {totalMonthlyCommitment.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/20">
          <CreditCardIcon className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma assinatura ativa</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            Adicione uma transação com a opção "Recorrente" para vê-la aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:shadow-md transition-all hover:bg-card/80"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="capitalize">
                  {sub.recurringFrequency === "monthly"
                    ? "Mensal"
                    : sub.recurringFrequency === "weekly"
                      ? "Semanal"
                      : "Anual"}
                </Badge>
              </div>

              <h3 className="font-bold text-lg mb-1">{sub.description}</h3>
              <p className="text-sm text-muted-foreground mb-4">{getCategoryName(sub.category)}</p>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-xl font-bold font-mono text-expense">
                    -{sub.amount.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                  </p>
                </div>
                {sub.nextDueDate && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Próxima cobrança</p>
                    <p className="text-sm font-medium">{format(parseISO(sub.nextDueDate), "d MMM", { locale: pt })}</p>
                  </div>
                )}
              </div>

              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <CheckCircle2Icon className="h-4 w-4 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
