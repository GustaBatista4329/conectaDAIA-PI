import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, Calendar as CalendarIcon, ChevronRight, Zap, MapPin, Wrench } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { apiCandidatos, apiVagas, apiCandidaturas } from '@/lib/api'
import type { Candidato, Vaga, Candidatura } from '@/types'
import { formatDate } from '@/lib/utils'
import daiaTrafegoPlaceholder from '@/assets/daia_trafego.png'

// Tráfego ao vivo (TomTom) desativado por ora. O componente continua pronto
// no código — pra reativar, basta virar essa flag pra `true` de novo (o
// import lazy abaixo e o card mais abaixo já cuidam do resto).
const LIVE_TRAFFIC_ENABLED = false

// SDK do TomTom é pesado (~1MB) — carrega só quando esse card entra em tela,
// em vez de inflar o bundle principal pra quem nunca abre o painel do candidato.
const DaiaTrafficMap = lazy(() =>
  import('@/components/shared/DaiaTrafficMap').then((m) => ({ default: m.DaiaTrafficMap })),
)

const statusOrder: Array<{ key: Candidatura['status']; label: string; icon: any }> = [
  { key: 'triagem', label: 'CANDIDATADO', icon: Check },
  { key: 'entrevista_rh', label: 'EM REVISÃO', icon: Eye },
  { key: 'avaliacao_tecnica', label: 'ENTREVISTA', icon: CalendarIcon },
  { key: 'contratado', label: 'CONTRATADO', icon: Check },
]

