import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiAuth } from '@/lib/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, senha: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Mantido por compatibilidade: Login.tsx lê essa chave direto do localStorage
// pra decidir o redirect por role logo após autenticar. O token JWT em si
// (fonte real da sessão) é gerenciado por lib/http.ts.
const STORAGE_KEY = 'conectadaia.user'

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

  const logout = () => {
    apiAuth.logout()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
