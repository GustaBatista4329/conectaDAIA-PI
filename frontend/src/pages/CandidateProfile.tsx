import { useEffect, useRef, useState } from 'react'
import { Upload, Plus, X, Eye, Bell, Pencil, GraduationCap, Briefcase } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { apiCandidatos } from '@/lib/api'
import { initials } from '@/lib/utils'
import { LOCAL_TRABALHO_LABELS as localTrabalhoLabels } from '@/lib/vagaConstants'
import { Checkbox } from '@/components/ui/checkbox'
import type { AreaEstudo, Candidato, CategoriaSkill, LocalTrabalho, Skill, TipoTrabalho } from '@/types'

// Rótulos de exibição das categorias de skill — código (chave) precisa bater
// com `codigo` de cd_categorias_skill no backend (ver types/index.ts).
const skillCategorias: Record<CategoriaSkill, string> = {
  operacao_manutencao: 'Operação e Manutenção',
  normas_seguranca: 'Normas e Segurança',
  gestao: 'Gestão',
  tecnica: 'Técnica',
  idiomas: 'Idiomas',
  desenvolvimento_software: 'Desenvolvimento de Software',
  analise_dados_bi: 'Análise de Dados & BI',
  design_ux_ui: 'Design & UX/UI',
  gestao_projetos: 'Gestão de Projetos',
  marketing_digital: 'Marketing Digital',
  vendas_negociacao: 'Vendas & Negociação',
  financas_contabilidade: 'Finanças & Contabilidade',
  gestao_rh_do: 'Gestão de RH & D&O',
  operacoes_logistica: 'Operações & Logística',
  seguranca_informacao: 'Segurança da Informação',
  lideranca_gestao_pessoas: 'Liderança & Gestão de Pessoas',
  comunicacao_interpessoal: 'Comunicação Interpessoal',
  resolucao_problemas: 'Resolução de Problemas',
  trabalho_equipe: 'Trabalho em Equipe',
  organizacao_gestao_tempo: 'Organização & Gestão do Tempo',
  pensamento_estrategico: 'Pensamento Estratégico',
  software_ferramentas: 'Software & Ferramentas',
  compliance_governanca: 'Compliance & Governança',
  atendimento_sucesso_cliente: 'Atendimento & Sucesso do Cliente',
  inovacao_criatividade: 'Inovação & Criatividade',
  adaptabilidade_flexibilidade: 'Adaptabilidade & Flexibilidade',
}

// Rótulos de exibição das áreas de estudo — precisa bater com o Enum
// AreaEstudo do backend (app/models/candidato.py).
const areaEstudoLabels: Record<AreaEstudo, string> = {
  EDUCACAO: 'Educação',
  ARTES_E_HUMANIDADES: 'Artes e Humanidades',
  CIENCIAS_SOCIAIS_E_COMPORTAMENTAIS: 'Ciências Sociais e Comportamentais',
  COMUNICACAO_E_INFORMACAO: 'Comunicação e Informação',
  NEGOCIOS_E_ADMINISTRACAO: 'Negócios e Administração',
  DIREITO: 'Direito',
  CIENCIAS_NATURAIS: 'Ciências Naturais',
  MATEMATICA_E_ESTATISTICA: 'Matemática e Estatística',
  COMPUTACAO_E_TECNOLOGIA_DA_INFORMACAO: 'Computação e Tecnologia da Informação',
  ENGENHARIAS: 'Engenharias',
  ARQUITETURA_E_CONSTRUCAO: 'Arquitetura e Construção',
  PRODUCAO_INDUSTRIAL: 'Produção Industrial',
  AGRICULTURA_E_VETERINARIA: 'Agricultura e Veterinária',
  SAUDE_E_BEM_ESTAR: 'Saúde e Bem-Estar',
  TURISMO_HOTELARIA_E_GASTRONOMIA: 'Turismo, Hotelaria e Gastronomia',
  SEGURANCA_E_DEFESA: 'Segurança e Defesa',
  TRANSPORTES: 'Transportes',
  INTERDISCIPLINAR: 'Interdisciplinar',
  OTHER: 'Outra',
}

