import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, Map, List } from 'lucide-react'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { JobCard } from '@/components/shared/JobCard'
import { Select } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { apiVagas, apiCandidaturas, VagaFiltros } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import type { AreaProfissional, LocalTrabalho, Vaga } from '@/types'
import { useNavigate } from 'react-router-dom'
import {
  AREAS_PROFISSIONAIS_OPTIONS,
  DISTRITOS as distritos,
  LOCAIS_TRABALHO,
  LOCAL_TRABALHO_LABELS,
  NIVEIS as niveis,
} from '@/lib/vagaConstants'

export default function JobSearch() {
  const { user } = useAuth()
  const { show } = useToast()
  const nav = useNavigate()

  const [termo, setTermo] = useState('')
  const [areaProfissional, setAreaProfissional] = useState<AreaProfissional | ''>('') // vazio = todas as áreas
  const [faixa, setFaixa] = useState<[number, number]>([0, 50000])
  const [filtroNiveis, setFiltroNiveis] = useState<string[]>([]) // vazio = busca todos os níveis
  const [distrito, setDistrito] = useState<string>('')
  const [localTrabalho, setLocalTrabalho] = useState<LocalTrabalho | ''>('')
  const [view, setView] = useState<'list' | 'map'>('list')

  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidaturasUsuario, setCandidaturasUsuario] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const filtros: VagaFiltros = useMemo(
    () => ({
      termo: termo || undefined,
      areaProfissional: areaProfissional || undefined,
      nivel: filtroNiveis.length === 1 ? filtroNiveis[0] : undefined,
      distrito: distrito || undefined,
      localTrabalho: localTrabalho || undefined,
      salarioMin: faixa[0],
      salarioMax: faixa[1],
    }),
    [termo, areaProfissional, filtroNiveis, distrito, localTrabalho, faixa],
  )

  useEffect(() => {
    setLoading(true)
    apiVagas.listar(filtros).then((r) => {
      // aplica filtro multi-select em memória (a API só filtra 1 por campo)
      let result = r
      if (filtroNiveis.length > 1) result = result.filter((v) => filtroNiveis.includes(v.nivel))
      setVagas(result)
      setLoading(false)
    })
  }, [filtros, filtroNiveis])

  useEffect(() => {
    if (user?.candidatoId) {
      apiCandidaturas
        .listarPorCandidato(user.candidatoId)
        .then((cs) => setCandidaturasUsuario(cs.map((c) => c.vagaId)))
    }
  }, [user])

  const toggleNivel = (n: string) =>
    setFiltroNiveis((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))

  const handleApply = async (vaga: Vaga) => {
    if (!user) {
      show('Faça login para se candidatar.', 'info')
      nav('/login', { state: { from: '/vagas' } })
      return
    }
    if (user.role !== 'candidato' || !user.candidatoId) {
      show('Apenas candidatos podem aplicar-se a vagas.', 'error')
      return
    }
    const res = await apiCandidaturas.candidatar(user.candidatoId, vaga.id)
    if (res) {
      setCandidaturasUsuario((prev) => [...prev, vaga.id])
      show(`Candidatura enviada para ${vaga.titulo}!`, 'success')
    }
  }

  // Botão "CANDIDATURA RÁPIDA" da sidebar: antes ia pro /login sempre, mesmo
  // com o usuário já logado como candidato — corrigido pra completar a
  // candidatura na primeira vaga listada quando já está autenticado.
  const handleCandidaturaRapida = () => {
    if (!user) {
      nav('/login', { state: { from: '/vagas' } })
      return
    }
    if (user.role !== 'candidato' || !user.candidatoId) {
      show('Apenas candidatos podem usar a candidatura rápida.', 'error')
      return
    }
    if (vagas.length === 0) {
      show('Nenhuma vaga disponível pra candidatura rápida no momento.', 'info')
      return
    }
    handleApply(vagas[0])
  }

  // Candidatos logados navegam até aqui pela sidebar do painel (link "Buscar
  // Vagas"). Como essa rota também é pública (visitantes sem login podem
  // buscar vagas), o layout muda conforme o contexto: dentro do painel do
  // candidato para quem está logado, e com o cabeçalho público para visitantes
  // — assim a sidebar não some ao clicar em "Buscar Vagas".
  const content = (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 w-full flex flex-col lg:flex-row gap-6">
      {/* Sidebar filtros */}
      <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <h2 className="font-bold text-daia-blue">Filtros de Busca</h2>

          {/* Área profissional */}
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Área Profissional
            </div>
            <Combobox
              options={[{ value: '', label: 'Todas as Áreas' }, ...AREAS_PROFISSIONAIS_OPTIONS]}
              value={areaProfissional}
              onChange={(v) => setAreaProfissional(v as AreaProfissional | '')}
              placeholder="Todas as Áreas"
              searchPlaceholder="Buscar área..."
            />
          </div>

          {/* Faixa salarial */}
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Faixa Salarial (R$)
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={faixa[0]}
                onChange={(e) => setFaixa([Number(e.target.value) || 0, faixa[1]])}
                className="h-9 text-sm"
              />
              <span className="text-muted-foreground text-xs">até</span>
              <Input
                type="number"
                value={faixa[1]}
                onChange={(e) => setFaixa([faixa[0], Number(e.target.value) || 0])}
                className="h-9 text-sm"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{(faixa[0] / 1000).toFixed(0)}k</span>
              <span>{(faixa[1] / 1000).toFixed(0)}k+</span>
            </div>
          </div>

          {/* Nível de experiência */}
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Nível de Experiência
            </div>
            <div className="flex flex-wrap gap-1.5">
              {niveis.map((n) => {
                const active = filtroNiveis.includes(n)
                return (
                  <button
                    key={n}
                    onClick={() => toggleNivel(n)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-daia-green text-white border-daia-green'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modelo de trabalho */}
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Modelo de Trabalho
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LOCAIS_TRABALHO.map((lt) => {
                const active = localTrabalho === lt
                return (
                  <button
                    key={lt}
                    onClick={() => setLocalTrabalho(active ? '' : lt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-daia-green text-white border-daia-green'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {LOCAL_TRABALHO_LABELS[lt]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* CTA bloco */}
          <Card className="p-5 gradient-daia text-white">
            <div className="font-semibold">Construa sua carreira no DAIA</div>
            <p className="text-xs text-white/80 mt-1">
              Mais de 50 empresas industriais premium estão contratando agora.
            </p>
            <Button variant="success" size="sm" className="w-full mt-4" onClick={handleCandidaturaRapida}>
              CANDIDATURA RÁPIDA
            </Button>
          </Card>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-daia-blue">
              Encontre o motor do seu <span className="text-daia-green">futuro profissional.</span>
            </h1>
          </div>

          {/* Busca principal */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 h-12"
                placeholder="Título do cargo ou palavras-chave (ex: Engenheiro Químico)"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                icon={<MapPin className="h-4 w-4" />}
                value={distrito}
                onChange={(e) => setDistrito(e.target.value)}
                className="h-12"
              >
                <option value="">Distritos do DAIA (All)</option>
                {distritos.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <Button size="lg" className="h-12 px-8 w-full md:w-auto">
              <Search className="h-4 w-4" />
              Buscar Vagas
            </Button>
          </div>

          {/* Contadores + switch view */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vagas abertas
              </div>
              <div className="text-2xl font-bold text-daia-blue">
                {loading ? '...' : `${vagas.length} Vagas Ativas`}
              </div>
            </div>
            <div className="inline-flex bg-muted rounded-md p-1">
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                className="h-8"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Visualização em Lista</span>
                <span className="sm:hidden">Lista</span>
              </Button>
              <Button
                variant={view === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('map')}
                className="h-8"
              >
                <Map className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mapa do Distrito</span>
                <span className="sm:hidden">Mapa</span>
              </Button>
            </div>
          </div>

          {/* Lista de vagas */}
          {view === 'list' ? (
            <div className="space-y-3">
              {vagas.length === 0 && !loading && (
                <div className="text-center text-muted-foreground py-20 border border-dashed rounded-lg">
                  Nenhuma vaga encontrada com os filtros selecionados.
                </div>
              )}
              {vagas.map((v) => (
                <JobCard
                  key={v.id}
                  vaga={v}
                  alreadyApplied={candidaturasUsuario.includes(v.id)}
                  onDetails={() => show(`Detalhes: ${v.titulo}`, 'info')}
                  onApply={handleApply}
                />
              ))}
            </div>
          ) : (
            <Card className="aspect-video relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=70"
                className="absolute inset-0 w-full h-full object-cover"
                alt="Mapa DAIA"
              />
              <div className="absolute inset-0 bg-daia-blue/60" />
              <div className="absolute inset-0 flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-4 sm:p-6 text-white">
                <div className="min-w-0">
                  <div className="font-bold text-xl">Mapeamento DAIA</div>
                  <div className="text-sm text-white/80">Explore vagas em todo o distrito de 10.000 hectares.</div>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
                >
                  <Map className="h-4 w-4" />
                  Abrir Mapa Interativo
                </Button>
              </div>
            </Card>
          )}
        </div>
    </div>
  )

  if (user?.role === 'candidato') {
    return <DashboardLayout>{content}</DashboardLayout>
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      {content}
      <PublicFooter />
    </div>
  )
}
