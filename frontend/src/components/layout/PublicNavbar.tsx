import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoIcon, Wordmark } from '@/components/brand/Logo'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const irPara = (path: string) => {
    setMobileOpen(false)
    nav(path)
  }

  const authButtons = (stack?: boolean) =>
    user ? (
      <>
        <Button
          variant="outline"
          size="sm"
          className={stack ? 'w-full' : undefined}
          onClick={() => {
            const path =
              user.role === 'candidato'
                ? '/candidato/painel'
                : user.role === 'recrutador'
                  ? '/recrutador/painel'
                  : '/admin/painel'
            irPara(path)
          }}
        >
          Meu Painel
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={stack ? 'w-full' : undefined}
          onClick={() => {
            setMobileOpen(false)
            logout()
          }}
        >
          Sair
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="ghost"
          size="sm"
          className={stack ? 'w-full' : undefined}
          onClick={() => irPara('/registro?perfil=empresa')}
        >
          Anunciar Vaga
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={stack ? 'w-full' : undefined}
          onClick={() => irPara('/login')}
        >
          Entrar
        </Button>
        <Button size="sm" className={stack ? 'w-full' : undefined} onClick={() => irPara('/registro')}>
          Criar Conta
        </Button>
      </>
    )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 lg:gap-10 min-w-0">
          <Link to="/" className="flex items-center gap-2 text-lg shrink-0">
            <LogoIcon className="h-9 w-9 shrink-0" />
            <Wordmark className="text-lg" />
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

        <div className="hidden md:flex items-center gap-2 shrink-0">{authButtons()}</div>

        {/* Menu mobile: nav + ações viram gaveta abaixo de md */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden h-9 w-9 shrink-0 rounded-md hover:bg-muted flex items-center justify-center text-foreground"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 sm:px-6 py-4 space-y-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-daia-blue-light text-daia-blue-mid'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-border">{authButtons(true)}</div>
        </div>
      )}
    </header>
  )
}
