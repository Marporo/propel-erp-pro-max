import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  FileCheck,
  Pin,
  PinOff,
  X,
  LogOut,
  ChevronRight,
  Settings,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navigation = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: LayoutDashboard,
    groups: [
      { 
        label: 'General', 
        links: [{ to: '/', label: 'Dashboard' }] 
      }
    ]
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: FileText,
    groups: [
      {
        label: 'Operaciones',
        links: [{ to: '/ventas', label: 'Gestión de Ventas' }]
      }
    ]
  },
  {
    id: 'tesoreria',
    label: 'Tesorería',
    icon: Wallet,
    groups: [
      {
        label: 'Caja y Bancos',
        links: [
          { to: '/tesoreria', label: 'Movimientos de Caja' },
          { to: '/cheques', label: 'Gestión de Cheques' }
        ]
      }
    ]
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    icon: Users,
    groups: [
      {
        label: 'Personal',
        links: [{ to: '/rrhh', label: 'Empleados y Legajos' }]
      }
    ]
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: Settings,
    isAdmin: true,
    groups: [
      {
        label: 'Seguridad y Configuración',
        links: [
          { to: '/usuarios', label: 'Gestión de Usuarios' }
        ]
      }
    ]
  }
]

export default function Sidebar({ pinned, onTogglePin, onClose, isMobileOverlay }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [expandedModule, setExpandedModule] = useState(null)

  // Auto-expandir el módulo según la ruta actual
  useEffect(() => {
    const currentModule = navigation.find(mod => 
      mod.groups.some(group => 
        group.links.some(link => 
          link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to)
        )
      )
    )
    if (currentModule) {
      setExpandedModule(currentModule.id)
    }
  }, [location.pathname])

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId)
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full bg-white border-r border-surface-200 z-50 flex flex-col w-[260px] shadow-sm select-none"
    >
      {/* Logo + actions */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-surface-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-primary-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-surface-800 text-[15px] whitespace-nowrap tracking-tight uppercase">
            Propel ERP
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-0.5 py-0.5 rounded-none border border-surface-200 bg-surface-50">
          {!isMobileOverlay && (
            <button
              onClick={onTogglePin}
              className={`p-1 text-surface-500 hover:text-primary-600 transition-colors ${pinned ? 'bg-white shadow-sm ring-1 ring-surface-200/50' : 'hover:bg-white'}`}
              id="sidebar-pin-toggle"
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
            title="Cerrar menú"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin">
        {navigation.map((module) => {
          if (module.isAdmin && user?.rol !== 'admin') return null

          const isExpanded = expandedModule === module.id

          return (
            <div key={module.id} className="flex flex-col">
              {/* Módulo Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-all w-full text-left ${
                  isExpanded 
                    ? 'text-primary-700 bg-surface-50' 
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`}
              >
                <module.icon size={20} strokeWidth={1.5} className="shrink-0" />
                <span className="flex-1 whitespace-nowrap">{module.label}</span>
                <ChevronRight 
                  size={16} 
                  strokeWidth={1.5}
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-primary-600' : 'text-surface-400'}`} 
                />
              </button>

              {/* Acordeón de Grupos y Links */}
              <div 
                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden bg-white">
                  {module.groups.map((group, gIdx) => (
                    <div key={gIdx} className="mb-2">
                      <div className="px-11 py-2 text-[10px] font-bold text-surface-400 uppercase tracking-[0.05em] mt-2">
                        {group.label}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {group.links.map((link) => (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/'}
                            onClick={isMobileOverlay ? onClose : undefined}
                            className={({ isActive }) =>
                              `relative flex items-center h-10 pl-11 pr-3 py-2 text-sm transition-all group ${
                                isActive
                                  ? 'text-primary-600 font-semibold bg-primary-50/20'
                                  : 'text-surface-500 font-medium hover:text-surface-800 hover:bg-surface-50'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && (
                                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary-600" />
                                )}
                                <span className="truncate">{link.label}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footerhint and User */}
      <div className="px-4 py-4 border-t border-surface-200 bg-surface-50/30">
        {user && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-surface-800 truncate">{user.nombre_completo || user.username}</span>
              <div className="flex items-center gap-1">
                <ShieldCheck size={10} className="text-primary-600" />
                <span className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">{user.rol}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-surface-400 hover:bg-danger-50 hover:text-danger-600 rounded-lg transition-colors flex-shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
        {!isMobileOverlay && (
          <p className="text-[10px] text-surface-400 text-center font-medium uppercase tracking-tighter">
            {pinned ? 'Panel Anclado' : 'Panel Flotante'}
          </p>
        )}
      </div>
    </aside>
  )
}
