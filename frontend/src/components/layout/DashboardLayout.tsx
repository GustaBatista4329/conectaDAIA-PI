import { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Settings,
  Users,
  Building2,
  BarChart3,
  LifeBuoy,
  LogOut,
  PlusCircle,
  Bell,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
}

const navByRole: Record<string, { title: string; items: NavItem[]; ctaLabel?: string; ctaTo?: string }> = {
  candidato: {
    title: 'Portal Industrial',
    items: [
      { to: '/candidato/painel', label: 'Painel', icon: LayoutDashboard },
      { to: '/candidato/perfil', label: 'Meu Perfil', icon: UserIcon },
      { to: '/vagas', label: 'Buscar Vagas', icon: Briefcase },
      { to: '/candidato/mensagens', label: 'Mensagens', icon: MessageSquare },
      { to: '/candidato/configuracoes', label: 'Configurações', icon: Settings },
    ],
    ctaLabel: 'Candidatura Rápida',
    ctaTo: '/vagas',
  },
  recrutador: {
    title: 'Gestão DAIA',
    items: [
      { to: '/recrutador/painel', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/recrutador/candidatos', label: 'Candidatos', icon: Users },
      { to: '/recrutador/vagas', label: 'Vagas', icon: Briefcase },
      { to: '/recrutador/empresas', label: 'Empresas', icon: Building2 },
      { to: '/recrutador/analytics', label: 'Analytics', icon: BarChart3 },
    ],
    ctaLabel: 'Postar Nova Vaga',
    ctaTo: '/recrutador/vagas',
  },
  admin: {
    title: 'Painel Admin',
    items: [
      { to: '/admin/painel', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/empresas', label: 'Empresas', icon: Building2 },
      { to: '/admin/candidatos', label: 'Candidatos', icon: Users },
      { to: '/admin/vagas', label: 'Vagas', icon: Briefcase },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
}

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  if (!user) return null
  const config = navByRole[user.role]

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 font-bold text-daia-blue">
            <div className="h-9 w-9 rounded-md gradient-daia flex items-center justify-center text-white text-sm">
              CD
            </div>
            <div className="flex flex-col">
              <span className="text-sm">{config.title}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {user.role === 'candidato' ? 'DAIA Sector 3' : 'Portal do Recrutador'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {config.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-daia-blue-light text-daia-blue-mid'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {config.ctaLabel && (
          <div className="px-3 py-3">
            <Button className="w-full" onClick={() => config.ctaTo && nav(config.ctaTo)}>
              <PlusCircle className="h-4 w-4" />
              {config.ctaLabel}
            </Button>
          </div>
        )}

        <div className="px-3 py-3 border-t border-border space-y-1">
          <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted w-full">
            <LifeBuoy className="h-4 w-4" />
            Suporte
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar no painel..."
              className="w-full bg-muted/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-daia-green" />
            </button>
            <button
              className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Configurações"
            >
              <Settings className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{user.nome}</div>
                <div className="text-xs text-daia-green font-medium uppercase">
                  {user.role === 'candidato'
                    ? 'Candidato'
                    : user.role === 'recrutador'
                      ? 'Recrutador'
                      : 'Administrador'}
                </div>
              </div>
              <Avatar className="h-9 w-9">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.nome} />}
                <AvatarFallback>{initials(user.nome)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}
