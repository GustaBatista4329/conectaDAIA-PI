// ============================================================
// ConectaDAIA — Tipos centrais (frontend)
// Convenção camelCase. O apiClient trata mapeamento futuro.
// ============================================================

export type UserRole = 'candidato' | 'recrutador' | 'admin'

export interface User {
  id: string
  email: string
  nome: string
  role: UserRole
  avatarUrl?: string
  // Dados específicos por perfil (opcionais)
  candidatoId?: string
  empresaId?: string
}

// ============================================================
// Candidato
// ============================================================
export interface Candidato {
  id: string
  nome: string
  email: string
  cargo: string
  nivel: 'Junior' | 'Pleno' | 'Sênior' | 'Gerência'
  setorAtuacao: string
  localidade: string
  anosExperiencia: number
  avatarUrl?: string
  perfilCompleto: number // 0-100
  sobreMim?: string
  skills: Skill[]
  certificacoes: Certificacao[]
  formacoes: Formacao[]
  experiencias: Experiencia[]
  curriculoUrl?: string
  alertasAtivos: boolean
  candidaturas: string[] // ids de vagas
}

// Códigos de cd_categorias_skill (backend) — precisam bater exatamente com
// os `codigo` seedados lá (ver alembic/versions/db6eab5c2b16_*.py e
// 5ac0933c41e7_*.py), senão adicionar skill nessas categorias falha no PATCH.
export type CategoriaSkill =
  | 'operacao_manutencao'
  | 'normas_seguranca'
  | 'gestao'
  | 'tecnica'
  | 'idiomas'
  | 'desenvolvimento_software'
  | 'analise_dados_bi'
  | 'design_ux_ui'
  | 'gestao_projetos'
  | 'marketing_digital'
  | 'vendas_negociacao'
  | 'financas_contabilidade'
  | 'gestao_rh_do'
  | 'operacoes_logistica'
  | 'seguranca_informacao'
  | 'lideranca_gestao_pessoas'
  | 'comunicacao_interpessoal'
  | 'resolucao_problemas'
  | 'trabalho_equipe'
  | 'organizacao_gestao_tempo'
  | 'pensamento_estrategico'
  | 'software_ferramentas'
  | 'compliance_governanca'
  | 'atendimento_sucesso_cliente'
  | 'inovacao_criatividade'
  | 'adaptabilidade_flexibilidade'

export interface Skill {
  id: string
  nome: string
  categoria: CategoriaSkill
}

export interface Certificacao {
  id: string
  nome: string
  validada: boolean
}

// Precisa bater com app.models.candidato.AreaEstudo (backend) — é um Enum
// fixo (classificação MEC/CNE), não um cadastro editável em runtime.
export type AreaEstudo =
  | 'EDUCACAO'
  | 'ARTES_E_HUMANIDADES'
  | 'CIENCIAS_SOCIAIS_E_COMPORTAMENTAIS'
  | 'COMUNICACAO_E_INFORMACAO'
  | 'NEGOCIOS_E_ADMINISTRACAO'
  | 'DIREITO'
  | 'CIENCIAS_NATURAIS'
  | 'MATEMATICA_E_ESTATISTICA'
  | 'COMPUTACAO_E_TECNOLOGIA_DA_INFORMACAO'
  | 'ENGENHARIAS'
  | 'ARQUITETURA_E_CONSTRUCAO'
  | 'PRODUCAO_INDUSTRIAL'
  | 'AGRICULTURA_E_VETERINARIA'
  | 'SAUDE_E_BEM_ESTAR'
  | 'TURISMO_HOTELARIA_E_GASTRONOMIA'
  | 'SEGURANCA_E_DEFESA'
  | 'TRANSPORTES'
  | 'INTERDISCIPLINAR'
  | 'OTHER'

export interface Formacao {
  id: string
  instituicao: string
  curso: string
  areaEstudo: AreaEstudo
  dataInicio: string // ISO yyyy-mm-dd
  dataFormatura: string // ISO yyyy-mm-dd — pode ser futura (curso em andamento)
}

// Precisam bater com app.models.candidato.TipoTrabalho / LocalTrabalho
// (backend) — Enums fixos, não cadastro editável em runtime.
export type TipoTrabalho =
  | 'TEMPO_INTEGRAL'
  | 'MEIO_PERIODO'
  | 'AUTONOMO'
  | 'FREELANCER'
  | 'CONTRATO'
  | 'ESTAGIO'
  | 'APRENDIZ'
  | 'CONTRATO_INDIRETO'
  | 'PROGRAMA_DE_LIDERANCA'
  | 'OTHER'

export type LocalTrabalho = 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO'

export interface Experiencia {
  id: string
  empresaNome: string
  cargo: string
  tipoTrabalho: TipoTrabalho
  localTrabalho: LocalTrabalho
  dataInicio: string // ISO yyyy-mm-dd
  dataFim?: string // ISO yyyy-mm-dd — ausente quando trabalhandoAtualmente
  trabalhandoAtualmente: boolean
}

// ============================================================
// Empresa
// ============================================================
export interface Empresa {
  id: string
  nome: string
  cnpj: string
  setor: string
  statusValidacao: 'em_analise' | 'validada' | 'divergencia_rfb' | 'suspensa'
  sede: string
  logoInicial: string
  sobreEmpresa?: string
  totalVagasAtivas: number
}

