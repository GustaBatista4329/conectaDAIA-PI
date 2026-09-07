# Estrutura do banco de dados

Documento gerado a partir dos models SQLAlchemy (`backend/app/models/`) e das
migrations Alembic (`backend/alembic/versions/`). Todas as tabelas usam o
prefixo `cd_` e são administradas via Alembic — não há nada no banco que não
esteja em uma migration.

## Tabelas de cadastro (lookup tables)

Valores como nível, status ou tipo de contrato não são fixados em código
(Enum): ficam em tabelas próprias, editáveis como dado. Todas seguem o mesmo
formato, definido em `app/models/cadastros.py`:

| Coluna    | Tipo         | Observação                              |
| --------- | ------------ | ---------------------------------------- |
| `<x>_id`  | Integer PK   | nome da PK varia por tabela (ver abaixo) |
| `codigo`  | String(50)   | `UNIQUE`, valor estável usado por FKs/validação (ex: `"senior"`) |
| `nome`    | String(100)  | rótulo de exibição (ex: `"Sênior"`)      |
| `ordem`   | Integer      | nullable, ordena a listagem              |
| `ativo`   | Boolean      | default `true`, desativa sem apagar a linha |

Tabelas de cadastro existentes (nome da tabela / PK / valores seedados na
migration `db6eab5c2b16_seed_cadastros_iniciais`):

- **`cd_tipos_usuario`** (`tipo_usuario_id`) — `candidato`, `empresa` (seedado
  como `recrutador`, renomeado para `empresa` pela migration
  `1be49ccf5355_renomear_tipo_usuario_recrutador_para_`), `admin`.
- **`cd_niveis`** (`nivel_id`) — `junior`, `pleno`, `senior`, `gerencia`.
- **`cd_categorias_skill`** (`categoria_skill_id`) — `operacao_manutencao`,
  `normas_seguranca`, `gestao`, `tecnica`, `idiomas`.
- **`cd_status_validacao_empresa`** (`status_validacao_id`) — `em_analise`,
  `validada`, `divergencia_rfb`, `suspensa`.
- **`cd_tipos_contrato`** (`tipo_contrato_id`) — `full_time`, `urgent_hire`,
  `meio_periodo`, `temporario`.
- **`cd_status_candidatura`** (`status_id`) — `triagem`, `entrevista_rh`,
  `avaliacao_tecnica`, `contratado`, `recusado`.
- **`cd_tipos_denuncia`** (`tipo_id`) — `vaga_falsa`,
  `comportamento_inadequado`, `fraude`, `outro`.
- **`cd_status_denuncia`** (`status_id`) — `pendente`, `em_investigacao`,
  `resolvida`, `ignorada`.

## Tabelas de entidade

### `cd_usuarios` (model `User`)

Identidade + autenticação. Um usuário é candidato **ou** empresa (ou nenhum,
no caso do admin) — nunca os dois.

| Coluna             | Tipo     | Constraint                                      |
| ------------------ | -------- | ------------------------------------------------ |
| `user_id`           | Integer  | PK                                               |
| `email`             | String   | `UNIQUE`                                         |
| `senha_hash`        | String   | hash bcrypt (nunca a senha em texto puro)        |
| `nome`              | String   |                                                    |
| `tipo_usuario_id`   | Integer  | FK → `cd_tipos_usuario.tipo_usuario_id`          |
| `avatar_url`        | String   | nullable                                         |
| `candidato_id`      | Integer  | FK → `cd_candidatos.candidato_id`, nullable, `UNIQUE` |
| `empresa_id`        | Integer  | FK → `cd_empresas.empresa_id`, nullable, `UNIQUE` (adicionado na migration `789ac2832991_empresa_id_unico_em_cd_usuarios`) |
| `criado_em`         | DateTime | `server_default now()`                           |

### `cd_candidatos` (model `Candidato`)

`nome` e `email` **não** estão nesta tabela — vêm de `cd_usuarios` através do
relacionamento `Candidato.usuario` (evita duplicar dado de identidade em duas
tabelas).

