# ConectaDAIA — Frontend (MVP)

Plataforma digital integrada do **Distrito Agroindustrial de Anápolis (DAIA)** — conectando candidatos, recrutadores e administradores do polo industrial.

Este repositório contém o **MVP do frontend** (todas as 9 telas dos designs funcionais), rodando com **dados mockados em JSON**. O projeto está preparado para plugar um backend real no futuro (FastAPI ou Spring Boot) trocando apenas a implementação em `src/lib/api.ts`.

---

## 🚀 Como rodar

Pré-requisitos: **Node.js 18+** e **npm** (ou pnpm/yarn).

```bash
# 1. Extraia o ZIP e entre na pasta
cd conectadaia-frontend

# 2. Instale as dependências
npm install

# 3. Suba o dev server
npm run dev
```

A aplicação abrirá automaticamente em **http://localhost:5173**.

Para gerar build de produção:

```bash
npm run build
npm run preview
```

---

## 🔐 Credenciais de teste

Todos os usuários usam a senha `123456`:

| Perfil         | E-mail                   | Acessa                                               |
| -------------- | ------------------------ | ---------------------------------------------------- |
| Candidato      | `candidato@daia.com`     | Painel do candidato, matching, busca de vagas        |
| Candidato alt  | `joao@daia.com`          | Mesma visão (útil p/ testes de gestão de perfil)     |
| Recrutador     | `recrutador@daia.com`    | Dashboard de métricas, Kanban de candidatos          |
| Administrador  | `admin@daia.com`         | Painel master, moderação, auditoria                  |

> 💡 Na tela de login, basta **clicar em uma das linhas de credenciais de teste** para preencher o formulário automaticamente.

---

## 🗺️ Rotas disponíveis

### Público
- `/` — Landing page institucional
- `/login` — Autenticação
- `/vagas` — Busca pública de vagas (filtros por setor, nível, faixa salarial, distrito)

### Candidato (requer login como `candidato@daia.com`)
- `/candidato/painel` — Dashboard com matching inteligente e status da candidatura
- `/candidato/perfil` — Gestão de skills (add/remove), upload de currículo, alertas

### Recrutador (requer login como `recrutador@daia.com`)
- `/recrutador/painel` — Métricas operacionais + pipeline de recrutamento
- `/recrutador/vagas/:vagaId/candidatos` — Kanban de candidatos por fase
  - Experimente: `/recrutador/vagas/v3/candidatos` (Eng. Produção Sênior)

### Administrador (requer login como `admin@daia.com`)
- `/admin/painel` — Moderação de empresas, denúncias, logs de auditoria

---

## 🏗️ Stack e decisões de arquitetura

| Camada             | Tecnologia                                                                  |
| ------------------ | --------------------------------------------------------------------------- |
| Build              | **Vite** (HMR rápido)                                                       |
| Runtime            | **React 18** + **TypeScript** (strict)                                      |
| Estilo             | **Tailwind CSS** + design tokens da bandeira Goiás/Anápolis                 |
| Componentes        | **shadcn/ui** (Radix Primitives) — versões enxutas copiadas em `src/components/ui` |
| Roteamento         | **React Router v6** com guards por `UserRole`                               |
| Ícones             | **lucide-react**                                                            |
| Estado auth        | Context + `localStorage` (persistência de sessão)                           |
| "Banco" de dados   | `src/data/mockData.json` carregado em memória via `structuredClone`         |
| Notificações       | Toast provider próprio (sem libs externas)                                  |

### Paleta visual (uso moderado da bandeira)
- `daia-blue` `#0A2A5E` — azul institucional profundo (headers, hero)
- `daia-blue-mid` `#1E4AA8` — azul médio (CTAs primários, textos de destaque)
- `daia-green` `#00A859` — verde da bandeira (sucesso, badges TOP/VERIFICADO)
- `daia-yellow` `#FFC72C` — amarelo pontual (alertas/urgência)

---

## 📂 Estrutura do projeto

```
conectadaia-frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn: button, card, badge, avatar, dialog, etc.
│   │   ├── layout/          # PublicNavbar, PublicFooter, DashboardLayout
│   │   └── shared/          # MetricCard, JobCard
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Sessão persistida em localStorage
│   │   └── DataContext.tsx  # Trigger de refetch entre componentes
│   ├── data/
│   │   └── mockData.json    # Seed: usuários, empresas, vagas, candidaturas, etc.
│   ├── hooks/
│   ├── lib/
│   │   ├── api.ts           # Camada de abstração — trocar para fetch() no futuro
│   │   └── utils.ts         # cn(), formatCurrency, formatDate, initials
│   ├── pages/               # 9 páginas (+ Placeholder p/ rotas futuras)
│   ├── routes/
│   │   └── ProtectedRoute.tsx
│   ├── types/
│   │   └── index.ts         # Contratos de dados (Vaga, Candidato, etc.)
│   ├── App.tsx              # Rotas
│   ├── main.tsx
│   └── index.css            # CSS vars shadcn + paleta DAIA
├── public/favicon.svg
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 🔌 Integração futura com backend

A camada `src/lib/api.ts` encapsula **todas as chamadas de dados** em funções tipadas
(`apiAuth`, `apiVagas`, `apiCandidatos`, `apiCandidaturas`, `apiEmpresas`, `apiAdmin`).

Hoje cada função muta um objeto em memória. Para plugar um backend real:

```typescript
// Antes (mock)
async listar(filtros: VagaFiltros) {
  return delay(db.vagas.filter(...))
}

// Depois (real — FastAPI ou Spring)
async listar(filtros: VagaFiltros) {
  const params = new URLSearchParams(filtros as any).toString()
  const res = await fetch(`${API_URL}/vagas?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}
```

**⚠️ Nota sobre convenções:** o frontend usa `camelCase` em todo lugar.
- Se o backend for **FastAPI** (`snake_case`), inserir um adapter no boundary
  usando [`camelcase-keys`](https://www.npmjs.com/package/camelcase-keys) ou similar.
- Se o backend for **Spring Boot**, a serialização do Jackson já casa direto.

---

## ✅ Funcionalidades que realmente funcionam no MVP

- [x] Login com validação real contra mock (role-based redirect após autenticar)
- [x] Proteção de rotas por papel (`candidato` / `recrutador` / `admin`)
- [x] Filtros de busca de vagas (setor multi-select, nível multi-select, faixa salarial, distrito, termo)
- [x] Candidatura a vaga (persiste no mock em memória + toast de feedback)
- [x] Matching inteligente: cálculo real baseado em interseção de skills
- [x] Kanban: mover candidato entre fases (via select), adicionar parecer RH
- [x] Perfil do candidato: add/remove skills (com categorização), upload de PDF (mock), toggle de alertas
- [x] Admin: validar empresa, suspender/investigar/ignorar denúncia
- [x] Exportação PDF/CSV (mock de intenção — log via toast)

---

## 🧭 O que **não** está no MVP

Estas rotas existem como placeholders navegáveis, prontas para implementação:
- `/setores`, `/empresas` (públicos)
- `/candidato/mensagens`, `/candidato/configuracoes`
- `/recrutador/vagas` (CRUD completo), `/recrutador/empresas`, `/recrutador/analytics`
- `/admin/*` além do painel

Funcionalidades deferidas do documento original (RF-006, RF-007):
- Sistema de notificações em tempo real
- Dashboards consolidados

---

## 🐛 Debug

No console do navegador você tem acesso ao "banco" mockado:
```javascript
__DAIA_DB__  // objeto completo com todas as entidades
```

---

**ConectaDAIA** · Distrito Agroindustrial de Anápolis · Governo de Goiás
