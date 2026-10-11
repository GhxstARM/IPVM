import { useState } from 'react'

type Tab = 'inicio' | 'eventos' | 'transparencia' | 'secretaria'

interface NavbarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onDonar: () => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'transparencia', label: 'Transparencia' },
]

export default function Navbar({ activeTab, onTabChange, onDonar }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-700 flex items-center justify-center text-white text-base font-bold shadow shrink-0">
            ✝
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest hidden sm:block">
              Ministerio
            </p>
            <h1 className="text-stone-800 font-bold text-sm sm:text-base leading-none">
              Por una Vida Mejor
            </h1>
          </div>
        </div>

        {/* Nav + Donar — desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <nav className="flex gap-1 bg-stone-100 p-1 rounded-xl">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-white text-amber-700 shadow-sm font-semibold'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            onClick={onDonar}
            className="ml-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl transition-colors shadow flex items-center gap-1.5"
          >
            💛 Donar
          </button>
        </div>

        {/* Hamburger — móvil */}
        <button
          className="sm:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menú"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {menuOpen && (
        <div className="sm:hidden border-t border-stone-100 bg-white px-4 pb-4 pt-3 space-y-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { onTabChange(id); setMenuOpen(false) }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { onDonar(); setMenuOpen(false) }}
            className="w-full mt-2 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            💛 Donar / Aporte Comunitario
          </button>
        </div>
      )}
    </header>
  )
}

export type { Tab }
