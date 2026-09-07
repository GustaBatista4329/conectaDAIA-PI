# ConectaDAIA — Backend

Plataforma digital integrada do **Distrito Agroindustrial de Anápolis (DAIA)** — conectando candidatos, empresas e administradores do polo industrial.

Este diretório contém a **API** do projeto: FastAPI + SQLAlchemy assíncrono (via `asyncpg`) + PostgreSQL, com migrations geridas por Alembic. É o backend real consumido pelo frontend (`frontend/`) através de `src/lib/api.ts` e `src/lib/http.ts`.

---

## 🚀 Como rodar

Pré-requisitos: **Python 3.12** e uma instância **PostgreSQL** acessível.

```bash
# 1. Entre na pasta
cd backend

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com sua DATABASE_URL, SECRET_KEY etc. (ver seção abaixo)

# 4. Aplique as migrations
alembic upgrade head

# 5. Suba o servidor
uvicorn app.main:app --reload
```

A API sobe em **http://localhost:8000**. A documentação interativa
(Swagger UI, gerada automaticamente pelo FastAPI) fica em
**http://localhost:8000/docs**.

---

## 🔐 Autenticação e dados de teste

Autenticação é via **JWT** (`POST /auth/login` recebe `email`/`senha` em
JSON e devolve um `accessToken`; as demais rotas autenticadas esperam o
header `Authorization: Bearer <token>`). O token carrega o papel do usuário
(`candidato`, `empresa` ou `admin`), usado pelos guards de rota
(`app/deps.py`).

Um banco recém-migrado começa vazio (só as tabelas de cadastro são
seedadas). Para popular dados fictícios de demonstração, chame, autenticado
como `admin`:

```
POST /admin/seed-demo
```

Isso cria (de forma idempotente — rodar de novo não duplica) candidatos,
empresas, vagas, candidaturas e denúncias fictícios. Os usuários de
candidato/empresa criados por esse seed (ex: `joao@daia.com`,
`carlos@daia.com`, `rh@pharmalogistics.daia.com`) usam a senha `123456`.
Não existe rota de cadastro para o papel `admin` — um usuário admin precisa
ser criado diretamente no banco.

---

## 🗺️ Rotas disponíveis

### `/auth`
- `POST /auth/login` — autentica e devolve o token
- `GET /auth/me` — dados do usuário autenticado

### `/candidatos`
- `POST /candidatos` — cadastro público (cria `User` + `Candidato`)
- `GET /candidatos/{id}` — obter candidato (autenticado)
- `PATCH /candidatos/{id}` — atualizar perfil (só o próprio candidato)
- `POST /candidatos/{id}/skills` — adicionar skill (só o próprio candidato)
- `DELETE /candidatos/{id}/skills/{skill_id}` — remover skill (só o próprio candidato)

### `/empresas`
- `POST /empresas` — cadastro público (cria `User` + `Empresa`)
- `GET /empresas` — listar (só `admin`)
- `PATCH /empresas/{id}/validar` — validar empresa (só `admin`)
- `PATCH /empresas/{id}/suspender` — suspender empresa (só `admin`)

### `/vagas`
- `GET /vagas` — listar com filtros (`termo`, `setor`, `distrito`, `nivel`, faixa salarial, `apenasAtivas`)
- `GET /vagas/{id}` — obter vaga
- `GET /vagas/{id}/match` — percentual de match com o candidato autenticado (só `candidato`)
- `POST /vagas` — criar vaga (só `empresa`, dona da vaga)
- `PATCH /vagas/{id}/desativar` — desativar vaga (só a `empresa` dona)

### `/candidaturas`
- `GET /candidaturas/vaga/{vagaId}` — candidaturas de uma vaga (só a `empresa` dona da vaga)
- `GET /candidaturas/candidato/{candidatoId}` — candidaturas de um candidato (só o próprio)
- `POST /candidaturas` — candidatar-se a uma vaga (só `candidato`, idempotente por par candidato+vaga)
- `PATCH /candidaturas/{id}/status` — mover fase (só a `empresa` dona da vaga)
- `PATCH /candidaturas/{id}/parecer` — adicionar parecer RH/técnico (só a `empresa` dona da vaga)

