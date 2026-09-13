/**
 * ============================================================
 * apiClient — Camada de abstração de dados
 * ============================================================
 * Fala de verdade com o backend real (FastAPI), via http.ts.
 * Assinaturas idênticas às do mock original — nenhuma tela precisou mudar.
 *
 * Duas traduções acontecem na fronteira, escondidas do resto do app:
 * 1. IDs: backend manda número (id: 3), os tipos do frontend esperam string
 *    (id: string) — todo id vira String(...) ao entrar aqui.
 * 2. Role "empresa" (backend) <-> "recrutador" (frontend): decisão do
 *    projeto foi não renomear rotas/telas do frontend, só traduzir aqui.
 * ============================================================
 */

import { apiFetch, apiFetchOrNull, clearToken, setToken, ApiError } from './http'
import { NIVEL_NOME_PARA_CODIGO } from './vagaConstants'
import type {
  AreaEstudo,
  AreaProfissional,
  Candidato,
  Candidatura,
  Certificacao,
  Denuncia,
  Empresa,
  Experiencia,
  Formacao,
  LocalTrabalho,
  LogAuditoria,
  MetricasPlataforma,
  Skill,
  StatusCandidatura,
  TipoTrabalho,
  User,
  UserRole,
  Vaga,
} from '@/types'

// ============================================================
// Tradução de valores entre o formato do backend e o do frontend
// ============================================================
function roleParaFrontend(role: 'candidato' | 'empresa' | 'admin'): UserRole {
  return role === 'empresa' ? 'recrutador' : role
}


// ============================================================
// Formatos crus que o backend devolve (camelCase, mas id numérico)
// ============================================================
interface BackendUser {
  id: number
  email: string
  nome: string
  role: 'candidato' | 'empresa' | 'admin'
  avatarUrl: string | null
  candidatoId: number | null
  empresaId: number | null
}
interface BackendSkill {
  id: number
  nome: string
  categoria: string
}
interface BackendCertificacao {
  id: number
  nome: string
  validada: boolean
}
interface BackendFormacao {
  id: number
  instituicao: string
  curso: string
  areaEstudo: string
  dataInicio: string
  dataFormatura: string
}
interface BackendExperiencia {
  id: number
  empresaNome: string
  cargo: string
  tipoTrabalho: string
  localTrabalho: string
  dataInicio: string
  dataFim: string | null
  trabalhandoAtualmente: boolean
}
interface BackendCandidato {
  id: number
  nome: string
  email: string
  cargo: string
  nivel: string
  setorAtuacao: string
  localidade: string
  anosExperiencia: number
  avatarUrl: string | null
  perfilCompleto: number
  sobreMim: string | null
  skills: BackendSkill[]
  certificacoes: BackendCertificacao[]
  formacoes: BackendFormacao[]
  experiencias: BackendExperiencia[]
  curriculoUrl: string | null
  alertasAtivos: boolean
  candidaturas: number[]
}
interface BackendVaga {
  id: number
  codigo: string
  titulo: string
  empresaId: number
  empresaNome: string
  areaProfissional: string
  distrito: string
  localTrabalho: string
  nivel: string
  salarioMin: number | null
  salarioMax: number | null
  tipoContrato: string
  descricao: string
  habilidadesRequeridas: string[]
  ativa: boolean
  dataPublicacao: string
  totalCandidatos: number
  matchPercentual: number | null
}
interface BackendCandidatura {
  id: number
  candidatoId: number
  vagaId: number
  status: StatusCandidatura
  dataAplicacao: string
  parecerRh: string | null
  parecerTecnico: string | null
  dataEntrevista: string | null
}
interface BackendEmpresa {
  id: number
  nome: string
  cnpj: string
  setor: string
  statusValidacao: string
  sede: string
  logoInicial: string
  sobreEmpresa: string | null
  totalVagasAtivas: number
}
interface BackendDenuncia {
  id: number
  tipo: string
  alvo: string
  descricao: string
  status: string
  criadaEm: string
}
interface BackendLog {
  id: number
  tipo: string
  descricao: string
  alvoId: string
  criadoEm: string
}

