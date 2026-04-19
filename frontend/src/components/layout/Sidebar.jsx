import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  FileCheck,
  Pin,
  PinOff,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ventas', label: 'Ventas', icon: FileText },
  { to: '/rrhh', label: 'RRHH', icon: Users },
  { to: '/tesoreria', label: 'Tesorería', icon: Wallet },
  { to: '/cheques', label: 'Cheques', icon: FileCheck },
]

/**
 * Sidebar con 2 modos en desktop:
 *  - pinned: fijo a la izquierda, el contenido se corre
 *  - hidden: oculto, se abre con la hamburguesa
 * En mobile: siempre overlay
 *
 * Props:
 *  - pinned: boolean (desktop)
 *  - onTogglePin: () => void
 *  - onClose: () => void (cierra el overlay en mobile o hide en desktop)
 *  - isMobileOverlay: boolean
 */
export default function Sidebar({ pinned, onTogglePin, onClose, isMobileOverlay }) {
  return (
    <aside
      className="fixed top-0 left-0 h-full bg-white border-r border-surface-200 z-50 flex flex-col w-[260px] shadow-sm"
    >
      {/* Logo + actions */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-surface-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-primary-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-surface-800 text-[15px] whitespace-nowrap tracking-tight">
            Propel ERP
          </span>
        </div>

        {/* Desktop: pin/unpin — Mobile: close */}
        <div className="flex items-center gap-1.5 px-0.5 py-0.5 rounded-none border border-surface-200 bg-surface-50">
          {!isMobileOverlay && (
            <button
              onClick={onTogglePin}
              className={`p-1 text-surface-500 hover:text-primary-600 transition-colors ${pinned ? 'bg-white shadow-sm ring-1 ring-surface-200/50' : 'hover:bg-white'}`}
              id="sidebar-pin-toggle"
              aria-label={pinned ? 'Desfijar sidebar' : 'Fijar sidebar'}
              title={pinned ? 'Desfijar menú' : 'Fijar menú'}
            >
              {pinned ? <PinOff size={15} /> : <Pin size={15} />}
            </button>
          )}

          {!isMobileOverlay && <div className="w-px h-3.5 bg-surface-300 mx-0.5" />}

          <button
            onClick={onClose}
            className="p-1 text-surface-500 hover:text-danger-600 hover:bg-white transition-colors"
            id="sidebar-close"
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={isMobileOverlay ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            <span className="whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer hint */}
      {!isMobileOverlay && (
        <div className="px-4 py-3 border-t border-surface-200">
          <p className="text-[11px] text-surface-400 text-center">
            {pinned ? 'Menú fijado' : 'Menú no fijado'}
          </p>
        </div>
      )}
    </aside>
  )
}
