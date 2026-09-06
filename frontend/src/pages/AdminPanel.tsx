import { useEffect, useState } from 'react'
import { AlertTriangle, FileText, CheckCircle2, XCircle, Search, ChevronRight, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/shared/MetricCard'
import { useToast } from '@/components/ui/toast'
import { apiAdmin, apiEmpresas } from '@/lib/api'
import type { Denuncia, Empresa, LogAuditoria, MetricasPlataforma } from '@/types'
import { formatDateTime, timeAgo } from '@/lib/utils'

export default function AdminPanel() {
  const { show } = useToast()

  const [metricas, setMetricas] = useState<MetricasPlataforma | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [seedLoading, setSeedLoading] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  const refresh = async () => {
    const [m, e, d, l] = await Promise.all([
      apiAdmin.metricas(),
      apiEmpresas.listar(),
      apiAdmin.listarDenuncias(),
      apiAdmin.logsAuditoria(),
    ])
    setMetricas(m)
    setEmpresas(e.filter((x) => x.statusValidacao !== 'validada').slice(0, 3))
    setDenuncias(d.filter((x) => x.status === 'pendente'))
    setLogs(l)
  }

  const validar = async (id: string, nome: string) => {
    await apiEmpresas.validar(id)
    show(`${nome} validada com sucesso.`, 'success')
    refresh()
  }

  const suspender = async (denunciaId: string, alvo: string) => {
    await apiAdmin.resolverDenuncia(denunciaId, 'suspender')
    show(`Ação registrada: suspensão de ${alvo}.`, 'success')
    refresh()
  }

  const ignorar = async (denunciaId: string) => {
    await apiAdmin.resolverDenuncia(denunciaId, 'ignorar')
    show('Denúncia marcada como ignorada.', 'info')
    refresh()
  }

  const investigar = async (denunciaId: string) => {
    await apiAdmin.resolverDenuncia(denunciaId, 'investigar')
    show('Denúncia em investigação.', 'info')
    refresh()
  }

  const carregarDadosDemo = async () => {
    setSeedLoading(true)
    try {
      const r = await apiAdmin.seedDemo()
      const total = r.candidatos + r.empresas + r.vagas + r.candidaturas + r.denuncias
      show(
        total > 0
          ? `Dados de demonstração carregados: ${r.candidatos} candidatos, ${r.empresas} empresas, ${r.vagas} vagas, ${r.candidaturas} candidaturas, ${r.denuncias} denúncias.`
          : 'Dados de demonstração já estavam carregados.',
        'success',
      )
      refresh()
    } catch {
      show('Não foi possível carregar os dados de demonstração.', 'error')
    } finally {
      setSeedLoading(false)
    }
  }

  const statusEmpresaBadge = (status: Empresa['statusValidacao']) => {
    if (status === 'em_analise') return <Badge variant="info">EM ANÁLISE</Badge>
    if (status === 'divergencia_rfb') return <Badge variant="destructive">DIVERGÊNCIA RFB</Badge>
    if (status === 'suspensa') return <Badge variant="destructive">SUSPENSA</Badge>
    return <Badge variant="success">VALIDADA</Badge>
  }

  if (!metricas) return <div className="text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-daia-blue">Painel Administrativo Master</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão global de operações, moderação e auditoria do polo DAIA.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={carregarDadosDemo}
          disabled={seedLoading}
          className="shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          {seedLoading ? 'Carregando...' : 'Carregar dados de demonstração'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard
          label="Vagas Ativas"
          value={metricas.vagasAtivas.toLocaleString('pt-BR')}
          delta="+12%"
          trend="up"
        />
        <MetricCard
          label="Tempo Médio Contratação"
          value={metricas.tempoMedioContratacao}
          unit="dias"
          delta="-2d"
          trend="up"
        />
        <MetricCard
          label="Empresas Validadas"
          value={metricas.empresasValidadas}
          delta="estável"
          trend="neutral"
        />
        <MetricCard
          label="Denúncias Pendentes"
          value={denuncias.length}
          delta="Prioridade"
          trend="warning"
          className="border-destructive/40"
        />
      </div>

      {/* Moderação + Denúncias */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Moderação de Empresas */}
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-daia-blue">Moderação de Empresas</h2>
            <button className="text-sm font-semibold text-daia-blue-mid hover:underline">
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {empresas.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-md">
                Nenhuma empresa pendente de moderação.
              </div>
            )}
            {empresas.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-md bg-daia-blue-light flex items-center justify-center text-daia-blue font-bold text-sm">
                  {e.logoInicial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{e.nome}</div>
                  <div className="text-xs text-muted-foreground font-mono">CNPJ: {e.cnpj}</div>
                </div>
                {statusEmpresaBadge(e.statusValidacao)}
                {e.statusValidacao === 'divergencia_rfb' ? (
                  <Button variant="destructive" size="sm" onClick={() => show('Análise RFB reaberta.', 'info')}>
                    Revisar
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => validar(e.id, e.nome)}>
                    Validar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Denúncias */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-daia-blue inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Denúncias Suspeitas
            </h2>
            <Badge variant="destructive">{denuncias.length}</Badge>
          </div>

          <div className="space-y-3">
            {denuncias.map((d) => (
              <div key={d.id} className="p-3 border rounded-lg bg-destructive/5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{d.alvo}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {d.descricao}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {timeAgo(d.criadaEm)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {d.tipo === 'vaga_falsa' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => suspender(d.id, d.alvo)}
                    >
                      Suspender Vaga
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => investigar(d.id)}
                    >
                      Investigar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => ignorar(d.id)}
                  >
                    Ignorar
                  </Button>
                </div>
              </div>
            ))}
            {denuncias.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-daia-green mx-auto mb-2" />
                Nenhuma denúncia pendente.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Logs de Auditoria */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-daia-blue inline-flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs de Auditoria Recentes
          </h2>
          <button className="text-sm font-semibold text-daia-blue-mid hover:underline inline-flex items-center gap-1">
            Ver Log Completo <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/40 text-sm"
            >
              <div className="text-[10px] font-mono bg-muted px-2 py-1 rounded text-muted-foreground tracking-wider">
                {log.tipo}
              </div>
              <span className="flex-1 text-foreground">{log.descricao}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(log.criadoEm)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