export default function CandidateDashboard() {
  const { user } = useAuth()
  const { show } = useToast()
  const nav = useNavigate()

  const [candidato, setCandidato] = useState<Candidato | null>(null)
  const [matches, setMatches] = useState<Array<Vaga & { matchPercentual: number }>>([])
  const [quickJobs, setQuickJobs] = useState<Vaga[]>([])
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([])

  useEffect(() => {
    if (!user?.candidatoId) return
    const cid = user.candidatoId
    apiCandidatos.obter(cid).then(setCandidato)
    apiCandidaturas.listarPorCandidato(cid).then(setCandidaturas)
    apiVagas.listar().then(async (todas) => {
      const withMatch = await Promise.all(
        todas.map(async (v) => ({ ...v, matchPercentual: await apiVagas.calcularMatch(cid, v.id) })),
      )
      const sorted = withMatch.sort((a, b) => b.matchPercentual - a.matchPercentual)
      setMatches(sorted.slice(0, 2))
      setQuickJobs(todas.filter((v) => v.tipoContrato === 'Contratação Urgente').slice(0, 3))
    })
  }, [user])

  const ultimaCandidatura = candidaturas[0]
  const currentStep = ultimaCandidatura
    ? statusOrder.findIndex((s) => s.key === ultimaCandidatura.status)
    : 0

  const handleApplyMatch = async (vaga: Vaga) => {
    if (!user?.candidatoId) return
    const res = await apiCandidaturas.candidatar(user.candidatoId, vaga.id)
    if (res) {
      setCandidaturas((prev) => [res, ...prev])
      show(`Candidatura enviada para ${vaga.titulo}!`, 'success')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-daia-blue-mid">
          Painel
        </div>
        <h1 className="text-3xl font-bold text-daia-blue mt-1">Painel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bem-vindo de volta, {candidato?.nome.split(' ')[0] ?? '...'}. Seu perfil está atingindo padrões industriais.
        </p>
      </div>

      {/* Banner candidatura em andamento */}
      {ultimaCandidatura && (
        <Card className="p-6 relative overflow-hidden">
          <Badge variant="success" className="uppercase tracking-wider">
            Candidatado
          </Badge>
          <h2 className="mt-2 text-xl font-bold text-daia-blue">Vagas Rápidas @ DAIA</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete suas certificações técnicas para desbloquear o "Selo de Prioridade".
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-daia-green rounded-full transition-all"
                style={{ width: `${Math.min(100, (currentStep + 1) * 25)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-daia-blue-mid">EM REVISÃO</span>
          </div>
        </Card>
      )}

      {/* Matching Inteligente */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-daia-blue">Matching Inteligente</h2>
          <button
            onClick={() => nav('/vagas')}
            className="text-sm font-semibold text-daia-blue-mid hover:underline inline-flex items-center gap-1"
          >
            VER TODAS AS VAGAS <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {matches.map((v) => (
            <Card key={v.id} className="p-5 relative">
              <Badge variant="success" className="absolute top-4 right-4">
                {v.matchPercentual}% DE MATCH
              </Badge>
              <div className="h-10 w-10 rounded-md bg-daia-blue-light flex items-center justify-center text-daia-blue">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold leading-tight">{v.titulo}</h3>
              <div className="text-xs text-muted-foreground mt-1">
                {v.empresaNome} • {v.distrito}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.habilidadesRequeridas.slice(0, 3).map((h) => (
                  <Badge key={h} variant="secondary" className="text-xs">
                    {h}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => handleApplyMatch(v)}
              >
                CANDIDATAR-SE COM PERFIL
              </Button>
            </Card>
          ))}

          {/* Insights Industriais */}
          <Card className="p-5 gradient-daia text-white">
            <h3 className="font-semibold">Insights Industriais</h3>
            <p className="text-sm text-white/80 mt-2">
              O DAIA expandiu o Setor 3. Mais de 450 novas vagas na área elétrica abrindo este trimestre.
            </p>
            <Button variant="outline" size="sm" className="mt-4 bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
              LER RELATÓRIO COMPLETO
            </Button>
          </Card>
        </div>
      </div>

      {/* Status + Vagas Rápidas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2">
          <h3 className="font-semibold text-daia-blue">Status da Candidatura Atual</h3>
          <div className="mt-6 flex items-center justify-between">
            {statusOrder.map((step, idx) => {
              const done = idx <= currentStep
              const isCurrent = idx === currentStep
              const Icon = step.icon
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center z-10 ${
                      done
                        ? isCurrent
                          ? 'bg-daia-blue text-white ring-4 ring-daia-blue-light'
                          : 'bg-daia-blue text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div
                    className={`mt-2 text-[10px] font-semibold tracking-wider uppercase ${
                      done ? 'text-daia-blue' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {idx <= currentStep ? formatDate(new Date().toISOString()) : 'A definir'}
                  </div>
                  {idx < statusOrder.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 right-0 w-full h-0.5 -z-0 ${
                        idx < currentStep ? 'bg-daia-blue' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-daia-blue mb-2">Vagas Rápidas @ DAIA</h3>
          {quickJobs.map((v) => (
            <button
              key={v.id}
              onClick={() => nav('/vagas')}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
            >
              <Zap className="h-4 w-4 text-daia-yellow flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{v.titulo}</div>
                <div className="text-xs text-muted-foreground truncate uppercase">
                  {v.empresaNome} • URGENTE
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </Card>
      </div>

      {/* Tráfego setorial */}
      <Card className="p-0 overflow-hidden">
        <div className="relative aspect-[16/6] bg-muted">
          {LIVE_TRAFFIC_ENABLED ? (
            <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-muted" />}>
              <DaiaTrafficMap className="absolute inset-0 h-full w-full" />
            </Suspense>
          ) : (
            // Placeholder enquanto o tráfego ao vivo está desativado: mostra o
            // último snapshot do mapa da região do DAIA em vez do mapa interativo.
            <img
              src={daiaTrafegoPlaceholder}
              alt="Prévia estática do mapa da região do DAIA"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-daia-blue/70 to-transparent px-8 py-4 text-white">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70">
                {LIVE_TRAFFIC_ENABLED ? 'Tráfego Setorial ao Vivo' : 'Tráfego Setorial'}
              </div>
              <div className="font-bold text-xl mt-1 inline-flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                DAIA
              </div>
            </div>
            {LIVE_TRAFFIC_ENABLED ? (
              <Badge variant="success">AO VIVO</Badge>
            ) : (
              <Badge variant="secondary">EM BREVE</Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
