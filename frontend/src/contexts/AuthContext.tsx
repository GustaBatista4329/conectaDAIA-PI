import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiAuth, CandidatoRegistro, EmpresaRegistro } from '@/lib/api'
import { ApiError } from '@/lib/http'
import type { User } from '@/types'

type AuthResult = { ok: boolean; error?: string }

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, senha: string) => Promise<AuthResult>
  registerCandidato: (dados: CandidatoRegistro) => Promise<AuthResult>
  registerEmpresa: (dados: EmpresaRegistro) => Promise<AuthResult>
  atualizarNome: (nome: string) => Promise<AuthResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Mantido por compatibilidade: Login.tsx lê essa chave direto do localStorage
// pra decidir o redirect por role logo após autenticar. O token JWT em si
// (fonte real da sessão) é gerenciado por lib/http.ts.
const STORAGE_KEY = 'conectadaia.user'

function extrairMensagemErro(e: unknown, fallback = 'Não foi possível concluir o cadastro.'): string {
  if (e instanceof ApiError) return e.message
  return fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restaurar sessão a partir do token salvo (se houver e ainda for válido)
  useEffect(() => {
    apiAuth.me().then((u) => {
      setUser(u)
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      else localStorage.removeItem(STORAGE_KEY)
      setLoading(false)
    })
  }, [])

  const login = async (email: string, senha: string) => {
    try {
      const u = await apiAuth.login(email, senha)
      if (!u) return { ok: false, error: 'Credenciais inválidas' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      setUser(u)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Credenciais inválidas' }
    }
  }

  const registerCandidato = async (dados: CandidatoRegistro) => {
    try {
      const u = await apiAuth.registrarCandidato(dados)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      setUser(u)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: extrairMensagemErro(e) }
    }
  }

  const registerEmpresa = async (dados: EmpresaRegistro) => {
    try {
      const u = await apiAuth.registrarEmpresa(dados)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      setUser(u)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: extrairMensagemErro(e) }
    }
  }

  const logout = () => {
    apiAuth.logout()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const atualizarNome = async (nome: string) => {
    try {
      const u = await apiAuth.atualizarPerfil({ nome })
      if (!u) return { ok: false, error: 'Não foi possível atualizar o nome.' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      setUser(u)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: extrairMensagemErro(e, 'Não foi possível atualizar o nome.') }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, registerCandidato, registerEmpresa, atualizarNome, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
