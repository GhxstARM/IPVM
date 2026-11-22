import { useState } from 'react'
import { CrossIcon, HeartIcon, LockIcon, MenuIcon, XIcon } from './icons'

type Tab = 'inicio' | 'eventos' | 'transparencia' | 'secretaria'

interface NavbarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onDonar: () => void
  /** Hay una sesión de Secretaría abierta: muestra el acceso directo al panel. */
  sesionActiva?: boolean
}

const TABS_PUBLICOS: { id: Tab; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'transparencia', label: 'Transparencia' },
]

export default function Navbar({ activeTab, onTabChange, onDonar, sesionActiva = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const tabs = sesionActiva ? [...TABS_PUBLICOS, { id: 'secretaria' as const, label: 'Secretaría' }] : TABS_PUBLICOS

  const irA = (tab: Tab) => {
    onTabChange(tab)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo + nombre */}
        <button
          type="button"
          onClick={() => irA('inicio')}
          className="group flex items-center gap-3 rounded-xl text-left"
          aria-label="Ir al inicio"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-white shadow-sm transition duration-200 group-hover:bg-amber-800 group-hover:shadow-md">
            <CrossIcon />
          </span>
          <span className="leading-tight">
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-stone-500 sm:block">
              Ministerio
            </span>
            <span className="block text-sm font-bold text-stone-900 sm:text-base">Por una Vida Mejor</span>
          </span>
        </button>

        {/* Navegación + Donar — escritorio */}
        <div className="hidden items-center gap-3 sm:flex">
          <nav aria-label="Principal" className="segmented">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => irA(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className="segmented-item flex items-center gap-1.5 px-4 py-1.5"
              >
                {id === 'secretaria' && <LockIcon className="h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={onDonar} className="btn btn-primary">
            <HeartIcon className="h-4 w-4" />
            Donar
          </button>
        </div>

        {/* Hamburguesa — móvil */}
        <button
          type="button"
          className="btn btn-ghost -mr-2 p-2 sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
        >
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {menuOpen && (
        <nav
          id="menu-movil"
          aria-label="Principal"
          className="animate-fade-in space-y-1 border-t border-stone-100 bg-white px-4 pb-4 pt-3 sm:hidden"
        >
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => irA(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-amber-50 font-semibold text-amber-800'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              {id === 'secretaria' && <LockIcon className="h-4 w-4" />}
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onDonar()
              setMenuOpen(false)
            }}
            className="btn btn-primary mt-2 w-full py-3"
          >
            <HeartIcon className="h-4 w-4" />
            Donar / Aporte Comunitario
          </button>
        </nav>
      )}
    </header>
  )
}

export type { Tab }
