# GitHub e Deployment - Guia Completo

## 1️⃣ Preparar Código Localmente

### Se AINDA NÃO tiver Git inicializado:

```bash
# Entrar na pasta do projeto
cd v0-cashboard

# Inicializar Git
git init

# Adicionar todos os ficheiros
git add .

# Criar primeiro commit
git commit -m "Initial commit: Refactored CashBoard architecture

- Fase 1: Consolidação de providers (-80% nesting)
- Fase 2: Decomposição dashboard-shell (-85% linhas)
- Fase 3: Extração de 5 hooks de negócio
- Fase 4: Reorganização em features
- Fase 5: Atualização de imports
- Fase 6: Simplificação finance-provider (-92% linhas)

Redução total: 4500 → 2200 linhas (-51%)"
```

### Se JÁ tiver Git inicializado:

```bash
# Ver status
git status

# Adicionar mudanças
git add .

# Commit com a refatoração
git commit -m "Refactoring complete: All 6 phases

- New feature-based structure in /features
- Consolidated providers
- Extracted 5 business hooks
- Updated imports across app
- Finance provider reduced 92%"
```

---

## 2️⃣ Criar Repositório no GitHub

### A. Ir para GitHub.com
1. Fazer login em https://github.com
2. Clicar no `+` no canto superior direito
3. Selecionar "New repository"

### B. Configurar o Repositório
- **Repository name:** `v0-cashboard` (ou nome que preferir)
- **Description:** "Interactive Financial Dashboard with AI Chatbot"
- **Public/Private:** Público (recomendado para portfolio)
- **Não** marcar "Add a README, .gitignore, or license" (já temos)

### C. Criar Repositório
Clique em "Create repository"

---

## 3️⃣ Conectar Repositório Local ao GitHub

Na pasta do projeto, executar:

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/SEU_USERNAME/v0-cashboard.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push do código
git push -u origin main
```

**Substituir `SEU_USERNAME` pelo vosso username do GitHub!**

---

## 4️⃣ Deploy no Vercel (Recomendado)

### Método A: Via Vercel Dashboard (Mais Fácil)

1. **Aceder a Vercel**
   - Ir para https://vercel.com
   - Fazer login (ou criar conta)

2. **Importar Projeto**
   - Clicar em "New Project"
   - Selecionar "Import Git Repository"
   - Pesquisar "v0-cashboard"
   - Clicar "Import"

3. **Configurar Build**
   - Framework: "Next.js"
   - Root Directory: "./" (default)
   - Build Command: "npm run build" (default)
   - Output Directory: ".next" (default)

4. **Variáveis de Ambiente**
   - Adicionar as mesmas do `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (se necessário)
   - Clique "Deploy"

5. **Esperar Deploy**
   - Vercel vai fazer build e deploy automaticamente
   - Em ~5 minutos, o site está online

### Método B: Via CLI Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

---

## 5️⃣ Configurar Supabase (Se Necessário)

### A. Variáveis de Ambiente no Vercel

1. No Vercel Dashboard → Seu Projeto → Settings → Environment Variables
2. Adicionar:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role (se precisar)
   ```

3. Salvar e fazer re-deploy:
   ```bash
   vercel --prod
   ```

### B. Configurar Supabase para domínio do Vercel

1. No Supabase Dashboard → Project Settings → Auth
2. Adicionar domínio autorizado:
   - `https://seu-projeto.vercel.app`

---

## 6️⃣ Verificar Deploy

### Após Deploy:

1. **Testar Aplicação**
   - Abrir URL do Vercel (ex: https://v0-cashboard.vercel.app)
   - Testar login, transações, etc.

2. **Ver Logs**
   - Vercel Dashboard → Logs
   - GitHub → Actions (se configurado)

3. **Troubleshooting**
   ```bash
   # Ver logs localmente
   vercel logs

   # Deploy com debug
   vercel --prod --debug
   ```

---

## 7️⃣ Atualizar Código (Depois)

### Workflow Padrão:

```bash
# Fazer mudanças localmente
# ...editar ficheiros...

# Commitar
git add .
git commit -m "Descrição da mudança"

# Push para GitHub
git push origin main

# Vercel faz deploy automaticamente
# (webhook automático)
```

---

## 8️⃣ Domínio Customizado (Opcional)

### No Vercel:

1. Settings → Domains
2. "Add Domain"
3. Seguir instruções para conectar domínio
4. Configurar DNS (se necessário)

---

## Checklist Final

- ✅ Código commitado e pusheado para GitHub
- ✅ Repositório visível em GitHub.com
- ✅ Projeto criado no Vercel
- ✅ Variáveis de ambiente configuradas
- ✅ Deploy realizado com sucesso
- ✅ Supabase autoriza domínio do Vercel
- ✅ Testar aplicação online

---

## Referências Úteis

- **GitHub Docs:** https://docs.github.com
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

## Dúvidas Comuns

**P: Preciso pagar pelo Vercel?**
R: Não! Vercel oferece tier gratuito generoso. Deploy é grátis, só paga se usar muito.

**P: Supabase é grátis?**
R: Sim! Supabase tem tier gratuito suficiente para começar.

**P: Como faço CI/CD automático?**
R: Vercel faz automaticamente quando você faz push para GitHub!

**P: Posso reverter um deploy?**
R: Sim! Vercel Dashboard → Deployments → Clique num anterior e "Promote to Production"

---

Sucesso com o deploy! 🚀
