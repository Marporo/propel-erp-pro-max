import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'

// Pages
import DashboardPage from './pages/DashboardPage'
import VentasPage from './pages/VentasPage'
import RRHHPage from './pages/RRHHPage'
import TesoreriaPage from './pages/TesoreriaPage'
import ChequesPage from './pages/ChequesPage'
import UsuariosPage from './pages/UsuariosPage'
import CambiarClavePage from './pages/CambiarClavePage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.debe_cambiar_clave) return <Navigate to="/cambiar-clave" replace />
  return children
}

function RequireChangePassword({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.debe_cambiar_clave) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/cambiar-clave" element={
          <RequireChangePassword>
            <CambiarClavePage />
          </RequireChangePassword>
        } />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="ventas" element={<VentasPage />} />
            <Route path="rrhh" element={<RRHHPage />} />
            <Route path="tesoreria" element={<TesoreriaPage />} />
            <Route path="cheques" element={<ChequesPage />} />
            <Route path="usuarios" element={
              <ProtectedRoute>
                <UsuariosPage />
              </ProtectedRoute>
            } />
            <Route path="caja-diaria" element={<Navigate to="/" replace />} />
          </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
