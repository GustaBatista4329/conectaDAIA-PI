import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import JobSearch from '@/pages/JobSearch'
import CandidateDashboard from '@/pages/CandidateDashboard'
import CandidateProfile from '@/pages/CandidateProfile'
import RecruiterDashboard from '@/pages/RecruiterDashboard'
import RecruiterKanban from '@/pages/RecruiterKanban'
import AdminPanel from '@/pages/AdminPanel'
import Placeholder from '@/pages/Placeholder'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Público */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/vagas" element={<JobSearch />} />
        <Route
          path="/setores"
          element={
            <Placeholder
              title="Setores do DAIA"
              description="Mapa completo de setores industriais do distrito."
              publicLayout
            />
          }
        />
        <Route
          path="/empresas"
          element={
            <Placeholder
              title="Empresas Instaladas"
              description="Diretório completo das empresas do distrito industrial."
              publicLayout
            />
          }
        />

        {/* Candidato */}
        <Route element={<ProtectedRoute allow={['candidato']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/candidato/painel" element={<CandidateDashboard />} />
            <Route path="/candidato/perfil" element={<CandidateProfile />} />
            <Route
              path="/candidato/mensagens"
              element={<Placeholder title="Mensagens" description="Central de mensagens com recrutadores." />}
            />
            <Route
              path="/candidato/configuracoes"
              element={<Placeholder title="Configurações" description="Preferências da sua conta." />}
            />
          </Route>
        </Route>

        {/* Recrutador */}
        <Route element={<ProtectedRoute allow={['recrutador']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/recrutador/painel" element={<RecruiterDashboard />} />
            <Route path="/recrutador/vagas/:vagaId/candidatos" element={<RecruiterKanban />} />
            <Route
              path="/recrutador/candidatos"
              element={<RecruiterKanban />}
            />
            <Route
              path="/recrutador/vagas"
              element={<Placeholder title="Gestão de Vagas" description="Criação e edição das vagas da empresa." />}
            />
            <Route
              path="/recrutador/empresas"
              element={<Placeholder title="Empresas Parceiras" description="Colaboração entre empresas do grupo." />}
            />
            <Route
              path="/recrutador/analytics"
              element={<Placeholder title="Analytics" description="Relatórios de performance de recrutamento." />}
            />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/painel" element={<AdminPanel />} />
            <Route
              path="/admin/empresas"
              element={<Placeholder title="Empresas (Admin)" description="Gestão completa de empresas do polo." />}
            />
            <Route
              path="/admin/candidatos"
              element={<Placeholder title="Candidatos (Admin)" description="Auditoria de perfis e certificações." />}
            />
            <Route
              path="/admin/vagas"
              element={<Placeholder title="Vagas (Admin)" description="Moderação global de vagas." />}
            />
            <Route
              path="/admin/analytics"
              element={<Placeholder title="Analytics" description="Métricas estratégicas do DAIA." />}
            />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}
