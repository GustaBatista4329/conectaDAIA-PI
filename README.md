# ConectaDAIA

Plataforma digital integrada do **Distrito Agroindustrial de Anápolis (DAIA)**,
conectando candidatos, empresas (recrutadores) e administradores do polo
industrial. Resolve o problema de dispersão entre a busca de vagas do
distrito, o cadastro/triagem de candidatos e a validação de empresas, reunindo
tudo em um único fluxo: candidatos se cadastram e se candidatam a vagas com
cálculo de compatibilidade (match) por skills; empresas publicam vagas e
conduzem candidatos por um pipeline de seleção (Kanban); administradores
validam empresas, moderam denúncias e acompanham métricas da plataforma.

Projeto Integrador (6º período de Engenharia de Software).

## Stack

**Backend** (`backend/`) — ver `backend/requirements.txt`:
- Python 3.12, FastAPI, Uvicorn
- SQLAlchemy 2.0 (assíncrono, via `asyncpg`) + Alembic para migrations
- PostgreSQL
- Pydantic / Pydantic Settings (validação e configuração via `.env`)
- Autenticação JWT (`python-jose`) com hash de senha via `passlib`/`bcrypt`

**Frontend** (`frontend/`) — ver `frontend/package.json`:
- React 18 + TypeScript
- Vite (build e dev server)
- Tailwind CSS + componentes baseados em Radix UI (padrão shadcn/ui)
- React Router v6

O `Dockerfile` na raiz faz um build multi-etapa: builda o frontend (Node) e
copia o resultado (`frontend/dist`) para dentro da imagem do backend
(Python), que o serve como arquivos estáticos além de expor a API — uma
imagem só, publicada no Railway.

## Estrutura do monorepo

```
conectaDAIA-PI/
├── Dockerfile              # Build multi-etapa: frontend (Node) + backend (Python) juntos
├── backend/
│   ├── app/
│   │   ├── main.py         # Cria o FastAPI(), registra CORS, routers e o frontend buildado
│   │   ├── core/            # Configuração (.env) e segurança (hash de senha, JWT)
│   │   ├── db/              # Engine assíncrono, sessionmaker, Base declarativa
│   │   ├── models/          # Models SQLAlchemy (tabelas)
│   │   ├── schemas/         # Schemas Pydantic (contrato da API, camelCase)
│   │   ├── routers/         # Rotas HTTP por recurso (auth, candidatos, empresas, vagas, candidaturas, admin)
│   │   ├── services/        # Regras de negócio
│   │   └── deps.py          # Dependências compartilhadas (usuário autenticado, guards de papel)
│   ├── alembic/             # Migrations (alembic/versions/) e alembic/env.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/      # UI (shadcn/ui) + layout + componentes compartilhados
│   │   ├── contexts/        # AuthContext, DataContext
│   │   ├── hooks/
│   │   ├── lib/             # api.ts (chamadas tipadas) e http.ts (cliente HTTP + JWT)
│   │   ├── pages/
│   │   ├── routes/          # ProtectedRoute
│   │   └── types/
│   └── package.json
└── docs/                    # Documentação técnica (estrutura do banco, decisões de backend)
```

## Rodando localmente

Backend e frontend são rodados (e documentados) separadamente:

- **[`backend/README.md`](backend/README.md)** — como instalar, configurar
  variáveis de ambiente, aplicar migrations e subir a API localmente, além
  das rotas disponíveis.
- **[`frontend/README.md`](frontend/README.md)** — como instalar e subir o
  dev server, rotas da aplicação e credenciais de teste.

Cada pacote tem seu próprio `.env.example` (`backend/.env.example` e
`frontend/.env.example`) com as variáveis necessárias — copie para `.env` e
preencha antes de rodar.

## Documentação técnica

A pasta [`docs/`](docs/) reúne documentação de arquitetura/decisões do
backend:

- [`docs/ESTRUTURA-BANCO-DE-DADOS.md`](docs/ESTRUTURA-BANCO-DE-DADOS.md) — tabelas, colunas, relacionamentos e constraints do banco.
- [`docs/APRENDIZADO-BACKEND.md`](docs/APRENDIZADO-BACKEND.md) — decisões técnicas do backend.

## Produção

A aplicação está publicada no Railway: https://conectadaia-pi-production.up.railway.app/
