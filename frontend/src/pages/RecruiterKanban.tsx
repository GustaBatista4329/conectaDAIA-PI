import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download, Edit3, Clock, Send, MoreVertical, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { apiVagas, apiCandidaturas, apiCandidatos } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { initials, timeAgo } from '@/lib/utils'
import type { Candidato, Candidatura, Vaga, StatusCandidatura } from '@/types'

const colunas: Array<{ key: StatusCandidatura; label: string }> = [
  { key: 'triagem', label: 'Triagem' },
  { key: 'entrevista_rh', label: 'Entrevista RH' },
  { key: 'avaliacao_tecnica', label: 'Avaliação Técnica' },
  { key: 'contratado', label: 'Contratado' },
]

interface CandidaturaEnriquecida extends Candidatura {
  candidato?: Candidato
}

export default function RecruiterKanban() {
  const nav = useNavigate()
  const { vagaId } = useParams<{ vagaId?: string }>()
  const { show } = useToast()
  const { user } = useAuth()

  const [vaga, setVaga] = useState<Vaga | null>(null)
  const [candidaturas, setCandidaturas] = useState<CandidaturaEnriquecida[]>([])
  const [parecerRascunho, setParecerRascunho] = useState<Record<string, string>>({})
  const [targetVagaId, setTargetVagaId] = useState<string | null>(vagaId ?? null)
  const [semVagas, setSemVagas] = useState(false)

  // Se não veio vagaId pela URL (ex: link "Candidatos" do menu lateral), usa
  // a primeira vaga da própria empresa do recrutador em vez de um id fixo
  // que só existia no mock.
  useEffect(() => {
    if (vagaId) {
      setTargetVagaId(vagaId)
      return
    }
    if (!user?.empresaId) return
    apiVagas.vagasDaEmpresa(user.empresaId).then((vs) => {
      if (vs[0]) setTargetVagaId(vs[0].id)
      else setSemVagas(true)
    })
  }, [vagaId, user])

  useEffect(() => {
    if (!targetVagaId) return
    apiVagas.obter(targetVagaId).then(setVaga)
    loadCandidaturas(targetVagaId)
  }, [targetVagaId])

  const loadCandidaturas = async (vid: string) => {
    const lista = await apiCandidaturas.listarPorVaga(vid)
    const enriquecidas = await Promise.all(
      lista.map(async (c) => ({
        ...c,
        candidato: (await apiCandidatos.obter(c.candidatoId)) ?? undefined,
      })),
    )
    setCandidaturas(enriquecidas)
  }

  const porColuna = useMemo(
    () =>
      colunas.reduce<Record<StatusCandidatura, CandidaturaEnriquecida[]>>(
        (acc, col) => {
          acc[col.key] = candidaturas.filter((c) => c.status === col.key)
          return acc
        },
        {} as any,
      ),
    [candidaturas],
  )

  const moverPara = async (cand: CandidaturaEnriquecida, novoStatus: StatusCandidatura) => {
    const atualizado = await apiCandidaturas.moverStatus(cand.id, novoStatus)
    if (atualizado && targetVagaId) {
      await loadCandidaturas(targetVagaId)
      show(`${cand.candidato?.nome} movido para ${colunas.find((c) => c.key === novoStatus)?.label}.`, 'success')
    }
  }

  const salvarParecer = async (cand: CandidaturaEnriquecida) => {
    const texto = parecerRascunho[cand.id]
    if (!texto?.trim() || !targetVagaId) return
    await apiCandidaturas.adicionarParecer(cand.id, 'rh', texto)
    setParecerRascunho((p) => ({ ...p, [cand.id]: '' }))
    await loadCandidaturas(targetVagaId)
    show('Parecer registrado.', 'success')
  }

  const exportar = (formato: 'pdf' | 'csv') => {
    show(`Exportação ${formato.toUpperCase()} iniciada (mock).`, 'info')
  }

  if (semVagas) {
    return (
      <div className="text-muted-foreground">
        Sua empresa ainda não tem vagas publicadas — cadastre uma vaga pra acompanhar candidatos aqui.
      </div>
    )
  }

  if (!vaga) return <div className="text-muted-foreground">Carregando vaga...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-daia-green">
            <span className="h-2 w-2 bg-daia-green rounded-full" />
            Vaga Ativa
          </div>
          <h1 className="mt-1 text-3xl font-bold text-daia-blue">{vaga.titulo}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Cód: {vaga.codigo}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {vaga.distrito}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> Atualizado {timeAgo(vaga.dataPublicacao)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportar('pdf')}>
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportar('csv')}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => show('Editor em construção.', 'info')}>
            <Edit3 className="h-4 w-4" />
            Editar Vaga
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-full">
        {colunas.map((col) => (
          <div key={col.key} className="bg-muted/40 rounded-lg p-3 min-h-[400px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm text-foreground">{col.label}</h3>
              <span className="text-xs text-muted-foreground font-semibold">
                {porColuna[col.key]?.length ?? 0}
              </span>
            </div>

            <div className="space-y-3">
              {porColuna[col.key]?.map((cand) => (
                <Card key={cand.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {cand.candidato?.avatarUrl && <AvatarImage src={cand.candidato.avatarUrl} />}
                      <AvatarFallback>{initials(cand.candidato?.nome ?? '')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{cand.candidato?.nome}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {cand.candidato?.cargo}
                      </div>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Mais opções"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Skills */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {cand.candidato?.skills.slice(0, 3).map((s) => (
                      <Badge
                        key={s.id}
                        variant={s.categoria === 'normas-seguranca' ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {s.nome.toUpperCase()}
                      </Badge>
                    ))}
                  </div>

                  {/* Seção específica por coluna */}
                  {col.key === 'triagem' && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Aplicou há {timeAgo(cand.dataAplicacao).replace('há ', '')}
                    </div>
                  )}

                  {col.key === 'entrevista_rh' && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Adicionar Parecer RH
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Resumo da entrevista..."
                          value={parecerRascunho[cand.id] ?? ''}
                          onChange={(e) =>
                            setParecerRascunho((p) => ({ ...p, [cand.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && salvarParecer(cand)}
                          className="flex-1 bg-muted/50 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          onClick={() => salvarParecer(cand)}
                          className="h-7 w-7 rounded bg-daia-blue-mid text-white flex items-center justify-center hover:bg-daia-blue"
                          aria-label="Enviar parecer"
                        >
                          <Send className="h-3 w-3" />
                        </button>
                      </div>
                      {cand.dataEntrevista && (
                        <div className="mt-2 text-[10px] text-daia-blue-mid font-semibold uppercase">
                          Entrevista agendada
                        </div>
                      )}
                    </div>
                  )}

                  {col.key === 'avaliacao_tecnica' && cand.parecerTecnico && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Gestor Técnico:
                      </div>
                      <p className="text-xs text-foreground italic">"{cand.parecerTecnico}"</p>
                      <Badge variant="success" className="mt-2 text-[10px]">
                        Em Análise (Case)
                      </Badge>
                    </div>
                  )}

                  {/* Seletor de status (em vez de drag-and-drop) */}
                  <div className="mt-3 pt-3 border-t">
                    <Select
                      value={cand.status}
                      onChange={(e) => moverPara(cand, e.target.value as StatusCandidatura)}
                      className="h-8 text-xs"
                    >
                      {colunas.map((c) => (
                        <option key={c.key} value={c.key}>
                          Mover para: {c.label}
                        </option>
                      ))}
                      <option value="recusado">Mover para: Recusado</option>
                    </Select>
                  </div>
                </Card>
              ))}

              {(porColuna[col.key]?.length ?? 0) === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-md">
                  Nenhum candidato nesta fase.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