### `/admin` (todas as rotas exigem papel `admin`)
- `GET /admin/metricas` — métricas da plataforma (tudo calculado por query)
- `GET /admin/denuncias` — listar denúncias
- `PATCH /admin/denuncias/{id}/resolver` — investigar/ignorar/suspender
- `GET /admin/logs` — logs de auditoria
- `POST /admin/seed-demo` — popular dados fictícios (ver seção acima)

---

## 🏗️ Stack e decisões de arquitetura

| Camada          | Tecnologia                                                                |
| ---------------- | --------------------------------------------------------------------------- |
| Framework        | **FastAPI** + **Uvicorn**                                                    |
| ORM              | **SQLAlchemy 2.0**, assíncrono, via `asyncpg`                                |
| Migrations       | **Alembic**                                                                  |
| Banco            | **PostgreSQL**                                                               |
| Validação/config | **Pydantic v2** + **pydantic-settings** (config via `.env`)                 |
| Autenticação     | **JWT** (`python-jose`) + hash de senha via **passlib**/**bcrypt**           |
| Contrato da API  | Schemas Pydantic em `camelCase` (via `alias_generator`) — casa direto com o frontend, sem adapter |

Decisões técnicas mais detalhadas (por que tabelas de cadastro em vez de
Enum, por que campos como `totalCandidatos`/`matchPercentual` não são
colunas, etc.) estão documentadas em
[`../docs/APRENDIZADO-BACKEND.md`](../docs/APRENDIZADO-BACKEND.md) e a
estrutura completa do banco em
[`../docs/ESTRUTURA-BANCO-DE-DADOS.md`](../docs/ESTRUTURA-BANCO-DE-DADOS.md).

---

## 📂 Estrutura do projeto

```
backend/
├── app/
│   ├── main.py           # Cria o FastAPI(), registra CORS, routers e o frontend buildado
│   ├── core/
│   │   ├── config.py      # Settings (pydantic-settings): DATABASE_URL, SECRET_KEY etc via .env
│   │   └── security.py    # Hash de senha (passlib) e criação/validação de JWT
│   ├── db/
│   │   ├── base.py         # Base declarativa do SQLAlchemy
│   │   └── session.py      # Engine assíncrono + sessionmaker + get_db()
│   ├── models/             # Models SQLAlchemy: cadastros, user, candidato, empresa, vaga, candidatura, admin
│   ├── schemas/            # Schemas Pydantic (contrato da API)
│   ├── routers/            # Rotas HTTP por recurso: auth, candidatos, empresas, vagas, candidaturas, admin
│   ├── services/           # Regras de negócio por recurso
│   └── deps.py             # get_current_user, require_role (guards de papel)
├── alembic/
│   ├── env.py
│   └── versions/           # Migrations
├── alembic.ini
├── requirements.txt
└── tests/
```

---

## Variáveis de ambiente

A partir de `.env.example`:

| Variável                        | Descrição                                                                 |
| -------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                    | String de conexão com o PostgreSQL (aceita `postgres://` ou `postgresql://`; a aplicação normaliza para `postgresql+asyncpg://` internamente) |
| `SECRET_KEY`                      | Chave usada para assinar/validar os tokens JWT                            |
| `ACCESS_TOKEN_EXPIRE_MINUTES`     | Tempo de expiração do token JWT, em minutos                               |
| `CORS_ORIGINS`                    | Origens permitidas pelo CORS, separadas por vírgula (default: `http://localhost:5173`) |

---

## Migrations

Migrations ficam em `alembic/versions/` e são geridas pelo Alembic. Com o
`.env` configurado:

```bash
alembic upgrade head
```

Esse é o mesmo comando executado automaticamente antes de subir o servidor
em produção (ver `Dockerfile` na raiz do repositório).

---

**ConectaDAIA** · Distrito Agroindustrial de Anápolis
