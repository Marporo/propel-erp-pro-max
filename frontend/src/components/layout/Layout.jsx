import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const SIDEBAR_WIDTH = 240 // px, coincide con w-[240px] del Sidebar

const pageTitles = {
  '/': 'Dashboard',
  '/ventas': 'Ventas & Facturación',
  '/rrhh': 'Recursos Humanos',
  '/tesoreria': 'Tesorería — Caja Diaria',
  '/cheques': 'Gestión de Cheques',
}

/**
 * Hook para detectar si es pantalla desktop (≥1024px)
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

const SIDEBAR_WIDTH_CLASS = 'w-[260px]' // Emparejado con el Sidebar

export default function Layout() {
  const isDesktop = useIsDesktop()
  const [pinned, setPinned] = useState(true)
  const [desktopOverlay, setDesktopOverlay] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Propel ERP'

  const sidebarVisible = isDesktop ? (pinned || desktopOverlay) : mobileOpen
  const showMenuButton = isDesktop ? !pinned : true
  const isOverlay = isDesktop ? !pinned : true

  const handleMenuClick = () => {
    if (isDesktop) {
      setDesktopOverlay(!desktopOverlay)
    } else {
      setMobileOpen(!mobileOpen)
    }
  }

  const handleCloseSidebar = () => {
    if (isDesktop) {
      if (pinned) setPinned(false)
      setDesktopOverlay(false)
    } else {
      setMobileOpen(false)
    }
  }

  const handleTogglePin = () => {
    const newPinned = !pinned
    setPinned(newPinned)
    if (newPinned) setDesktopOverlay(false)
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* ═══ Overlay backdrop ═══ */}
      {sidebarVisible && isOverlay && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 transition-opacity"
          onClick={handleCloseSidebar}
        />
      )}

      {/* ═══ Sidebar ═══ */}
      {sidebarVisible && (
        <Sidebar
          pinned={pinned}
          onTogglePin={handleTogglePin}
          onClose={handleCloseSidebar}
          isMobileOverlay={!isDesktop}
        />
      )}

      {/* Spacer invisible para el Sidebar en Desktop Pinned */}
      {isDesktop && pinned && (
        <div className={`hidden lg:block shrink-0 transition-all duration-300 ${SIDEBAR_WIDTH_CLASS}`} />
      )}

      {/* ═══ Main content ═══ */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300">
        <Header
          onMenuClick={handleMenuClick}
          title={title}
          showMenuButton={showMenuButton}
        />
        {/* Padding expandido para evitar que roce con los bordes */}
        <main className="flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

