import { FormEvent, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Landmark } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const { show } = useToast()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(email, senha)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Erro ao autenticar.')
      show(result.error ?? 'Erro ao autenticar.', 'error')
      return
    }
    show('Autenticação bem-sucedida', 'success')
    const from = (location.state as any)?.from as string | undefined
    if (from) return nav(from, { replace: true })
    // redireciona pelo role — obtido direto do localStorage
    const raw = localStorage.getItem('conectadaia.user')
    const role = raw ? JSON.parse(raw).role : 'candidato'
    nav(
      role === 'candidato'
        ? '/candidato/painel'
        : role === 'recrutador'
          ? '/recrutador/painel'
          : '/admin/painel',
      { replace: true },
    )
  }

  const fillFake = (e: string) => {
    setEmail(e)
    setSenha('123456')
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
            Acesso<br />Seguro
          </h1>
          <p className="mt-6 text-white/80 max-w-sm text-sm">
            Infraestrutura digital integrada para o ecossistema industrial de Anápolis.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-daia-green/20 border border-daia-green/40 text-daia-green-soft text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            AMBIENTE SEGURO
          </div>
        </div>
      </div>

      {/* Painel direito - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-daia-blue">Autenticação</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Insira suas credenciais institucionais para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">E-mail corporativo</Label>
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

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha de acesso</Label>
                <button type="button" className="text-xs font-semibold text-daia-blue-mid hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
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

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider text-muted-foreground">
                <span className="bg-background px-2">ou acesso alternativo</span>
              </div>
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full">
              <Landmark className="h-4 w-4" />
              Entrar com GOV.BR
            </Button>
          </form>

          {/* Credenciais de teste */}
          <div className="mt-8 rounded-lg border border-dashed bg-muted/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Credenciais de teste (senha: 123456)
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { email: 'candidato@daia.com', role: 'Candidato (Anderson)' },
                { email: 'recrutador@daia.com', role: 'Recrutador (Maria)' },
                { email: 'admin@daia.com', role: 'Administrador' },
              ].map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => fillFake(c.email)}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <span className="font-mono text-xs text-foreground">{c.email}</span>
                  <span className="text-xs text-muted-foreground">{c.role}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Acesso restrito a colaboradores autorizados do Polo DAIA.
          </p>
        </div>
      </div>
    </div>
  )
}