| Coluna              | Tipo     | Constraint                              |
| ------------------- | -------- | ---------------------------------------- |
| `candidato_id`       | Integer  | PK                                       |
| `cargo`              | String   |                                          |
| `nivel_id`           | Integer  | FK → `cd_niveis.nivel_id`                |
| `setor_atuacao`      | String   |                                          |
| `localidade`         | String   |                                          |
| `anos_experiencia`   | Integer  |                                          |
| `perfil_completo`    | Integer  | default `0`                              |
| `curriculo_url`      | String   | nullable                                 |
| `alertas_ativos`     | Boolean  | default `true`                           |

Relacionamentos: `nivel` (N:1 `Nivel`), `usuario` (1:1 `User`, opcional),
`skills` e `certificacoes` (1:N, `cascade="all, delete-orphan"` — apagar o
candidato apaga suas skills/certificações), `candidaturas` (1:N).

### `cd_skills` (model `Skill`)

| Coluna                | Tipo    | Constraint                                    |
| --------------------- | ------- | ----------------------------------------------- |
| `skill_id`             | Integer | PK                                              |
| `candidato_id`         | Integer | FK → `cd_candidatos.candidato_id`               |
| `nome`                 | String  |                                                 |
| `categoria_skill_id`   | Integer | FK → `cd_categorias_skill.categoria_skill_id`   |

Constraint única: `uq_skill_candidato_nome` em (`candidato_id`, `nome`) — o
mesmo candidato não pode ter a mesma skill duplicada.

### `cd_certificacoes` (model `Certificacao`)

| Coluna            | Tipo    | Constraint                        |
| ------------------ | ------- | ----------------------------------- |
| `certificacao_id`   | Integer | PK                                  |
| `candidato_id`      | Integer | FK → `cd_candidatos.candidato_id`   |
| `nome`              | String  |                                     |
| `validada`          | Boolean | default `false`                    |

### `cd_empresas` (model `Empresa`)

| Coluna                  | Tipo         | Constraint                                                  |
| ------------------------ | ------------ | -------------------------------------------------------------- |
| `empresa_id`              | Integer      | PK                                                              |
| `nome`                    | String       |                                                                 |
| `cnpj`                    | String(18)   | `UNIQUE`                                                        |
| `setor`                   | String       |                                                                 |
| `status_validacao_id`     | Integer      | FK → `cd_status_validacao_empresa.status_validacao_id`          |
| `sede`                    | String       |                                                                 |
| `logo_inicial`            | String       |                                                                 |

`total_vagas_ativas` **não é coluna**: é derivado por query (contagem de
`cd_vagas` ativas daquela empresa), calculado sob demanda no service e
passado como parâmetro para o schema `EmpresaRead.from_model`.

Relacionamentos: `status_validacao` (N:1), `usuario` (1:1 `User`, opcional),
`vagas` (1:N `Vaga`).

### `cd_vagas` (model `Vaga`)

| Coluna              | Tipo             | Constraint                                     |
| -------------------- | ---------------- | -------------------------------------------------- |
| `vaga_id`             | Integer          | PK                                                 |
| `codigo`              | String           | `UNIQUE`                                           |
| `titulo`              | String           |                                                    |
| `empresa_id`          | Integer          | FK → `cd_empresas.empresa_id`                      |
| `setor_atuacao`       | String           |                                                    |
| `distrito`            | String           |                                                    |
| `nivel_id`            | Integer          | FK → `cd_niveis.nivel_id`                          |
| `salario_min`         | Numeric(10,2)    |                                                    |
| `salario_max`         | Numeric(10,2)    |                                                    |
| `tipo_contrato_id`    | Integer          | FK → `cd_tipos_contrato.tipo_contrato_id`          |
| `descricao`           | Text             |                                                    |
| `ativa`               | Boolean          | default `true`                                    |
| `data_publicacao`     | DateTime         | `server_default now()`                            |

`empresa_nome`, `total_candidatos` e `match_percentual` **não são colunas**:
`empresa_nome` vem do relacionamento com `Empresa`, e os outros dois são
calculados por query (contagem de candidaturas da vaga; percentual de match
calculado sob demanda pelo `matching_service`).

Relacionamentos: `empresa` (N:1), `nivel` (N:1), `tipo_contrato` (N:1),
`habilidades` (1:N `VagaHabilidade`, `cascade="all, delete-orphan"`),
`candidaturas` (1:N).

