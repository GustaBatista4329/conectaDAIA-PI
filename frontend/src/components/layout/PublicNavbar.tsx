import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Início' },
  { to: '/vagas', label: 'Vagas' },
  { to: '/setores', label: 'Setores' },
  { to: '/empresas', label: 'Empresas' },
]

export function PublicNavbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2 font-bold text-daia-blue text-lg">
            <div className="h-8 w-8 rounded-md gradient-daia flex items-center justify-center text-white text-sm">
              CD
            </div>
            ConectaDAIA
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-daia-blue-mid border-b-2 border-daia-blue-mid rounded-none'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const path =
                    user.role === 'candidato'
                      ? '/candidato/painel'
                      : user.role === 'recrutador'
                        ? '/recrutador/painel'
                        : '/admin/painel'
                  nav(path)
                }}
              >
                Meu Painel
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => nav('/login')}>
                Entrar
              </Button>
              <Button size="sm" onClick={() => nav('/login?action=anunciar')}>
                Anunciar Vaga
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
