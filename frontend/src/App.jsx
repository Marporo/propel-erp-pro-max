import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import VentasPage from './pages/VentasPage'
import RRHHPage from './pages/RRHHPage'
import TesoreriaPage from './pages/TesoreriaPage'
import ChequesPage from './pages/ChequesPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/rrhh" element={<RRHHPage />} />
        <Route path="/tesoreria" element={<TesoreriaPage />} />
        <Route path="/cheques" element={<ChequesPage />} />
      </Route>
    </Routes>
  )
}

export default App
