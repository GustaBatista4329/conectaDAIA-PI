import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MetricCard } from '@/components/shared/MetricCard'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { apiCandidatos, apiVagas, apiCandidaturas } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { initials } from '@/lib/utils'
import type { Candidato, Vaga } from '@/types'

export default function RecruiterDashboard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [topCandidatos, setTopCandidatos] = useState<Candidato[]>([])
  const [vagaAtiva, setVagaAtiva] = useState<Vaga | null>(null)
  const [setor, setSetor] = useState('Farmacêutico')
  const [inicioImediato, setInicioImediato] = useState(true)
  const [turnoNoturno, setTurnoNoturno] = useState(false)

  useEffect(() => {
    if (user?.empresaId) carregarDados(user.empresaId)
  }, [user])

  // Antes buscava candidatos por id fixo do mock ('c7'/'c8'), que não existe
  // no backend real. Agora deriva os "melhores candidatos" de quem já se
  // candidatou às vagas da própria empresa, ordenado por perfil mais completo.
  const carregarDados = async (empresaId: string) => {
    const vagasDaEmpresa = await apiVagas.vagasDaEmpresa(empresaId)
    setVagaAtiva(vagasDaEmpresa[0] ?? null)

    const candidaturasPorVaga = await Promise.all(
      vagasDaEmpresa.map((v) => apiCandidaturas.listarPorVaga(v.id)),
    )
    const candidatoIds = Array.from(new Set(candidaturasPorVaga.flat().map((c) => c.candidatoId)))
    const candidatos = (await Promise.all(candidatoIds.map((id) => apiCandidatos.obter(id)))).filter(
      (c): c is Candidato => c !== null,
    )
    setTopCandidatos(candidatos.sort((a, b) => b.perfilCompleto - a.perfilCompleto).slice(0, 2))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-daia-blue">Métricas Operacionais</h1>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-3 gap-4">
        <MetricCard
          label="Vagas Ativas"
          value={42}
          delta="+12% desde o mês passado"
          trend="up"
        />
        <MetricCard
          label="Novos Candidatos"
          value="1,240"
          delta="85% com perfil compatível"
          trend="up"
        />
        <MetricCard
          label="Tempo Médio de Contratação"
          value="14"
          unit="d"
          delta="Prioridade necessária"
          trend="warning"
        />
      </div>

      {/* Filtros + Talentos + Pipeline */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Filtros */}
        <Card className="p-5 lg:row-span-2">
          <h3 className="font-semibold text-daia-blue">Filtros de Talentos</h3>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Setores
            </div>
            <Select value={setor} onChange={(e) => setSetor(e.target.value)}>
              <option>Farmacêutico</option>
              <option>Logística</option>
              <option>Alimentos</option>
              <option>Química</option>
            </Select>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Disponibilidade
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={inicioImediato} onCheckedChange={setInicioImediato} />
                Início Imediato
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={turnoNoturno} onCheckedChange={setTurnoNoturno} />
                Turno Noturno
              </label>
            </div>
          </div>
        </Card>

        {/* Top Candidatos */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border">
            <button className="pb-2 text-sm font-semibold text-daia-blue-mid border-b-2 border-daia-blue-mid">
              Melhores Combinações
            </button>
            <button className="pb-2 text-sm text-muted-foreground hover:text-foreground">
              Atividade Recente
            </button>
            <div className="sm:ml-auto text-xs text-muted-foreground pb-2">Mostrando 48 Candidatos</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {topCandidatos.map((c, idx) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    {c.avatarUrl && <AvatarImage src={c.avatarUrl} />}
                    <AvatarFallback>{initials(c.nome)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground truncate">{c.nome}</h4>
                      <Badge variant={idx === 0 ? 'success' : 'info'} className="text-[10px]">
                        {idx === 0 ? 'VERIFICADO' : 'TOP 5%'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.cargo}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.skills.slice(0, 3).map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-[10px]">
                      {s.nome.toUpperCase()}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {c.setorAtuacao === 'Farmacêutico' ? 'DAIA Setor 2' : 'DAIA Sede'} • {c.anosExperiencia} anos de Exp.
                  </span>
                  <button className="text-daia-blue-mid font-semibold hover:underline inline-flex items-center gap-1">
                    Ver Perfil <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <Card className="p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-semibold text-daia-blue">Velocidade do Pipeline: Químico Farmacêutico</h3>
            <Badge variant="info" className="font-semibold">
              BUSCA ATIVA
            </Badge>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
            <div className="h-full bg-daia-blue-mid" style={{ width: '70%' }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Triagem', count: 24, unit: 'Candidatos' },
              { label: 'Entrevista', count: 8, unit: 'Candidatos' },
              { label: 'Técnico', count: 3, unit: 'Candidatos' },
              { label: 'Contratado', count: '0 / 2', unit: 'Vagas' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-sm font-semibold text-daia-blue">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.count} {s.unit}
                </div>
              </div>
            ))}
          </div>

          {vagaAtiva && (
            <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate min-w-0">
                Vaga exemplo: {vagaAtiva.titulo}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => nav(`/recrutador/vagas/${vagaAtiva.id}/candidatos`)}
              >
                Abrir Kanban <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
