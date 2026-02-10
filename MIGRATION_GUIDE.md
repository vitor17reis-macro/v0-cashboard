# Migration Guide - Importações da Refatoração

## Mudanças de Imports

### Transactions
```tsx
// Antes
import { useTransactions } from '@/hooks/use-transactions'
import TransactionForm from '@/components/transactions/transaction-form'
import TransactionList from '@/components/transactions/transaction-list'

// Depois
import { useTransactions } from '@/features/transactions'
import TransactionForm from '@/features/transactions/components/transaction-form'
import TransactionList from '@/features/transactions/components/transaction-list'
```

### Accounts
```tsx
// Antes
import { useAccounts } from '@/hooks/use-accounts'
import AccountCards from '@/components/accounts/account-cards'
import AccountForm from '@/components/accounts/account-form'
import AccountTransferForm from '@/components/accounts/account-transfer-form'

// Depois
import { useAccounts } from '@/features/accounts'
import AccountCards from '@/features/accounts/components/account-cards'
import AccountForm from '@/features/accounts/components/account-form'
import AccountTransferForm from '@/features/accounts/components/account-transfer-form'
```

### Goals
```tsx
// Antes
import { useGoals } from '@/hooks/use-goals'
import GoalForm from '@/components/goals/goal-form'
import GoalsDialog from '@/components/goals/goals-list'

// Depois
import { useGoals } from '@/features/goals'
import GoalForm from '@/features/goals/components/goal-form'
import GoalsDialog from '@/features/goals/components/goals-list'
```

### Automations
```tsx
// Antes
import { useRules } from '@/hooks/use-rules'
import AutomaticRules from '@/components/rules/automatic-rules'

// Depois
import { useRules } from '@/features/automations'
import AutomaticRules from '@/features/automations/components/automatic-rules'
```

## Scripts de Busca e Substituição

Você pode usar estes padrões em seu editor (Ctrl+H para Find and Replace):

### VSCode Find and Replace

#### Transaction Imports
- Find: `from '@/hooks/use-transactions'`
- Replace: `from '@/features/transactions'`

- Find: `from '@/components/transactions/`
- Replace: `from '@/features/transactions/components/`

#### Account Imports
- Find: `from '@/hooks/use-accounts'`
- Replace: `from '@/features/accounts'`

- Find: `from '@/components/accounts/`
- Replace: `from '@/features/accounts/components/`

#### Goal Imports
- Find: `from '@/hooks/use-goals'`
- Replace: `from '@/features/goals'`

- Find: `from '@/components/goals/`
- Replace: `from '@/features/goals/components/`

#### Rule Imports
- Find: `from '@/hooks/use-rules'`
- Replace: `from '@/features/automations'`

- Find: `from '@/components/rules/`
- Replace: `from '@/features/automations/components/`

## Ficheiros a Atualizar

### Views
- [ ] `components/views/dashboard-view.tsx`
- [ ] `components/views/history-view.tsx`
- [ ] `components/views/forecast-view.tsx`
- [ ] `components/views/subscriptions-view.tsx`
- [ ] `components/views/reports-view.tsx`

### Pages
- [ ] `app/(dashboard)/page.tsx`
- [ ] `app/(dashboard)/historico/page.tsx`
- [ ] `app/(dashboard)/comparacao/page.tsx`
- [ ] `app/(dashboard)/previsao/page.tsx`
- [ ] `app/(dashboard)/assinaturas/page.tsx`
- [ ] `app/(dashboard)/regras/page.tsx`

### Components
- [ ] `components/dashboard-client.tsx`
- [ ] `components/notifications/*.tsx`
- [ ] `components/settings/*.tsx`
- [ ] `components/analytics/*.tsx`

## Status de Migração

### ✅ Completo
- Estrutura de features criada
- Componentes movidos
- Hooks copiados para features
- Index files criados

### ⏳ Pendente
- [ ] Atualizar imports em views e pages
- [ ] Atualizar imports em components
- [ ] Testar funcionamento completo
- [ ] Remover hooks antigos em `/hooks` (após confirmar que tudo funciona)
- [ ] Remover diretórios vazios (`components/transactions`, `components/accounts`, etc)

## Recomendações

1. **Use Find and Replace com cuidado** - Testar em um ficheiro antes de aplicar globalmente
2. **Actualizar incrementalmente** - Uma feature por vez
3. **Testar cada mudança** - Verificar que imports funcionam
4. **Commit depois de cada feature** - Rastreabilidade no git
