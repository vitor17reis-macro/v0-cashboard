import { AutomaticRules } from "@/components/rules/automatic-rules"

export default function RulesPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-serif font-bold">Automações</h2>
        <p className="text-muted-foreground">Configure regras para automatizar as suas finanças.</p>
      </div>
      <AutomaticRules />
    </div>
  )
}
