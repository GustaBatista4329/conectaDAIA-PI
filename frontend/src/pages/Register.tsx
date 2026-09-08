import { FormEvent, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User as UserIcon, Briefcase, Building2, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type Perfil = 'candidato' | 'empresa'

const NIVEIS = [
  { codigo: 'junior', nome: 'Júnior' },
  { codigo: 'pleno', nome: 'Pleno' },
  { codigo: 'senior', nome: 'Sênior' },
  { codigo: 'gerencia', nome: 'Gerência' },
]

export default function Register() {
  const { registerCandidato, registerEmpresa } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { show } = useToast()

  const [perfil, setPerfil] = useState<Perfil>(
    params.get('perfil') === 'empresa' ? 'empresa' : 'candidato',
  )

  // Campos comuns
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)

  // Campos de candidato
  const [cargo, setCargo] = useState('')
  const [nivel, setNivel] = useState('junior')
  const [setorAtuacao, setSetorAtuacao] = useState('')
  const [localidade, setLocalidade] = useState('')
  const [anosExperiencia, setAnosExperiencia] = useState('0')

  // Campos de empresa
  const [cnpj, setCnpj] = useState('')
  const [setor, setSetor] = useState('')
  const [sede, setSede] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }
    if (senha.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    const result =
      perfil === 'candidato'
        ? await registerCandidato({
            nome,
            email,
            senha,
            cargo,
            nivel,
            setorAtuacao,
            localidade,
            anosExperiencia: Number(anosExperiencia) || 0,
          })
        : await registerEmpresa({ nome, email, senha, cnpj, setor, sede })
    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível concluir o cadastro.')
      show(result.error ?? 'Não foi possível concluir o cadastro.', 'error')
      return
    }

    show('Cadastro realizado com sucesso!', 'success')
    nav(perfil === 'candidato' ? '/candidato/painel' : '/recrutador/painel', { replace: true })
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo - identidade */}
      <div className="hidden lg:flex lg:w-5/12 gradient-daia text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=1200&q=60')] bg-cover bg-center" />
        <div className="relative z-10">
          <div className="text-2xl font-bold">ConectaDAIA</div>
          <div className="text-xs uppercase tracking-widest text-white/70 mt-1">
            Portal Institucional
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-tight">
            Crie sua<br />Conta
          </h1>
          <p className="mt-6 text-white/80 max-w-sm text-sm">
            Junte-se ao maior polo industrial do Centro-Oeste, como candidato ou empresa.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-daia-green/20 border border-daia-green/40 text-daia-green-soft text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            CADASTRO GRATUITO
          </div>
        </div>
      </div>

      {/* Painel direito - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-daia-blue">Criar Conta</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Preencha os dados abaixo para começar.
            </p>
          </div>

          {/* Toggle de perfil */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg bg-muted/50 border">
            <button
              type="button"
              onClick={() => setPerfil('candidato')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors',
                perfil === 'candidato'
                  ? 'bg-background shadow-sm text-daia-blue'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <UserIcon className="h-4 w-4" />
              Sou Candidato
            </button>
            <button
              type="button"
              onClick={() => setPerfil('empresa')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors',
                perfil === 'empresa'
                  ? 'bg-background shadow-sm text-daia-blue'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Building2 className="h-4 w-4" />
              Sou Empresa
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">{perfil === 'candidato' ? 'Nome completo' : 'Nome da empresa'}</Label>
              <div className="mt-1.5 relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  placeholder={perfil === 'candidato' ? 'Seu nome' : 'Razão social'}
                  className="pl-10"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="senha">Senha</Label>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="senha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="Mín. 8 caracteres"
                    className="pl-10 pr-10"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmarSenha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    className="pl-10"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
            </div>

            {perfil === 'candidato' ? (
              <>
                <div>
                  <Label htmlFor="cargo">Cargo desejado</Label>
                  <div className="mt-1.5 relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cargo"
                      placeholder="Ex: Técnico de Manutenção"
                      className="pl-10"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nivel">Nível</Label>
                    <div className="mt-1.5">
                      <Select id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                        {NIVEIS.map((n) => (
                          <option key={n.codigo} value={n.codigo}>
                            {n.nome}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="anosExperiencia">Anos de experiência</Label>
                    <Input
                      id="anosExperiencia"
                      type="number"
                      min={0}
                      className="mt-1.5"
                      value={anosExperiencia}
                      onChange={(e) => setAnosExperiencia(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="setorAtuacao">Setor de atuação</Label>
                    <Input
                      id="setorAtuacao"
                      placeholder="Ex: Farmoquímico"
                      className="mt-1.5"
                      value={setorAtuacao}
                      onChange={(e) => setSetorAtuacao(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="localidade">Localidade</Label>
                    <Input
                      id="localidade"
                      placeholder="Ex: Anápolis - GO"
                      className="mt-1.5"
                      value={localidade}
                      onChange={(e) => setLocalidade(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <div className="mt-1.5 relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      className="pl-10"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      minLength={14}
                      maxLength={18}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="setor">Setor</Label>
                    <Input
                      id="setor"
                      placeholder="Ex: Logística"
                      className="mt-1.5"
                      value={setor}
                      onChange={(e) => setSetor(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sede">Sede</Label>
                    <Input
                      id="sede"
                      placeholder="Ex: Anápolis - GO"
                      className="mt-1.5"
                      value={sede}
                      onChange={(e) => setSede(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-semibold text-daia-blue-mid hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
