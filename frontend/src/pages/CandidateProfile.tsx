import { useEffect, useRef, useState } from 'react'
import { Upload, Plus, X, Eye, Bell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { Candidato, Skill } from '@/types'

const skillCategorias: Record<string, { label: string; variant: any }> = {
  'operacao-manutencao': { label: 'Operação e Manutenção', variant: 'info' },
  'normas-seguranca': { label: 'Normas e Segurança', variant: 'success' },
  gestao: { label: 'Gestão', variant: 'default' },
  tecnica: { label: 'Técnica', variant: 'secondary' },
  idiomas: { label: 'Idiomas', variant: 'outline' },
}

export default function CandidateProfile() {
  const { user } = useAuth()
  const { show } = useToast()
  const [candidato, setCandidato] = useState<Candidato | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [novaSkillNome, setNovaSkillNome] = useState('')
  const [novaSkillCat, setNovaSkillCat] = useState('operacao-manutencao')
  const fileRef = useRef<HTMLInputElement>(null)
  const [curriculoNome, setCurriculoNome] = useState<string | null>(null)
  const [alertasGlobal, setAlertasGlobal] = useState(true)

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-daia-blue">Minhas Skills</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione habilidades da taxonomia industrial controlada.
                </p>
              </div>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Adicionar Skill
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(skillsPorCategoria).map(([cat, skills]) => (
                <div key={cat}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {skillCategorias[cat]?.label ?? cat}
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
                        setNovaSkillCat(cat)
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
                onChange={(e) => setNovaSkillCat(e.target.value)}
              >
                {Object.entries(skillCategorias).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
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
