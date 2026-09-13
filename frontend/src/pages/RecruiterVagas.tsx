import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Briefcase, DollarSign, Users, ChevronRight, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { apiVagas } from '@/lib/api'
import { ApiError } from '@/lib/http'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  AREAS_PROFISSIONAIS_OPTIONS,
  AREA_PROFISSIONAL_LABELS,
  DISTRITOS,
  LOCAIS_TRABALHO,
  LOCAL_TRABALHO_LABELS,
  NIVEIS,
  NIVEL_NOME_PARA_CODIGO,
  TIPOS_CONTRATO,
  TIPO_CONTRATO_NOME_PARA_CODIGO,
} from '@/lib/vagaConstants'
import type { AreaProfissional, LocalTrabalho, Vaga } from '@/types'

interface FormVaga {
  titulo: string
  descricao: string
  areaProfissional: AreaProfissional
  distrito: string
  localTrabalho: LocalTrabalho
  nivel: Vaga['nivel']
  tipoContrato: Vaga['tipoContrato']
  salarioMin: string
  salarioMax: string
}

const FORM_INICIAL: FormVaga = {
  titulo: '',
  descricao: '',
  areaProfissional: 'ADMINISTRACAO',
  distrito: DISTRITOS[0],
  localTrabalho: 'PRESENCIAL',
  nivel: NIVEIS[0],
  tipoContrato: TIPOS_CONTRATO[0],
  salarioMin: '',
  salarioMax: '',
}

