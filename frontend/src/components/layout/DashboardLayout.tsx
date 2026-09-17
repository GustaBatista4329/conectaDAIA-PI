import { ReactNode, useEffect, useRef, useState } from 'react'
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
  Menu,
  Search,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { LogoIcon } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
      { to: '/recrutador/perfil', label: 'Meu Perfil', icon: UserIcon },
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

const SIDEBAR_STORAGE_KEY = 'conectadaia.sidebarOpen'

// Painel de perfil de cada role — usado pro menu do header. Admin ainda não
// tem painel de perfil.
const perfilPathPorRole: Partial<Record<string, string>> = {
  candidato: '/candidato/perfil',
  recrutador: '/recrutador/perfil',
}

const configPathPorRole: Record<string, string> = {
  candidato: '/candidato/configuracoes',
  recrutador: '/recrutador/configuracoes',
  admin: '/admin/configuracoes',
}

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  // Sinaliza que devemos abrir o Dialog de confirmação assim que o
  // DropdownMenu (Radix) terminar de fechar de verdade — ver
  // onCloseAutoFocus no DropdownMenuContent, abaixo.
  const openLogoutDialogAfterMenuCloseRef = useRef(false)
  // Só importa em telas md+ — abaixo disso a sidebar vira gaveta (drawer)
  // controlada por `mobileMenuOpen`, sempre fechada por padrão.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen))
    } catch {
      // ignora ambientes sem acesso a localStorage (ex: modo privado)
    }
  }, [sidebarOpen])

  // Fecha o diálogo de confirmação antes de efetivar o logout: se
  // chamássemos `logout` direto, o usuário vira null e este componente
  // inteiro desmonta (linha abaixo) no mesmo ciclo, arrancando o Dialog
  // (Radix) da árvore com `open` ainda true. Isso pula a limpeza normal do
  // scroll-lock/pointer-events que o Radix aplica no <body> enquanto o
  // modal está aberto, deixando a tela travada até dar refresh. Fechando o
  // diálogo primeiro e adiando o logout pro próximo tick, o Radix consegue
  // concluir a transição de fechamento antes da árvore ser desmontada.
  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    setTimeout(logout, 0)
  }

  if (!user) return null
  const config = navByRole[user.role]

  // `collapsed` só se aplica à sidebar de desktop no modo "rail" (ícones
  // sem rótulo); a gaveta mobile sempre chama isso sem collapsed (sempre
  // mostra os rótulos, já que lá o espaço não é um problema).
  const navLinks = (onNavigate?: () => void, collapsed = false) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {config.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
              isActive
                ? 'bg-daia-blue-light text-daia-blue-mid'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* Borda de acento à esquerda no item ativo — reforça o
                 destaque do fundo colorido, importante sobretudo no modo
                 recolhido (só ícone) onde o fundo sozinho chama menos
                 atenção. */}
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-daia-blue-mid"
                  aria-hidden="true"
                />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const sidebarFooter = (onNavigate?: () => void, collapsed = false) => (
    <>
      {config.ctaLabel && (
        <div className={cn('py-3', collapsed ? 'px-3 flex justify-center' : 'px-3')}>
          <Button
            size={collapsed ? 'icon' : 'default'}
            className={cn(!collapsed && 'w-full')}
            title={collapsed ? config.ctaLabel : undefined}
            aria-label={config.ctaLabel}
            onClick={() => {
              onNavigate?.()
              if (config.ctaTo) nav(config.ctaTo)
            }}
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{config.ctaLabel}</span>}
          </Button>
        </div>
      )}

      <div className="px-3 py-3 border-t border-border space-y-1">
        <button
          title={collapsed ? 'Suporte' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-md text-sm text-muted-foreground hover:bg-muted w-full',
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
          )}
        >
          <LifeBuoy className="h-4 w-4 shrink-0" />
          {!collapsed && 'Suporte'}
        </button>
        <button
          onClick={() => {
            onNavigate?.()
            setLogoutConfirmOpen(true)
          }}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-md text-sm text-destructive hover:bg-destructive/10 w-full',
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar de desktop: um único painel recolhível (ícones-só quando
         fechado, em vez de uma faixa fixa separada + painel largo — evita o
         efeito de "duas barras coladas"). Só em telas md+ — no
         celular/tablet estreito o acesso ao menu vira o botão de
         hambúrguer no topbar (gaveta abaixo). */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white border-r border-border sticky top-0 h-screen shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out',
          sidebarOpen ? 'md:w-64' : 'md:w-16',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2.5 h-16 shrink-0 border-b border-border',
            sidebarOpen ? 'px-4' : 'justify-center',
          )}
        >
          <LogoIcon className="h-8 w-8 shrink-0" />
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-daia-blue truncate leading-tight">{config.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {user.role === 'candidato' ? 'DAIA Sector 3' : 'Portal do Recrutador'}
              </div>
            </div>
          )}
        </div>

        {navLinks(undefined, !sidebarOpen)}
        {sidebarFooter(undefined, !sidebarOpen)}

        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 h-11 shrink-0 border-t border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
            sidebarOpen ? 'px-4' : 'justify-center',
          )}
          aria-label={sidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          aria-pressed={sidebarOpen}
          title={sidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4 shrink-0" />
          ) : (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          )}
          {sidebarOpen && <span className="text-xs font-medium">Recolher menu</span>}
        </button>
      </aside>

      {/* Gaveta mobile: overlay + painel deslizante, só existe abaixo de md */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-white flex flex-col shadow-lg">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-daia-blue truncate">{config.title}</span>
                <span className="text-xs text-muted-foreground font-normal truncate">
                  {user.role === 'candidato' ? 'DAIA Sector 3' : 'Portal do Recrutador'}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 shrink-0 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                aria-label="Fechar menu"
              >
                ×
              </button>
            </div>
            {navLinks(() => setMobileMenuOpen(false))}
            {sidebarFooter(() => setMobileMenuOpen(false))}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-border px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-9 w-9 shrink-0 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block flex-1 min-w-0 max-w-md">
              <input
                type="text"
                placeholder="Buscar no painel..."
                className="w-full bg-muted/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              className="sm:hidden h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              className="relative h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-daia-green" />
            </button>
            <button
              className="hidden sm:flex h-9 w-9 rounded-md hover:bg-muted items-center justify-center text-muted-foreground"
              aria-label="Configurações"
            >
              <Settings className="h-4 w-4" />
            </button>
            {(() => {
              const perfilPath = perfilPathPorRole[user.role]
              const configPath = configPathPorRole[user.role]
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 sm:gap-3 sm:pl-3 sm:border-l border-border rounded-md hover:bg-muted transition-colors py-1 pr-1 sm:pr-2 -my-1"
                      aria-label="Menu da conta"
                    >
                      <div className="text-right hidden lg:block min-w-0">
                        <div className="text-sm font-semibold truncate max-w-[10rem]">{user.nome}</div>
                        <div className="text-xs text-daia-green font-medium uppercase">
                          {user.role === 'candidato'
                            ? 'Candidato'
                            : user.role === 'recrutador'
                              ? 'Recrutador'
                              : 'Administrador'}
                        </div>
                      </div>
                      <Avatar className="h-9 w-9 shrink-0">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.nome} />}
                        <AvatarFallback>{initials(user.nome)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onCloseAutoFocus={(e) => {
                      // Dispara exatamente quando o DropdownMenu (Radix)
                      // termina de fechar de verdade — já desmontado, já com
                      // seu próprio scroll-lock/pointer-events limpos. Abrir o
                      // Dialog aqui (em vez de num setTimeout com prazo
                      // "chutado") evita ter dois "layers" do Radix
                      // sobrepostos, que travam o <body> com
                      // pointer-events:none pra sempre (confirmado via teste
                      // manual — um setTimeout(0) não bastava, a animação de
                      // saída do dropdown dura mais que isso).
                      if (openLogoutDialogAfterMenuCloseRef.current) {
                        openLogoutDialogAfterMenuCloseRef.current = false
                        e.preventDefault()
                        setLogoutConfirmOpen(true)
                      }
                    }}
                  >
                    {perfilPath && (
                      <DropdownMenuItem onClick={() => nav(perfilPath)}>
                        <UserIcon className="h-4 w-4" />
                        Meu Perfil
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => nav(configPath)}>
                      <Settings className="h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      destructive
                      onSelect={() => {
                        openLogoutDialogAfterMenuCloseRef.current = true
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da Conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })()}
          </div>
        </header>

        <div className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 md:p-8">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Confirmação de logout — acionada pelo menu do header ou pelo botão da sidebar */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair da conta?</DialogTitle>
            <DialogDescription>
              Você precisará entrar novamente com seu e-mail e senha para acessar o painel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