// ============================================================
// Mapeadores: BackendX -> X (tipo do frontend)
// ============================================================
function mapUser(u: BackendUser): User {
  return {
    id: String(u.id),
    email: u.email,
    nome: u.nome,
    role: roleParaFrontend(u.role),
    avatarUrl: u.avatarUrl ?? undefined,
    candidatoId: u.candidatoId != null ? String(u.candidatoId) : undefined,
    empresaId: u.empresaId != null ? String(u.empresaId) : undefined,
  }
}

function mapSkill(s: BackendSkill): Skill {
  return { id: String(s.id), nome: s.nome, categoria: s.categoria as Skill['categoria'] }
}

function mapCertificacao(c: BackendCertificacao): Certificacao {
  return { id: String(c.id), nome: c.nome, validada: c.validada }
}

function mapFormacao(f: BackendFormacao): Formacao {
  return {
    id: String(f.id),
    instituicao: f.instituicao,
    curso: f.curso,
    areaEstudo: f.areaEstudo as AreaEstudo,
    dataInicio: f.dataInicio,
    dataFormatura: f.dataFormatura,
  }
}

function mapExperiencia(e: BackendExperiencia): Experiencia {
  return {
    id: String(e.id),
    empresaNome: e.empresaNome,
    cargo: e.cargo,
    tipoTrabalho: e.tipoTrabalho as TipoTrabalho,
    localTrabalho: e.localTrabalho as LocalTrabalho,
    dataInicio: e.dataInicio,
    dataFim: e.dataFim ?? undefined,
    trabalhandoAtualmente: e.trabalhandoAtualmente,
  }
}

function mapCandidato(c: BackendCandidato): Candidato {
  return {
    id: String(c.id),
    nome: c.nome,
    email: c.email,
    cargo: c.cargo,
    nivel: c.nivel as Candidato['nivel'],
    setorAtuacao: c.setorAtuacao,
    localidade: c.localidade,
    anosExperiencia: c.anosExperiencia,
    avatarUrl: c.avatarUrl ?? undefined,
    perfilCompleto: c.perfilCompleto,
    sobreMim: c.sobreMim ?? undefined,
    skills: c.skills.map(mapSkill),
    certificacoes: c.certificacoes.map(mapCertificacao),
    formacoes: c.formacoes.map(mapFormacao),
    experiencias: c.experiencias.map(mapExperiencia),
    curriculoUrl: c.curriculoUrl ?? undefined,
    alertasAtivos: c.alertasAtivos,
    candidaturas: c.candidaturas.map(String),
  }
}

function mapVaga(v: BackendVaga): Vaga {
  return {
    id: String(v.id),
    codigo: v.codigo,
    titulo: v.titulo,
    empresaId: String(v.empresaId),
    empresaNome: v.empresaNome,
    areaProfissional: v.areaProfissional as AreaProfissional,
    distrito: v.distrito,
    localTrabalho: v.localTrabalho as LocalTrabalho,
    nivel: v.nivel as Vaga['nivel'],
    salarioMin: v.salarioMin ?? undefined,
    salarioMax: v.salarioMax ?? undefined,
    tipoContrato: v.tipoContrato as Vaga['tipoContrato'],
    descricao: v.descricao,
    habilidadesRequeridas: v.habilidadesRequeridas,
    ativa: v.ativa,
    dataPublicacao: v.dataPublicacao,
    totalCandidatos: v.totalCandidatos,
    matchPercentual: v.matchPercentual ?? undefined,
  }
}

