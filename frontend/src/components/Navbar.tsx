import { useState } from 'react'
import { HeartIcon, LockIcon, MenuIcon, PvmLogo, XIcon } from './icons'

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

export default function Navbar({
  activeTab,
  onTabChange,
  onDonar,
  sesionActiva = false,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const tabs = sesionActiva
    ? [...TABS_PUBLICOS, { id: 'secretaria' as const, label: 'Secretaría' }]
    : TABS_PUBLICOS

  const irA = (tab: Tab) => {
    onTabChange(tab)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo oficial PVM + nombre */}
        <button
          type="button"
          onClick={() => irA('inicio')}
          className="group flex items-center gap-3 rounded-xl text-left"
          aria-label="Ir al inicio"
        >
          <PvmLogo
            size="md"
            className="transition-transform duration-200 group-hover:scale-105"
          />
          <span className="leading-tight">
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              Iglesia de Dios
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-base font-black tracking-tight text-zinc-950">PVM</span>
              <span className="hidden text-xs font-medium text-zinc-500 sm:inline">
                Por una vida mejor
              </span>
            </span>
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
          className="animate-fade-in space-y-1 border-t border-zinc-200 bg-white px-4 pb-4 pt-3 sm:hidden"
        >
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => irA(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-zinc-950 font-semibold text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
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
