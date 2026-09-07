# Decisões técnicas do backend

Registro das decisões técnicas do backend que estão explicadas em comentários
no próprio código, reunidas aqui para não ficarem espalhadas. Cada item indica
o arquivo de origem.

## Frontend servido pelo backend (`app/main.py`)

O `Dockerfile` builda o frontend (`npm run build`) e copia `frontend/dist`
para dentro da imagem do backend, como `frontend_dist`. O FastAPI registra
uma rota catch-all (`GET /{full_path:path}`) que serve esse diretório: se o
caminho pedido existe como arquivo estático, devolve o arquivo; senão,
devolve `index.html` (necessário para o roteamento client-side do React).
Essa rota só é registrada se `frontend_dist` existir (não existe em
desenvolvimento local, quando o front roda separado via Vite), e precisa ser
a **última** registrada — sendo um catch-all, qualquer rota de API registrada
depois dela nunca seria alcançada.

## Normalização de `DATABASE_URL` (`app/core/config.py`)

Railway (e outros provedores) entrega a variável `DATABASE_URL` como
`postgres://...` ou `postgresql://...` (driver síncrono). A aplicação usa
`asyncpg`, então um `field_validator` no `Settings` reescreve o início da URL
para `postgresql+asyncpg://` automaticamente. Isso evita ter que montar a URL
manualmente no painel do Railway. Localmente, o `.env` já pode vir com
`+asyncpg` e passa direto, sem alteração.

## Tabelas de cadastro em vez de Enum fixo no código (`app/models/cadastros.py`)

Valores como nível, status de candidatura, tipo de contrato etc. não são
fixados como Enum em Python — são registros em tabelas próprias (`cd_*`),
gerenciáveis como dado (ver [ESTRUTURA-BANCO-DE-DADOS.md](ESTRUTURA-BANCO-DE-DADOS.md)
para o formato). Cada tabela de entidade referencia a de cadastro por FK, e o
"código" (`codigo`) é o valor estável usado em validação e nas rotas, enquanto
o "nome" é o rótulo de exibição.

## `CamelModel`: conversão snake_case ↔ camelCase (`app/schemas/base.py`)

Todo schema Pydantic da API herda de `CamelModel`, que usa
`alias_generator=to_camel` para expor os campos em `camelCase` no JSON (o
contrato que o frontend espera) enquanto o código Python continua em
`snake_case`. `from_attributes=True` permite construir o schema direto a
partir do objeto SQLAlchemy. Como o FastAPI serializa a resposta usando os
aliases, o frontend nunca precisa converter `snake_case` — só traduz tipos
(IDs numéricos → `string`) e o nome do papel `empresa` → `recrutador`
(ver comentário no topo de `frontend/src/lib/api.ts`).

## `OAuth2PasswordBearer` usado só para o Swagger (`app/deps.py`)

O login real (`POST /auth/login`) recebe um corpo JSON, não o formulário
padrão do OAuth2. Ainda assim, `OAuth2PasswordBearer` é usado como
dependência só pela sua capacidade de extrair o header
`Authorization: Bearer ...` e habilitar o botão "Authorize" na documentação
automática (Swagger UI) — `tokenUrl` não é efetivamente chamado por um fluxo
OAuth2 de verdade.

## Guard de papel reaproveitável (`app/deps.py`, `app/routers/admin.py`)

`require_role(*roles)` é uma factory de dependência reaproveitável:
`Depends(require_role("admin"))`, `Depends(require_role("candidato", "empresa"))`
etc. No router de admin, o guard é aplicado uma vez no `APIRouter(...,
dependencies=[Depends(require_role("admin"))])`, em vez de repetido em cada
rota — toda rota daquele router já exige o papel admin.

## Campos derivados por query, não armazenados (vários arquivos)

Vários campos que a API expõe não existem como coluna: `Empresa.total_vagas_ativas`,
`Vaga.total_candidatos`, `Vaga.match_percentual` e todos os campos de
`MetricasRead` (métricas do painel admin) são calculados por query no momento
da resposta, evitando manter um dado duplicado que ficaria desatualizado.
Ver comentários em `app/models/empresa.py`, `app/models/vaga.py` e
`app/schemas/admin.py`.

## Cálculo de match candidato↔vaga (`app/services/matching_service.py`)

`calcular_match` compara (case-insensitive, com correspondência parcial de
substring) as skills do candidato com as habilidades exigidas pela vaga: a
base do percentual é a proporção de habilidades da vaga encontradas nas
skills do candidato, com um bônus de 15 pontos quando o perfil do candidato
está mais de 80% completo, limitado a 100.

## Datas sem timezone no banco (`app/services/admin_service.py`)

As colunas de data (`criado_em`, `data_aplicacao` etc.) são
`TIMESTAMP WITHOUT TIME ZONE`. Ao comparar com "agora" em Python, o código
usa `datetime.now(timezone.utc).replace(tzinfo=None)` — um datetime "naive"
— porque o driver rejeita comparar uma coluna sem timezone com um valor que
tem timezone.

## Idempotência

- `candidatura_service.candidatar`: se já existe uma candidatura para o par
  candidato+vaga (constraint única `uq_candidatura_candidato_vaga`), devolve
  a candidatura existente em vez de lançar erro — mesmo comportamento do
  protótipo original em mock.
- `admin_service.seed_demo`: popula dados fictícios para o sistema não ficar
  vazio; roda de novo sem duplicar, completando apenas o que ainda não existe
  (usa a combinação `alvo`+`tipo` para identificar denúncias já seedadas,
  já que `alvo` sozinho não é único o bastante).

## Regras de negócio vindas do documento do projeto

Alguns comentários remetem a regras numeradas de um documento de
especificação do projeto (não versionado neste repositório):

- RNE-001 (`app/services/vaga_service.py`): só a empresa dona de uma vaga
  pode alterá-la.
- RNE-003 (`app/services/matching_service.py`): a regra de cálculo de match
  descrita acima.