### `cd_vaga_habilidades` (model `VagaHabilidade`)

| Coluna                | Tipo    | Constraint                  |
| ---------------------- | ------- | ------------------------------ |
| `vaga_habilidade_id`    | Integer | PK                              |
| `vaga_id`               | Integer | FK → `cd_vagas.vaga_id`         |
| `nome`                  | String  |                                 |

### `cd_candidaturas` (model `Candidatura`)

| Coluna              | Tipo     | Constraint                                     |
| -------------------- | -------- | -------------------------------------------------- |
| `candidatura_id`      | Integer  | PK                                                 |
| `candidato_id`        | Integer  | FK → `cd_candidatos.candidato_id`                  |
| `vaga_id`             | Integer  | FK → `cd_vagas.vaga_id`                            |
| `status_id`           | Integer  | FK → `cd_status_candidatura.status_id`             |
| `data_aplicacao`      | DateTime | `server_default now()`                             |
| `parecer_rh`          | Text     | nullable                                           |
| `parecer_tecnico`     | Text     | nullable                                           |
| `data_entrevista`     | DateTime | nullable                                           |

Constraint única: `uq_candidatura_candidato_vaga` em (`candidato_id`,
`vaga_id`) — um candidato não pode se candidatar duas vezes à mesma vaga (o
service usa isso para tornar `candidatar()` idempotente: se já existe,
devolve a candidatura existente em vez de dar erro).

### `cd_denuncias` (model `Denuncia`)

| Coluna         | Tipo     | Constraint                                |
| --------------- | -------- | -------------------------------------------- |
| `denuncia_id`    | Integer  | PK                                           |
| `tipo_id`        | Integer  | FK → `cd_tipos_denuncia.tipo_id`             |
| `alvo`           | String   |                                              |
| `descricao`      | Text     |                                              |
| `status_id`      | Integer  | FK → `cd_status_denuncia.status_id`          |
| `criada_em`      | DateTime | `server_default now()`                       |

### `cd_logs_auditoria` (model `LogAuditoria`)

| Coluna              | Tipo     | Constraint                |
| -------------------- | -------- | ---------------------------- |
| `log_auditoria_id`    | Integer  | PK                            |
| `tipo`                | String   |                               |
| `descricao`           | Text     |                               |
| `alvo_id`             | String   |                               |
| `criado_em`           | DateTime | `server_default now()`       |

Tabela plana de log — não referencia outras tabelas por FK; `alvo_id` guarda
o id do que foi afetado (empresa, denúncia etc.) sem constraint, porque o
alvo pode ser de tipos diferentes.

## Relacionamentos (resumo)

- `User` 1:1 `Candidato` (opcional) via `cd_usuarios.candidato_id`
- `User` 1:1 `Empresa` (opcional) via `cd_usuarios.empresa_id`
- `User` N:1 `TipoUsuario`
- `Candidato` N:1 `Nivel`; 1:N `Skill`, `Certificacao`, `Candidatura`
- `Skill` N:1 `CategoriaSkill`
- `Empresa` N:1 `StatusValidacaoEmpresa`; 1:N `Vaga`
- `Vaga` N:1 `Empresa`, `Nivel`, `TipoContrato`; 1:N `VagaHabilidade`, `Candidatura`
- `Candidatura` N:1 `Candidato`, `Vaga`, `StatusCandidatura`
- `Denuncia` N:1 `TipoDenuncia`, `StatusDenuncia`

## Histórico de migrations

1. `717e70bd40da` — create initial schema (todas as tabelas acima).
2. `db6eab5c2b16` — seed dos valores iniciais das tabelas de cadastro.
3. `789ac2832991` — adiciona `UNIQUE` em `cd_usuarios.empresa_id`.
4. `1be49ccf5355` — renomeia o `codigo`/`nome` de `cd_tipos_usuario` de
   `recrutador`/`"Recrutador"` para `empresa`/`"Empresa"` (o frontend continua
   chamando esse papel de "recrutador" — a tradução acontece em
   `frontend/src/lib/api.ts`, não no banco nem na API).