function mapCandidatura(c: BackendCandidatura): Candidatura {
  return {
    id: String(c.id),
    candidatoId: String(c.candidatoId),
    vagaId: String(c.vagaId),
    status: c.status,
    dataAplicacao: c.dataAplicacao,
    parecerRh: c.parecerRh ?? undefined,
    parecerTecnico: c.parecerTecnico ?? undefined,
    dataEntrevista: c.dataEntrevista ?? undefined,
  }
}

function mapEmpresa(e: BackendEmpresa): Empresa {
  return {
    id: String(e.id),
    nome: e.nome,
    cnpj: e.cnpj,
    setor: e.setor,
    statusValidacao: e.statusValidacao as Empresa['statusValidacao'],
    sede: e.sede,
    logoInicial: e.logoInicial,
    sobreEmpresa: e.sobreEmpresa ?? undefined,
    totalVagasAtivas: e.totalVagasAtivas,
  }
}

function mapDenuncia(d: BackendDenuncia): Denuncia {
  return {
    id: String(d.id),
    tipo: d.tipo as Denuncia['tipo'],
    alvo: d.alvo,
    descricao: d.descricao,
    status: d.status as Denuncia['status'],
    criadaEm: d.criadaEm,
  }
}

function mapLog(l: BackendLog): LogAuditoria {
  return { id: String(l.id), tipo: l.tipo, descricao: l.descricao, alvoId: l.alvoId, criadoEm: l.criadoEm }
}

// ============================================================
// AUTH
// ============================================================
export interface CandidatoRegistro {
  email: string
  senha: string
  nome: string
  cargo: string
  nivel: string // codigo de cd_niveis (junior/pleno/senior/gerencia)
  setorAtuacao: string
  localidade: string
  anosExperiencia: number
}

export interface EmpresaRegistro {
  email: string
  senha: string
  nome: string
  cnpj: string
  setor: string
  sede: string
}

export const apiAuth = {
  async login(email: string, senha: string): Promise<User | null> {
    try {
      const res = await apiFetch<{ accessToken: string; tokenType: string; user: BackendUser }>(
        '/auth/login',
        { method: 'POST', body: { email, senha }, auth: false },
      )
      setToken(res.accessToken)
      return mapUser(res.user)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null
      throw e
    }
  },

  /** Cadastro público de candidato — cria User (role=candidato) + Candidato e já autentica. */
  async registrarCandidato(dados: CandidatoRegistro): Promise<User> {
    const res = await apiFetch<{ accessToken: string; tokenType: string; user: BackendUser }>(
      '/candidatos',
      { method: 'POST', body: dados, auth: false },
    )
    setToken(res.accessToken)
    return mapUser(res.user)
  },

  /** Cadastro público de empresa — cria User (role=empresa) + Empresa e já autentica. */
  async registrarEmpresa(dados: EmpresaRegistro): Promise<User> {
    const res = await apiFetch<{ accessToken: string; tokenType: string; user: BackendUser }>(
      '/empresas',
      { method: 'POST', body: dados, auth: false },
    )
    setToken(res.accessToken)
    return mapUser(res.user)
  },

  /** Não existe endpoint de buscar usuário por id arbitrário no backend real
   * (seria falha de segurança). Mantido só pra não quebrar a assinatura —
   * sempre devolve o usuário do token atual, via /auth/me. */
  async getUserById(_id: string): Promise<User | null> {
    return apiAuth.me()
  },

  async me(): Promise<User | null> {
    const u = await apiFetchOrNull<BackendUser>('/auth/me')
    if (!u) {
      clearToken()
      return null
    }
    return mapUser(u)
  },

  logout(): void {
    clearToken()
  },

  /** Atualiza dados de identidade do usuário logado (hoje, só `nome`). */
  async atualizarPerfil(patch: { nome?: string }): Promise<User | null> {
    const u = await apiFetchOrNull<BackendUser>('/auth/me', {
      method: 'PATCH',
      body: { nome: patch.nome },
    })
    return u ? mapUser(u) : null
  },
}

