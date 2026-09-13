import { useEffect, useState } from 'react'
import { Pencil, Briefcase, MapPin, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { apiEmpresas } from '@/lib/api'
import { formatCnpj } from '@/lib/utils'
import type { Empresa } from '@/types'

export default function RecruiterProfile() {
  const { user, atualizarNome } = useAuth()
  const { show } = useToast()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editSetor, setEditSetor] = useState('')
  const [editSede, setEditSede] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [sobreModalOpen, setSobreModalOpen] = useState(false)
  const [editSobreEmpresa, setEditSobreEmpresa] = useState('')
  const [salvandoSobre, setSalvandoSobre] = useState(false)

  useEffect(() => {
    if (user?.empresaId) {
      apiEmpresas.obter(user.empresaId).then(setEmpresa)
    }
  }, [user])

  const statusBadge = (status: Empresa['statusValidacao']) => {
    if (status === 'em_analise') return <Badge variant="info">EM ANÁLISE</Badge>
    if (status === 'divergencia_rfb') return <Badge variant="destructive">DIVERGÊNCIA RFB</Badge>
    if (status === 'suspensa') return <Badge variant="destructive">SUSPENSA</Badge>
    return <Badge variant="success">VALIDADA</Badge>
  }

  const abrirEdicao = () => {
    if (!empresa) return
    setEditNome(empresa.nome)
    setEditSetor(empresa.setor)
    setEditSede(empresa.sede)
    setEditModalOpen(true)
  }

  const salvar = async () => {
    if (!empresa) return
    const nomeTrim = editNome.trim()
    const setorTrim = editSetor.trim()
    const sedeTrim = editSede.trim()
    if (!nomeTrim || !setorTrim || !sedeTrim) {
      show('Nome, setor e sede não podem ficar em branco.', 'error')
      return
    }

    setSalvando(true)
    try {
      if (nomeTrim !== empresa.nome) {
        const res = await atualizarNome(nomeTrim)
        if (!res.ok) {
          show(res.error ?? 'Não foi possível atualizar o nome.', 'error')
          return
        }
      }

      const patch: Partial<Pick<Empresa, 'nome' | 'setor' | 'sede'>> = {}
      if (nomeTrim !== empresa.nome) patch.nome = nomeTrim
      if (setorTrim !== empresa.setor) patch.setor = setorTrim
      if (sedeTrim !== empresa.sede) patch.sede = sedeTrim

      let atualizado = empresa
      if (Object.keys(patch).length > 0) {
        const res = await apiEmpresas.atualizar(empresa.id, patch)
        if (!res) {
          show('Não foi possível atualizar o perfil da empresa.', 'error')
          return
        }
        atualizado = res
      }

      setEmpresa(atualizado)
      show('Perfil da empresa atualizado com sucesso.', 'success')
      setEditModalOpen(false)
    } finally {
      setSalvando(false)
    }
  }

  const abrirEdicaoSobre = () => {
    if (!empresa) return
    setEditSobreEmpresa(empresa.sobreEmpresa ?? '')
    setSobreModalOpen(true)
  }

  const salvarSobre = async () => {
    if (!empresa) return
    setSalvandoSobre(true)
    try {
      const atualizado = await apiEmpresas.atualizar(empresa.id, {
        sobreEmpresa: editSobreEmpresa.trim(),
      })
      if (!atualizado) {
        show('Não foi possível atualizar o "Sobre a Empresa".', 'error')
        return
      }
      setEmpresa(atualizado)
      show('"Sobre a Empresa" atualizado com sucesso.', 'success')
      setSobreModalOpen(false)
    } finally {
      setSalvandoSobre(false)
    }
  }

  if (!empresa) {
    return <div className="text-muted-foreground">Carregando perfil...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-daia-blue">Painel da Empresa</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os dados cadastrais e o status de validação da sua empresa.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 text-center border-t-4 border-t-daia-blue-mid md:col-span-1">
          <div className="h-20 w-20 mx-auto rounded-full gradient-daia flex items-center justify-center text-white text-2xl font-bold">
            {empresa.logoInicial}
          </div>
          <h2 className="mt-3 font-bold text-lg">{empresa.nome}</h2>
          <p className="text-sm text-muted-foreground font-mono">{formatCnpj(empresa.cnpj)}</p>
          <div className="mt-3 flex justify-center">{statusBadge(empresa.statusValidacao)}</div>

          <Button variant="outline" size="sm" className="mt-4" onClick={abrirEdicao}>
            <Pencil className="h-3.5 w-3.5" />
            Editar Perfil
          </Button>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-daia-blue">Sobre a Empresa</h3>
              <Button variant="outline" size="sm" onClick={abrirEdicaoSobre}>
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </div>
            {empresa.sobreEmpresa ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">{empresa.sobreEmpresa}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Conte um pouco sobre a empresa: história, missão e o que ela oferece aos candidatos.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-daia-blue mb-4">Dados da Empresa</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Briefcase className="h-4 w-4 text-daia-blue-mid mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Setor</div>
                  <div className="text-sm font-medium">{empresa.setor}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-daia-blue-mid mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Sede</div>
                  <div className="text-sm font-medium">{empresa.sede}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-daia-blue-mid mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Vagas Ativas
                  </div>
                  <div className="text-sm font-medium">{empresa.totalVagasAtivas}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal editar perfil da empresa */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil da Empresa</DialogTitle>
            <DialogDescription>Atualize o nome, setor e sede da empresa.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="empresa-nome">Nome da empresa</Label>
              <Input
                id="empresa-nome"
                className="mt-1.5"
                placeholder="Razão social ou nome fantasia"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="empresa-setor">Setor</Label>
              <Input
                id="empresa-setor"
                className="mt-1.5"
                placeholder="Ex: Farmacêutico"
                value={editSetor}
                onChange={(e) => setEditSetor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="empresa-sede">Sede</Label>
              <Input
                id="empresa-sede"
                className="mt-1.5"
                placeholder="Ex: DAIA Setor 2, Anápolis - GO"
                value={editSede}
                onChange={(e) => setEditSede(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal editar "Sobre a Empresa" */}
      <Dialog open={sobreModalOpen} onOpenChange={setSobreModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sobre a Empresa</DialogTitle>
            <DialogDescription>
              Uma breve descrição da empresa: história, missão e o que ela oferece.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="sobre-empresa">Sobre a empresa</Label>
            <Textarea
              id="sobre-empresa"
              className="mt-1.5"
              rows={6}
              maxLength={2000}
              placeholder="Ex: Somos uma indústria farmacêutica com 20 anos de atuação no DAIA..."
              value={editSobreEmpresa}
              onChange={(e) => setEditSobreEmpresa(e.target.value)}
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {editSobreEmpresa.length}/2000
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSobreModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarSobre} disabled={salvandoSobre}>
              {salvandoSobre ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
