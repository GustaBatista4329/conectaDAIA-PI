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

export interface Credencial {
  email: string
  senha: string
  userId: string
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
  skills: Skill[]
  certificacoes: Certificacao[]
  curriculoUrl?: string
  alertasAtivos: boolean
  candidaturas: string[] // ids de vagas
}

export interface Skill {
  id: string
  nome: string
  categoria: 'operacao-manutencao' | 'normas-seguranca' | 'gestao' | 'tecnica' | 'idiomas'
}

export interface Certificacao {
  id: string
  nome: string
  validada: boolean
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
  totalVagasAtivas: number
}

// ============================================================
// Vaga
// ============================================================
export interface Vaga {
  id: string
  codigo: string
  titulo: string
  empresaId: string
  empresaNome: string
  setorAtuacao: string
  distrito: string
  nivel: 'Junior' | 'Pleno' | 'Sênior' | 'Gerência'
  salarioMin: number
  salarioMax: number
  tipoContrato: 'Full-time' | 'Urgent Hire' | 'Meio Período' | 'Temporário'
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

// ============================================================
// Mock DB shape (carregado do JSON)
// ============================================================
export interface MockDatabase {
  usuarios: User[]
  credenciais: Credencial[]
  candidatos: Candidato[]
  empresas: Empresa[]
  vagas: Vaga[]
  candidaturas: Candidatura[]
  denuncias: Denuncia[]
  logsAuditoria: LogAuditoria[]
  metricas: MetricasPlataforma
}
