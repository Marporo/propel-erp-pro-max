import { Menu } from 'lucide-react'

export default function Header({ onMenuClick, title, showMenuButton }) {
  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
            id="header-menu-toggle"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-lg font-semibold text-surface-800">{title}</h1>
      </div>
    </header>
  )
}