// ============================================================
// VAGAS
// ============================================================
export interface VagaFiltros {
  termo?: string
  areaProfissional?: AreaProfissional
  distrito?: string
  localTrabalho?: LocalTrabalho
  nivel?: string
  salarioMin?: number
  salarioMax?: number
  apenasAtivas?: boolean
}

function filtrosParaQueryString(filtros: VagaFiltros, extras: Record<string, string> = {}): string {
  const params = new URLSearchParams(extras)
  if (filtros.termo) params.set('termo', filtros.termo)
  if (filtros.areaProfissional) params.set('areaProfissional', filtros.areaProfissional)
  if (filtros.distrito) params.set('distrito', filtros.distrito)
  if (filtros.localTrabalho) params.set('localTrabalho', filtros.localTrabalho)
  if (filtros.nivel) params.set('nivel', NIVEL_NOME_PARA_CODIGO[filtros.nivel] ?? filtros.nivel)
  if (typeof filtros.salarioMin === 'number') params.set('salarioMin', String(filtros.salarioMin))
  if (typeof filtros.salarioMax === 'number') params.set('salarioMax', String(filtros.salarioMax))
  if (filtros.apenasAtivas === false) params.set('apenasAtivas', 'false')
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const apiVagas = {
  async listar(filtros: VagaFiltros = {}): Promise<Vaga[]> {
    const vagas = await apiFetch<BackendVaga[]>(`/vagas${filtrosParaQueryString(filtros)}`, {
      auth: false,
    })
    return vagas.map(mapVaga)
  },

  async obter(id: string): Promise<Vaga | null> {
    const v = await apiFetchOrNull<BackendVaga>(`/vagas/${id}`, { auth: false })
    return v ? mapVaga(v) : null
  },

  async vagasDaEmpresa(empresaId: string): Promise<Vaga[]> {
    const vagas = await apiFetch<BackendVaga[]>(
      `/vagas${filtrosParaQueryString({ apenasAtivas: false }, { empresaId })}`,
      { auth: false },
    )
    return vagas.map(mapVaga)
  },

  /** candidatoId é ignorado — o backend usa o candidato do próprio token. */
  async calcularMatch(_candidatoId: string, vagaId: string): Promise<number> {
    const r = await apiFetchOrNull<{ matchPercentual: number }>(`/vagas/${vagaId}/match`)
    return r?.matchPercentual ?? 0
  },

  async desativar(id: string): Promise<boolean> {
    const v = await apiFetchOrNull<BackendVaga>(`/vagas/${id}/desativar`, { method: 'PATCH' })
    return v !== null
  },

  /** `nivel`/`tipoContrato` aqui já são o `codigo` do cadastro (ex: "senior",
   * "full_time"), não o nome de exibição — igual ao que o backend espera.
   * `empresaId` não entra no corpo: o backend usa a empresa do próprio token. */
  async criar(dados: {
    titulo: string
    areaProfissional: AreaProfissional
    distrito: string
    localTrabalho: LocalTrabalho
    nivel: string
    /** Ambos ausentes = vaga "salário a combinar" (não é obrigatório). */
    salarioMin?: number
    salarioMax?: number
    tipoContrato: string
    descricao: string
    habilidadesRequeridas: string[]
  }): Promise<Vaga> {
    const v = await apiFetch<BackendVaga>('/vagas', { method: 'POST', body: dados })
    return mapVaga(v)
  },
}

// ============================================================
// CANDIDATOS
// ============================================================
export const apiCandidatos = {
  async obter(id: string): Promise<Candidato | null> {
    const c = await apiFetchOrNull<BackendCandidato>(`/candidatos/${id}`)
    return c ? mapCandidato(c) : null
  },

  async atualizar(id: string, patch: Partial<Candidato>): Promise<Candidato | null> {
    const body: Record<string, unknown> = {}
    if (patch.cargo !== undefined) body.cargo = patch.cargo
    if (patch.nivel !== undefined) body.nivel = NIVEL_NOME_PARA_CODIGO[patch.nivel] ?? patch.nivel
    if (patch.setorAtuacao !== undefined) body.setorAtuacao = patch.setorAtuacao
    if (patch.localidade !== undefined) body.localidade = patch.localidade
    if (patch.anosExperiencia !== undefined) body.anosExperiencia = patch.anosExperiencia
    if (patch.sobreMim !== undefined) body.sobreMim = patch.sobreMim
    if (patch.curriculoUrl !== undefined) body.curriculoUrl = patch.curriculoUrl
    if (patch.alertasAtivos !== undefined) body.alertasAtivos = patch.alertasAtivos

    const c = await apiFetchOrNull<BackendCandidato>(`/candidatos/${id}`, { method: 'PATCH', body })
    return c ? mapCandidato(c) : null
  },

  async adicionarSkill(candidatoId: string, nome: string, categoria: string): Promise<Candidato | null> {
    const c = await apiFetchOrNull<BackendCandidato>(`/candidatos/${candidatoId}/skills`, {
      method: 'POST',
      body: { nome, categoria },
    })
    return c ? mapCandidato(c) : null
  },

  async removerSkill(candidatoId: string, skillId: string): Promise<Candidato | null> {
    const c = await apiFetchOrNull<BackendCandidato>(`/candidatos/${candidatoId}/skills/${skillId}`, {
      method: 'DELETE',
    })
    return c ? mapCandidato(c) : null
  },

  async adicionarFormacao(
    candidatoId: string,
    dados: { instituicao: string; curso: string; areaEstudo: AreaEstudo; dataInicio: string; dataFormatura: string },
  ): Promise<Candidato | null> {
    const c = await apiFetchOrNull<BackendCandidato>(`/candidatos/${candidatoId}/formacoes`, {
      method: 'POST',
      body: dados,
    })
    return c ? mapCandidato(c) : null
  },

  async removerFormacao(candidatoId: string, formacaoId: string): Promise<Candidato | null> {
    const c = await apiFetchOrNull<BackendCandidato>(
      `/candidatos/${candidatoId}/formacoes/${formacaoId}`,
      { method: 'DELETE' },
    )
    return c ? mapCandidato(c) : null
  },

  async adicionarExperiencia(
    candidatoId: string,
    dados: {
      empresaNome: string
      cargo: string
      tipoTrabalho: TipoTrabalho
      localTrabalho: LocalTrabalho
      dataInicio: string
      dataFim?: string
      trabalhandoAtualmente: boolean
    },
  ): Promise<Candidato | null> {
    const c = await apiFetchOrNull<BackendCandidato>(`/candidatos/${candidatoId}/experiencias`, {
      method: 'POST',
      body: dados,
    })
    return c ? mapCandidato(c) : null
  },

  async removerExperiencia(candidatoId: string, experienciaId: string): Promise<Candidato | null> {
    const c = await apiFetchOrNull<BackendCandidato>(
      `/candidatos/${candidatoId}/experiencias/${experienciaId}`,
      { method: 'DELETE' },
    )
    return c ? mapCandidato(c) : null
  },
}

// ============================================================
// EMPRESAS
// ============================================================
export const apiEmpresas = {
  async listar(): Promise<Empresa[]> {
    const es = await apiFetch<BackendEmpresa[]>('/empresas')
    return es.map(mapEmpresa)
  },
  async obter(id: string): Promise<Empresa | null> {
    const e = await apiFetchOrNull<BackendEmpresa>(`/empresas/${id}`)
    return e ? mapEmpresa(e) : null
  },
  async atualizar(
    id: string,
    patch: Partial<Pick<Empresa, 'nome' | 'setor' | 'sede' | 'sobreEmpresa'>>,
  ): Promise<Empresa | null> {
    const body: Record<string, unknown> = {}
    if (patch.nome !== undefined) body.nome = patch.nome
    if (patch.setor !== undefined) body.setor = patch.setor
    if (patch.sede !== undefined) body.sede = patch.sede
    if (patch.sobreEmpresa !== undefined) body.sobreEmpresa = patch.sobreEmpresa

    const e = await apiFetchOrNull<BackendEmpresa>(`/empresas/${id}`, { method: 'PATCH', body })
    return e ? mapEmpresa(e) : null
  },
  async validar(id: string): Promise<Empresa | null> {
    const e = await apiFetchOrNull<BackendEmpresa>(`/empresas/${id}/validar`, { method: 'PATCH' })
    return e ? mapEmpresa(e) : null
  },
  async suspender(id: string): Promise<Empresa | null> {
    const e = await apiFetchOrNull<BackendEmpresa>(`/empresas/${id}/suspender`, { method: 'PATCH' })
    return e ? mapEmpresa(e) : null
  },
}

// ============================================================
// CANDIDATURAS
// ============================================================
export const apiCandidaturas = {
  async listarPorVaga(vagaId: string): Promise<Candidatura[]> {
    const cs = await apiFetch<BackendCandidatura[]>(`/candidaturas/vaga/${vagaId}`)
    return cs.map(mapCandidatura)
  },

  async listarPorCandidato(candidatoId: string): Promise<Candidatura[]> {
    const cs = await apiFetch<BackendCandidatura[]>(`/candidaturas/candidato/${candidatoId}`)
    return cs.map(mapCandidatura)
  },

  /** candidatoId é ignorado — o backend usa o candidato do próprio token. */
  async candidatar(_candidatoId: string, vagaId: string): Promise<Candidatura | null> {
    const c = await apiFetchOrNull<BackendCandidatura>('/candidaturas', {
      method: 'POST',
      body: { vagaId: Number(vagaId) },
    })
    return c ? mapCandidatura(c) : null
  },

  async moverStatus(id: string, status: StatusCandidatura): Promise<Candidatura | null> {
    const c = await apiFetchOrNull<BackendCandidatura>(`/candidaturas/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
    return c ? mapCandidatura(c) : null
  },

  async adicionarParecer(id: string, tipo: 'rh' | 'tecnico', texto: string): Promise<Candidatura | null> {
    const c = await apiFetchOrNull<BackendCandidatura>(`/candidaturas/${id}/parecer`, {
      method: 'PATCH',
      body: { tipo, texto },
    })
    return c ? mapCandidatura(c) : null
  },
}

// ============================================================
// ADMIN / MÉTRICAS / DENÚNCIAS
// ============================================================
export const apiAdmin = {
  async metricas(): Promise<MetricasPlataforma> {
    return apiFetch<MetricasPlataforma>('/admin/metricas')
  },
  async listarDenuncias(): Promise<Denuncia[]> {
    const ds = await apiFetch<BackendDenuncia[]>('/admin/denuncias')
    return ds.map(mapDenuncia)
  },
  async resolverDenuncia(
    id: string,
    acao: 'investigar' | 'ignorar' | 'suspender',
  ): Promise<Denuncia | null> {
    const d = await apiFetchOrNull<BackendDenuncia>(`/admin/denuncias/${id}/resolver`, {
      method: 'PATCH',
      body: { acao },
    })
    return d ? mapDenuncia(d) : null
  },
  async logsAuditoria(): Promise<LogAuditoria[]> {
    const ls = await apiFetch<BackendLog[]>('/admin/logs')
    return ls.map(mapLog)
  },

  /** Popula candidatos/empresas/vagas/candidaturas/denúncias fictícios pro
   * sistema não ficar vazio. Idempotente — clicar de novo não duplica. */
  async seedDemo(): Promise<{
    candidatos: number
    empresas: number
    vagas: number
    candidaturas: number
    denuncias: number
  }> {
    return apiFetch('/admin/seed-demo', { method: 'POST' })
  },
}