// ============================================================
// Vaga
// ============================================================
// Área profissional do CARGO da vaga (o que ela faz), não o setor/indústria
// da empresa que publica — precisa bater com app.models.enums.AreaProfissional.
export type AreaProfissional =
  | 'ADMINISTRACAO'
  | 'RECURSOS_HUMANOS'
  | 'JURIDICO_ADVOCACIA'
  | 'CONTABILIDADE'
  | 'FINANCEIRO'
  | 'MARKETING'
  | 'VENDAS_COMERCIAL'
  | 'ATENDIMENTO_AO_CLIENTE'
  | 'TECNOLOGIA_DA_INFORMACAO'
  | 'ENGENHARIA_CIVIL'
  | 'ENGENHARIA_MECANICA'
  | 'ENGENHARIA_ELETRICA'
  | 'ENGENHARIA_DE_PRODUCAO'
  | 'ENGENHARIA_QUIMICA'
  | 'ENGENHARIA_DE_ALIMENTOS'
  | 'ENGENHARIA_AMBIENTAL'
  | 'ARQUITETURA'
  | 'LOGISTICA'
  | 'COMPRAS_SUPRIMENTOS'
  | 'PRODUCAO_OPERACOES_INDUSTRIAIS'
  | 'MANUTENCAO_INDUSTRIAL'
  | 'QUALIDADE'
  | 'SEGURANCA_DO_TRABALHO'
  | 'SAUDE_E_MEDICINA'
  | 'ENFERMAGEM'
  | 'FARMACIA'
  | 'NUTRICAO'
  | 'PSICOLOGIA'
  | 'EDUCACAO_DOCENCIA'
  | 'DESIGN_GRAFICO'
  | 'COMUNICACAO_JORNALISMO'
  | 'PUBLICIDADE_E_PROPAGANDA'
  | 'RECEPCAO_SECRETARIADO'
  | 'ALMOXARIFADO'
  | 'TRANSPORTE_MOTORISTA'
  | 'CONSTRUCAO_CIVIL'
  | 'ELETRICISTA'
  | 'MECANICA_AUTOMOTIVA'
  | 'METALURGIA_SOLDA'
  | 'AGRONOMIA'
  | 'VETERINARIA'
  | 'ZOOTECNIA'
  | 'MEIO_AMBIENTE_SUSTENTABILIDADE'
  | 'AUDITORIA'
  | 'CONTROLADORIA'
  | 'ECONOMIA'
  | 'ESTATISTICA_CIENCIA_DE_DADOS'
  | 'BIOMEDICINA'
  | 'BIOLOGIA_BIOTECNOLOGIA'
  | 'QUIMICA_LABORATORIO'
  | 'TURISMO_HOTELARIA'
  | 'GASTRONOMIA'
  | 'SERVICOS_GERAIS_LIMPEZA'
  | 'SEGURANCA_PATRIMONIAL'
  | 'TELECOMUNICACOES'
  | 'ELETRONICA'
  | 'AUTOMACAO_INDUSTRIAL'
  | 'COMERCIO_EXTERIOR'
  | 'RELACOES_PUBLICAS'
  | 'GESTAO_DE_PROJETOS'
  | 'OUTRA'

export interface Vaga {
  id: string
  codigo: string
  titulo: string
  empresaId: string
  empresaNome: string
  areaProfissional: AreaProfissional
  distrito: string
  localTrabalho: LocalTrabalho
  nivel: 'Junior' | 'Pleno' | 'Sênior' | 'Gerência'
  // Ausentes juntos = "salário a combinar" (não é obrigatório).
  salarioMin?: number
  salarioMax?: number
  tipoContrato: 'Tempo Integral' | 'Contratação Urgente' | 'Meio Período' | 'Temporário'
  descricao: string
  habilidadesRequeridas: string[]
  ativa: boolean
  dataPublicacao: string
  totalCandidatos: number
  matchPercentual?: number // calculado por candidato
}

// ============================================================
// Candidatura (processo seletivo)
// ============================================================
export type StatusCandidatura =
  | 'triagem'
  | 'entrevista_rh'
  | 'avaliacao_tecnica'
  | 'contratado'
  | 'recusado'

export interface Candidatura {
  id: string
  candidatoId: string
  vagaId: string
  status: StatusCandidatura
  dataAplicacao: string
  parecerRh?: string
  parecerTecnico?: string
  dataEntrevista?: string
}

// ============================================================
// Administração
// ============================================================
export interface Denuncia {
  id: string
  tipo: 'vaga_falsa' | 'comportamento_inadequado' | 'fraude' | 'outro'
  alvo: string
  descricao: string
  status: 'pendente' | 'em_investigacao' | 'resolvida' | 'ignorada'
  criadaEm: string
}

export interface LogAuditoria {
  id: string
  tipo: string
  descricao: string
  alvoId: string
  criadoEm: string
}

export interface MetricasPlataforma {
  vagasAtivas: number
  novosCandidatos: number
  empresasValidadas: number
  tempoMedioContratacao: number // em dias
  denunciasPendentes: number
}
