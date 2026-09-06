import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allow?: UserRole[]
}

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (allow && !allow.includes(user.role)) {
    // redireciona para o dashboard apropriado do seu role
    const fallback =
      user.role === 'candidato'
        ? '/candidato/painel'
        : user.role === 'recrutador'
          ? '/recrutador/painel'
          : '/admin/painel'
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