export default function RecruiterVagas() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { show } = useToast()

  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormVaga>(FORM_INICIAL)
  const [novaSkill, setNovaSkill] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  const carregar = async (empresaId: string) => {
    setLoading(true)
    const lista = await apiVagas.vagasDaEmpresa(empresaId)
    lista.sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime())
    setVagas(lista)
    setLoading(false)
  }

  useEffect(() => {
    if (user?.empresaId) carregar(user.empresaId)
  }, [user])

  const abrirModal = () => {
    setForm(FORM_INICIAL)
    setSkills([])
    setNovaSkill('')
    setModalOpen(true)
  }

  const adicionarSkillTag = () => {
    const nome = novaSkill.trim()
    if (!nome) return
    if (skills.some((s) => s.toLowerCase() === nome.toLowerCase())) {
      setNovaSkill('')
      return
    }
    setSkills((prev) => [...prev, nome])
    setNovaSkill('')
  }

  const removerSkillTag = (nome: string) => {
    setSkills((prev) => prev.filter((s) => s !== nome))
  }

  const criarVaga = async () => {
    if (!user?.empresaId) return

    const titulo = form.titulo.trim()
    const descricao = form.descricao.trim()

    if (!titulo || !descricao) {
      show('Preencha o título e a descrição da vaga.', 'error')
      return
    }

    // Salário não é obrigatório — mas se preencher um lado, precisa dos dois
    // (senão a vaga fica "salário a combinar", que é justamente a opção sem
    // preencher nenhum dos dois campos).
    const temMin = form.salarioMin.trim() !== ''
    const temMax = form.salarioMax.trim() !== ''
    let salarioMin: number | undefined
    let salarioMax: number | undefined

    if (temMin || temMax) {
      if (!temMin || !temMax) {
        show('Informe salário mínimo e máximo juntos, ou deixe os dois em branco.', 'error')
        return
      }
      salarioMin = Number(form.salarioMin)
      salarioMax = Number(form.salarioMax)
      if (Number.isNaN(salarioMin) || Number.isNaN(salarioMax)) {
        show('Faixa salarial inválida.', 'error')
        return
      }
      if (salarioMax < salarioMin) {
        show('O salário máximo não pode ser menor que o mínimo.', 'error')
        return
      }
    }

    if (skills.length === 0) {
      show('Adicione pelo menos uma skill necessária para a vaga.', 'error')
      return
    }

    setSalvando(true)
    try {
      await apiVagas.criar({
        titulo,
        descricao,
        areaProfissional: form.areaProfissional,
        distrito: form.distrito,
        localTrabalho: form.localTrabalho,
        nivel: NIVEL_NOME_PARA_CODIGO[form.nivel] ?? form.nivel,
        tipoContrato: TIPO_CONTRATO_NOME_PARA_CODIGO[form.tipoContrato] ?? form.tipoContrato,
        salarioMin,
        salarioMax,
        habilidadesRequeridas: skills,
      })
      show('Vaga publicada com sucesso!', 'success')
      setModalOpen(false)
      carregar(user.empresaId)
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Não foi possível publicar a vaga.', 'error')
    } finally {
      setSalvando(false)
    }
  }

  const desativarVaga = async (vaga: Vaga) => {
    const ok = await apiVagas.desativar(vaga.id)
    if (ok) {
      show(`Vaga "${vaga.titulo}" desativada.`, 'info')
      setVagas((prev) => prev.map((v) => (v.id === vaga.id ? { ...v, ativa: false } : v)))
    } else {
      show('Não foi possível desativar a vaga.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-daia-blue">Gestão de Vagas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publique novas vagas e acompanhe as vagas da sua empresa.
          </p>
        </div>
        <Button onClick={abrirModal}>
          <Plus className="h-4 w-4" />
          Nova Vaga
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando vagas...</div>
      ) : vagas.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Sua empresa ainda não publicou nenhuma vaga.
          </p>
          <Button className="mt-4" onClick={abrirModal}>
            <Plus className="h-4 w-4" />
            Publicar Primeira Vaga
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {vagas.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{v.titulo}</h3>
                    <Badge variant={v.ativa ? 'success' : 'secondary'}>
                      {v.ativa ? 'ATIVA' : 'INATIVA'}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{AREA_PROFISSIONAL_LABELS[v.areaProfissional]}</span>
                    <span>·</span>
                    <span>{v.distrito}</span>
                    <span>·</span>
                    <span>{LOCAL_TRABALHO_LABELS[v.localTrabalho]}</span>
                    <span>·</span>
                    <span>{v.nivel}</span>
                    <span>·</span>
                    <span>{v.tipoContrato}</span>
                    <span>·</span>
                    <span>Publicada em {formatDate(v.dataPublicacao)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-daia-blue-mid">
                    <DollarSign className="h-3.5 w-3.5" />
                    {v.salarioMin !== undefined && v.salarioMax !== undefined
                      ? `${formatCurrency(v.salarioMin)} – ${formatCurrency(v.salarioMax)}`
                      : 'Salário a combinar'}
                  </div>
                  {v.habilidadesRequeridas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {v.habilidadesRequeridas.map((h) => (
                        <Badge key={h} variant="outline" className="text-[10px]">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {v.totalCandidatos} candidato{v.totalCandidatos === 1 ? '' : 's'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nav(`/recrutador/vagas/${v.id}/candidatos`)}
                  >
                    Ver Candidatos <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  {v.ativa && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => desativarVaga(v)}
                    >
                      Desativar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar vaga */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar Nova Vaga</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da vaga — quanto mais completo, melhor o match com candidatos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="vaga-titulo">Título da vaga</Label>
              <Input
                id="vaga-titulo"
                className="mt-1.5"
                placeholder="Ex: Engenheiro de Processos Pleno"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="vaga-descricao">Descrição da vaga</Label>
              <Textarea
                id="vaga-descricao"
                className="mt-1.5"
                rows={5}
                placeholder="Descreva responsabilidades, requisitos e benefícios..."
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaga-area">Área profissional</Label>
                <Combobox
                  id="vaga-area"
                  className="mt-1.5"
                  options={AREAS_PROFISSIONAIS_OPTIONS}
                  value={form.areaProfissional}
                  onChange={(v) => setForm({ ...form, areaProfissional: v as AreaProfissional })}
                  placeholder="Selecione a área..."
                  searchPlaceholder="Buscar área..."
                />
              </div>
              <div>
                <Label htmlFor="vaga-distrito">Distrito (local)</Label>
                <Select
                  id="vaga-distrito"
                  className="mt-1.5"
                  value={form.distrito}
                  onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                >
                  {DISTRITOS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaga-nivel">Nível</Label>
                <Select
                  id="vaga-nivel"
                  className="mt-1.5"
                  value={form.nivel}
                  onChange={(e) => setForm({ ...form, nivel: e.target.value as Vaga['nivel'] })}
                >
                  {NIVEIS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="vaga-tipo-contrato">Tipo de contrato</Label>
                <Select
                  id="vaga-tipo-contrato"
                  className="mt-1.5"
                  value={form.tipoContrato}
                  onChange={(e) =>
                    setForm({ ...form, tipoContrato: e.target.value as Vaga['tipoContrato'] })
                  }
                >
                  {TIPOS_CONTRATO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="vaga-modelo">Modelo de trabalho</Label>
              <Select
                id="vaga-modelo"
                className="mt-1.5"
                value={form.localTrabalho}
                onChange={(e) => setForm({ ...form, localTrabalho: e.target.value as LocalTrabalho })}
              >
                {LOCAIS_TRABALHO.map((lt) => (
                  <option key={lt} value={lt}>
                    {LOCAL_TRABALHO_LABELS[lt]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Faixa salarial (R$)</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-1.5">
                Opcional — deixe os dois campos em branco para publicar como "salário a combinar".
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="vaga-salario-min"
                    type="number"
                    min={0}
                    placeholder="Mínimo"
                    value={form.salarioMin}
                    onChange={(e) => setForm({ ...form, salarioMin: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    id="vaga-salario-max"
                    type="number"
                    min={0}
                    placeholder="Máximo"
                    value={form.salarioMax}
                    onChange={(e) => setForm({ ...form, salarioMax: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="vaga-skill">Skills necessárias</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="vaga-skill"
                  placeholder="Ex: Soldagem MIG/MAG"
                  value={novaSkill}
                  onChange={(e) => setNovaSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      adicionarSkillTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={adicionarSkillTag}>
                  Adicionar
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <div
                      key={s}
                      className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-daia-blue-light text-daia-blue-mid text-xs font-medium"
                    >
                      {s}
                      <button
                        onClick={() => removerSkillTag(s)}
                        className="h-5 w-5 rounded-full hover:bg-daia-blue-mid/20 flex items-center justify-center"
                        aria-label={`Remover ${s}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={criarVaga} disabled={salvando}>
              {salvando ? 'Publicando...' : 'Publicar Vaga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