const MESES_ABREVIADOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

// Formata "yyyy-mm-dd" como "Mês/Ano" sem passar por Date/Intl — datas
// puras (sem horário) sofrem bug de fuso ao serem parseadas como UTC e
// exibidas no fuso local, podendo mostrar o dia/mês anterior.
function formatMesAno(iso: string): string {
  const [ano, mes] = iso.split('-')
  return `${MESES_ABREVIADOS[Number(mes) - 1]}/${ano}`
}

// Rótulos de exibição — precisam bater com os Enums TipoTrabalho/LocalTrabalho
// do backend (app/models/candidato.py).
const tipoTrabalhoLabels: Record<TipoTrabalho, string> = {
  TEMPO_INTEGRAL: 'Tempo Integral',
  MEIO_PERIODO: 'Meio Período',
  AUTONOMO: 'Autônomo',
  FREELANCER: 'Freelancer',
  CONTRATO: 'Contrato',
  ESTAGIO: 'Estágio',
  APRENDIZ: 'Aprendiz',
  CONTRATO_INDIRETO: 'Contrato Indireto',
  PROGRAMA_DE_LIDERANCA: 'Programa de Liderança',
  OTHER: 'Outro',
}

export default function CandidateProfile() {
  const { user, atualizarNome } = useAuth()
  const { show } = useToast()
  const [candidato, setCandidato] = useState<Candidato | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [novaSkillNome, setNovaSkillNome] = useState('')
  const [novaSkillCat, setNovaSkillCat] = useState<CategoriaSkill>('operacao_manutencao')
  const fileRef = useRef<HTMLInputElement>(null)
  const [curriculoNome, setCurriculoNome] = useState<string | null>(null)
  const [alertasGlobal, setAlertasGlobal] = useState(true)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editCargo, setEditCargo] = useState('')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)

  const [sobreMimModalOpen, setSobreMimModalOpen] = useState(false)
  const [editSobreMim, setEditSobreMim] = useState('')
  const [salvandoSobreMim, setSalvandoSobreMim] = useState(false)

  const [formacaoModalOpen, setFormacaoModalOpen] = useState(false)
  const [novaFormacaoInstituicao, setNovaFormacaoInstituicao] = useState('')
  const [novaFormacaoCurso, setNovaFormacaoCurso] = useState('')
  const [novaFormacaoArea, setNovaFormacaoArea] = useState<AreaEstudo>('COMPUTACAO_E_TECNOLOGIA_DA_INFORMACAO')
  const [novaFormacaoDataInicio, setNovaFormacaoDataInicio] = useState('')
  const [novaFormacaoDataFormatura, setNovaFormacaoDataFormatura] = useState('')
  const [salvandoFormacao, setSalvandoFormacao] = useState(false)

  const [experienciaModalOpen, setExperienciaModalOpen] = useState(false)
  const [novaExpEmpresaNome, setNovaExpEmpresaNome] = useState('')
  const [novaExpCargo, setNovaExpCargo] = useState('')
  const [novaExpTipoTrabalho, setNovaExpTipoTrabalho] = useState<TipoTrabalho>('TEMPO_INTEGRAL')
  const [novaExpLocalTrabalho, setNovaExpLocalTrabalho] = useState<LocalTrabalho>('PRESENCIAL')
  const [novaExpDataInicio, setNovaExpDataInicio] = useState('')
  const [novaExpDataFim, setNovaExpDataFim] = useState('')
  const [novaExpTrabalhandoAtualmente, setNovaExpTrabalhandoAtualmente] = useState(false)
  const [salvandoExperiencia, setSalvandoExperiencia] = useState(false)

  useEffect(() => {
    if (user?.candidatoId) {
      apiCandidatos.obter(user.candidatoId).then((c) => {
        setCandidato(c)
        setAlertasGlobal(c?.alertasAtivos ?? true)
      })
    }
  }, [user])

  const skillsPorCategoria = candidato
    ? candidato.skills.reduce<Record<string, Skill[]>>((acc, s) => {
        acc[s.categoria] = acc[s.categoria] ?? []
        acc[s.categoria].push(s)
        return acc
      }, {})
    : {}

  const adicionarSkill = async () => {
    if (!candidato || !novaSkillNome.trim()) return
    const updated = await apiCandidatos.adicionarSkill(candidato.id, novaSkillNome.trim(), novaSkillCat)
    if (updated) {
      setCandidato(updated)
      show(`Skill "${novaSkillNome}" adicionada.`, 'success')
      setNovaSkillNome('')
      setModalOpen(false)
    }
  }

  const removerSkill = async (skillId: string) => {
    if (!candidato) return
    const updated = await apiCandidatos.removerSkill(candidato.id, skillId)
    if (updated) {
      setCandidato(updated)
      show('Skill removida.', 'info')
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCurriculoNome(f.name)
    show(`Currículo "${f.name}" carregado com sucesso.`, 'success')
    // Em produção, enviaria para backend (multipart/form-data)
  }

  const toggleAlertas = async (v: boolean) => {
    setAlertasGlobal(v)
    if (candidato) {
      await apiCandidatos.atualizar(candidato.id, { alertasAtivos: v })
      show(v ? 'Alertas ativados.' : 'Alertas desativados.', 'info')
    }
  }

  const abrirEdicaoPerfil = () => {
    if (!candidato) return
    setEditNome(candidato.nome)
    setEditCargo(candidato.cargo)
    setEditModalOpen(true)
  }

  const salvarPerfil = async () => {
    if (!candidato) return
    const nomeTrim = editNome.trim()
    const cargoTrim = editCargo.trim()
    if (!nomeTrim || !cargoTrim) {
      show('Nome e cargo desejado não podem ficar em branco.', 'error')
      return
    }

    setSalvandoPerfil(true)
    try {
      if (nomeTrim !== candidato.nome) {
        const res = await atualizarNome(nomeTrim)
        if (!res.ok) {
          show(res.error ?? 'Não foi possível atualizar o nome.', 'error')
          return
        }
      }

      let atualizado = candidato
      if (cargoTrim !== candidato.cargo) {
        const res = await apiCandidatos.atualizar(candidato.id, { cargo: cargoTrim })
        if (!res) {
          show('Não foi possível atualizar o cargo desejado.', 'error')
          return
        }
        atualizado = res
      }

      setCandidato({ ...atualizado, nome: nomeTrim })
      show('Perfil atualizado com sucesso.', 'success')
      setEditModalOpen(false)
    } finally {
      setSalvandoPerfil(false)
    }
  }

  const abrirEdicaoSobreMim = () => {
    if (!candidato) return
    setEditSobreMim(candidato.sobreMim ?? '')
    setSobreMimModalOpen(true)
  }

  const salvarSobreMim = async () => {
    if (!candidato) return
    setSalvandoSobreMim(true)
    try {
      const atualizado = await apiCandidatos.atualizar(candidato.id, {
        sobreMim: editSobreMim.trim(),
      })
      if (!atualizado) {
        show('Não foi possível atualizar o "Sobre mim".', 'error')
        return
      }
      setCandidato(atualizado)
      show('"Sobre mim" atualizado com sucesso.', 'success')
      setSobreMimModalOpen(false)
    } finally {
      setSalvandoSobreMim(false)
    }
  }

  const abrirModalFormacao = () => {
    setNovaFormacaoInstituicao('')
    setNovaFormacaoCurso('')
    setNovaFormacaoArea('COMPUTACAO_E_TECNOLOGIA_DA_INFORMACAO')
    setNovaFormacaoDataInicio('')
    setNovaFormacaoDataFormatura('')
    setFormacaoModalOpen(true)
  }

  const adicionarFormacao = async () => {
    if (!candidato) return
    const instituicao = novaFormacaoInstituicao.trim()
    const curso = novaFormacaoCurso.trim()
    if (!instituicao || !curso || !novaFormacaoDataInicio || !novaFormacaoDataFormatura) {
      show('Preencha instituição, curso e as duas datas.', 'error')
      return
    }
    if (novaFormacaoDataFormatura < novaFormacaoDataInicio) {
      show('A data de formatura não pode ser anterior à data de início.', 'error')
      return
    }

    setSalvandoFormacao(true)
    try {
      const atualizado = await apiCandidatos.adicionarFormacao(candidato.id, {
        instituicao,
        curso,
        areaEstudo: novaFormacaoArea,
        dataInicio: novaFormacaoDataInicio,
        dataFormatura: novaFormacaoDataFormatura,
      })
      if (!atualizado) {
        show('Não foi possível adicionar a formação.', 'error')
        return
      }
      setCandidato(atualizado)
      show('Formação acadêmica adicionada.', 'success')
      setFormacaoModalOpen(false)
    } catch {
      show('Não foi possível adicionar a formação.', 'error')
    } finally {
      setSalvandoFormacao(false)
    }
  }

  const removerFormacao = async (formacaoId: string) => {
    if (!candidato) return
    const atualizado = await apiCandidatos.removerFormacao(candidato.id, formacaoId)
    if (atualizado) {
      setCandidato(atualizado)
      show('Formação removida.', 'info')
    }
  }

  const abrirModalExperiencia = () => {
    setNovaExpEmpresaNome('')
    setNovaExpCargo('')
    setNovaExpTipoTrabalho('TEMPO_INTEGRAL')
    setNovaExpLocalTrabalho('PRESENCIAL')
    setNovaExpDataInicio('')
    setNovaExpDataFim('')
    setNovaExpTrabalhandoAtualmente(false)
    setExperienciaModalOpen(true)
  }

  const adicionarExperiencia = async () => {
    if (!candidato) return
    const empresaNome = novaExpEmpresaNome.trim()
    const cargo = novaExpCargo.trim()
    if (!empresaNome || !cargo || !novaExpDataInicio) {
      show('Preencha empresa, cargo e a data de início.', 'error')
      return
    }
    if (!novaExpTrabalhandoAtualmente && !novaExpDataFim) {
      show('Informe a data de saída, ou marque "Ainda trabalho aqui".', 'error')
      return
    }
    if (!novaExpTrabalhandoAtualmente && novaExpDataFim < novaExpDataInicio) {
      show('A data de saída não pode ser anterior à data de início.', 'error')
      return
    }

    setSalvandoExperiencia(true)
    try {
      const atualizado = await apiCandidatos.adicionarExperiencia(candidato.id, {
        empresaNome,
        cargo,
        tipoTrabalho: novaExpTipoTrabalho,
        localTrabalho: novaExpLocalTrabalho,
        dataInicio: novaExpDataInicio,
        dataFim: novaExpTrabalhandoAtualmente ? undefined : novaExpDataFim,
        trabalhandoAtualmente: novaExpTrabalhandoAtualmente,
      })
      if (!atualizado) {
        show('Não foi possível adicionar a experiência.', 'error')
        return
      }
      setCandidato(atualizado)
      show('Experiência profissional adicionada.', 'success')
      setExperienciaModalOpen(false)
    } catch {
      show('Não foi possível adicionar a experiência.', 'error')
    } finally {
      setSalvandoExperiencia(false)
    }
  }

  const removerExperiencia = async (experienciaId: string) => {
    if (!candidato) return
    const atualizado = await apiCandidatos.removerExperiencia(candidato.id, experienciaId)
    if (atualizado) {
      setCandidato(atualizado)
      show('Experiência removida.', 'info')
    }
  }

  if (!candidato) {
    return <div className="text-muted-foreground">Carregando perfil...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-daia-blue">Painel do Candidato</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie seu perfil, competências e preferências de privacidade.
          </p>
        </div>
        <Button variant="outline">
          <Eye className="h-4 w-4" />
          Visualizar Perfil Público
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Coluna esquerda - Perfil */}
        <div className="space-y-6">
          <Card className="p-6 text-center border-t-4 border-t-daia-blue-mid">
            <Avatar className="h-24 w-24 mx-auto">
              {candidato.avatarUrl && <AvatarImage src={candidato.avatarUrl} />}
              <AvatarFallback>{initials(candidato.nome)}</AvatarFallback>
            </Avatar>
            <h2 className="mt-3 font-bold text-lg">{candidato.nome}</h2>
            <p className="text-sm text-muted-foreground">{candidato.cargo}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={abrirEdicaoPerfil}>
              <Pencil className="h-3.5 w-3.5" />
              Editar Perfil
            </Button>

            <div className="mt-5 text-left">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Perfil Completo
                </span>
                <span className="font-bold text-daia-green">{candidato.perfilCompleto}%</span>
              </div>
              <Progress value={candidato.perfilCompleto} />
            </div>
          </Card>

          {/* Upload CV */}
          <Card className="p-6">
            <h3 className="font-semibold text-daia-blue">Currículo PDF</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Mantenha seu currículo atualizado para oportunidades rápidas.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-4 w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-daia-blue-mid hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-daia-blue-mid mx-auto" />
              <div className="text-sm font-medium mt-2">
                {curriculoNome ?? 'Clique para Upload de Currículo PDF'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Max 5MB (PDF)</div>
            </button>
          </Card>
        </div>

        {/* Colunas direita - Skills & Alertas */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-daia-blue">Sobre Mim</h3>
              <Button variant="outline" size="sm" onClick={abrirEdicaoSobreMim}>
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </div>
            {candidato.sobreMim ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">{candidato.sobreMim}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Conte um pouco sobre sua trajetória profissional e objetivos de carreira.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-daia-blue">Formação Acadêmica</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Universidade, curso e período — a formatura pode ser uma data futura.
                </p>
              </div>
              <Button size="sm" onClick={abrirModalFormacao} className="shrink-0">
                <Plus className="h-4 w-4" />
                Adicionar Formação
              </Button>
            </div>

            {candidato.formacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma formação acadêmica cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {candidato.formacoes.map((f) => {
                  const emAndamento = f.dataFormatura > new Date().toISOString().slice(0, 10)
                  return (
                    <div
                      key={f.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <GraduationCap className="h-5 w-5 text-daia-blue-mid mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{f.curso}</div>
                          <div className="text-xs text-muted-foreground truncate">{f.instituicao}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {areaEstudoLabels[f.areaEstudo]} · {formatMesAno(f.dataInicio)} –{' '}
                            {formatMesAno(f.dataFormatura)}
                            {emAndamento && (
                              <Badge variant="info" className="ml-2 text-[10px]">
                                EM ANDAMENTO
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removerFormacao(f.id)}
                        className="h-7 w-7 shrink-0 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                        aria-label={`Remover formação em ${f.curso}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-daia-blue">Experiência Profissional</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Empresas, cargos e período — marque se ainda trabalha lá.
                </p>
              </div>
              <Button size="sm" onClick={abrirModalExperiencia} className="shrink-0">
                <Plus className="h-4 w-4" />
                Adicionar Experiência
              </Button>
            </div>

            {candidato.experiencias.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma experiência profissional cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {candidato.experiencias.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Briefcase className="h-5 w-5 text-daia-blue-mid mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{e.cargo}</div>
                        <div className="text-xs text-muted-foreground truncate">{e.empresaNome}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tipoTrabalhoLabels[e.tipoTrabalho]} · {localTrabalhoLabels[e.localTrabalho]} ·{' '}
                          {formatMesAno(e.dataInicio)} –{' '}
                          {e.trabalhandoAtualmente ? 'Atual' : formatMesAno(e.dataFim!)}
                          {e.trabalhandoAtualmente && (
                            <Badge variant="success" className="ml-2 text-[10px]">
                              TRABALHANDO AQUI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removerExperiencia(e.id)}
                      className="h-7 w-7 shrink-0 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                      aria-label={`Remover experiência em ${e.empresaNome}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-daia-blue">Minhas Skills</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione habilidades da taxonomia industrial controlada.
                </p>
              </div>
              <Button size="sm" onClick={() => setModalOpen(true)} className="shrink-0">
                <Plus className="h-4 w-4" />
                Adicionar Skill
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(skillsPorCategoria).map(([cat, skills]) => (
                <div key={cat}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {skillCategorias[cat as CategoriaSkill] ?? cat}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <div
                        key={s.id}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-daia-blue-light text-daia-blue-mid text-xs font-medium"
                      >
                        {s.nome}
                        <button
                          onClick={() => removerSkill(s.id)}
                          className="h-5 w-5 rounded-full hover:bg-daia-blue-mid/20 flex items-center justify-center"
                          aria-label={`Remover ${s.nome}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setNovaSkillCat(cat as CategoriaSkill)
                        setModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-muted-foreground/40 text-xs text-muted-foreground hover:border-daia-blue-mid hover:text-daia-blue-mid"
                    >
                      <Plus className="h-3 w-3" />
                      Certificação Pendente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Alertas */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-daia-blue" />
                <h3 className="font-semibold text-daia-blue">Alertas de Vagas</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Status Global
                </span>
                <Switch checked={alertasGlobal} onCheckedChange={toggleAlertas} />
              </div>
            </div>

            <div className="mt-5 p-4 rounded-lg border bg-muted/30">
              <div className="font-medium text-sm">{candidato.cargo}</div>
              <div className="text-xs text-muted-foreground mt-1">
                LOCAL: {candidato.localidade} · TURNO: INDIFERENTE
              </div>
            </div>

            <button className="mt-4 w-full py-2.5 rounded-md border border-dashed border-muted-foreground/40 text-sm text-muted-foreground hover:border-daia-blue-mid hover:text-daia-blue-mid inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Novo Alerta
            </button>
          </Card>
        </div>
      </div>

      {/* Modal editar perfil (nome / cargo desejado) */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Atualize seu nome e o cargo desejado.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="perfil-nome">Nome</Label>
              <Input
                id="perfil-nome"
                className="mt-1.5"
                placeholder="Seu nome completo"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="perfil-cargo">Cargo desejado</Label>
              <Input
                id="perfil-cargo"
                className="mt-1.5"
                placeholder="Ex: Técnico de Manutenção Industrial"
                value={editCargo}
                onChange={(e) => setEditCargo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarPerfil} disabled={salvandoPerfil}>
              {salvandoPerfil ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal editar "Sobre mim" */}
      <Dialog open={sobreMimModalOpen} onOpenChange={setSobreMimModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sobre Mim</DialogTitle>
            <DialogDescription>
              Uma breve descrição da sua trajetória e objetivos de carreira.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="sobre-mim">Sobre mim</Label>
            <Textarea
              id="sobre-mim"
              className="mt-1.5"
              rows={6}
              maxLength={2000}
              placeholder="Ex: Técnico eletromecânico com 5 anos de experiência em manutenção preditiva..."
              value={editSobreMim}
              onChange={(e) => setEditSobreMim(e.target.value)}
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {editSobreMim.length}/2000
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSobreMimModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarSobreMim} disabled={salvandoSobreMim}>
              {salvandoSobreMim ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal adicionar formação acadêmica */}
      <Dialog open={formacaoModalOpen} onOpenChange={setFormacaoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Formação Acadêmica</DialogTitle>
            <DialogDescription>
              Se ainda estiver cursando, use a data prevista de formatura (pode ser no futuro).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="formacao-instituicao">Universidade / Instituição</Label>
              <Input
                id="formacao-instituicao"
                className="mt-1.5"
                placeholder="Ex: Universidade de São Paulo"
                value={novaFormacaoInstituicao}
                onChange={(e) => setNovaFormacaoInstituicao(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="formacao-curso">Curso</Label>
              <Input
                id="formacao-curso"
                className="mt-1.5"
                placeholder="Ex: Bacharelado em Engenharia de Software"
                value={novaFormacaoCurso}
                onChange={(e) => setNovaFormacaoCurso(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="formacao-area">Área de estudo</Label>
              <Select
                id="formacao-area"
                className="mt-1.5"
                value={novaFormacaoArea}
                onChange={(e) => setNovaFormacaoArea(e.target.value as AreaEstudo)}
              >
                {Object.entries(areaEstudoLabels).map(([codigo, label]) => (
                  <option key={codigo} value={codigo}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formacao-inicio">Data de início</Label>
                <Input
                  id="formacao-inicio"
                  type="date"
                  className="mt-1.5"
                  value={novaFormacaoDataInicio}
                  onChange={(e) => setNovaFormacaoDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="formacao-formatura">Data de formatura</Label>
                <Input
                  id="formacao-formatura"
                  type="date"
                  className="mt-1.5"
                  value={novaFormacaoDataFormatura}
                  onChange={(e) => setNovaFormacaoDataFormatura(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Pode ser futura, se ainda não concluiu.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormacaoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionarFormacao} disabled={salvandoFormacao}>
              {salvandoFormacao ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal adicionar experiência profissional */}
      <Dialog open={experienciaModalOpen} onOpenChange={setExperienciaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Experiência Profissional</DialogTitle>
            <DialogDescription>
              Se ainda trabalha lá, marque a opção abaixo em vez de informar data de saída.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="exp-empresa">Empresa</Label>
              <Input
                id="exp-empresa"
                className="mt-1.5"
                placeholder="Ex: Indústria Química DAIA S.A."
                value={novaExpEmpresaNome}
                onChange={(e) => setNovaExpEmpresaNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="exp-cargo">Cargo exercido</Label>
              <Input
                id="exp-cargo"
                className="mt-1.5"
                placeholder="Ex: Técnico de Manutenção Industrial"
                value={novaExpCargo}
                onChange={(e) => setNovaExpCargo(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-tipo">Tipo de trabalho</Label>
                <Select
                  id="exp-tipo"
                  className="mt-1.5"
                  value={novaExpTipoTrabalho}
                  onChange={(e) => setNovaExpTipoTrabalho(e.target.value as TipoTrabalho)}
                >
                  {Object.entries(tipoTrabalhoLabels).map(([codigo, label]) => (
                    <option key={codigo} value={codigo}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="exp-local">Local de trabalho</Label>
                <Select
                  id="exp-local"
                  className="mt-1.5"
                  value={novaExpLocalTrabalho}
                  onChange={(e) => setNovaExpLocalTrabalho(e.target.value as LocalTrabalho)}
                >
                  {Object.entries(localTrabalhoLabels).map(([codigo, label]) => (
                    <option key={codigo} value={codigo}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-inicio">Data de entrada</Label>
                <Input
                  id="exp-inicio"
                  type="date"
                  className="mt-1.5"
                  value={novaExpDataInicio}
                  onChange={(e) => setNovaExpDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="exp-fim">Data de saída</Label>
                <Input
                  id="exp-fim"
                  type="date"
                  className="mt-1.5"
                  value={novaExpDataFim}
                  disabled={novaExpTrabalhandoAtualmente}
                  onChange={(e) => setNovaExpDataFim(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={novaExpTrabalhandoAtualmente}
                onCheckedChange={(checked) => {
                  setNovaExpTrabalhandoAtualmente(checked)
                  if (checked) setNovaExpDataFim('')
                }}
              />
              Ainda trabalho aqui
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExperienciaModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionarExperiencia} disabled={salvandoExperiencia}>
              {salvandoExperiencia ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal adicionar skill */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Skill</DialogTitle>
            <DialogDescription>
              Preencha as informações da nova competência.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="skill-nome">Nome da competência</Label>
              <Input
                id="skill-nome"
                className="mt-1.5"
                placeholder="Ex: Soldagem MIG/MAG"
                value={novaSkillNome}
                onChange={(e) => setNovaSkillNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="skill-cat">Categoria</Label>
              <Select
                id="skill-cat"
                className="mt-1.5"
                value={novaSkillCat}
                onChange={(e) => setNovaSkillCat(e.target.value as CategoriaSkill)}
              >
                {Object.entries(skillCategorias).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionarSkill}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
