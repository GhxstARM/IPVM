type Tab = 'inicio' | 'eventos' | 'transparencia' | 'secretaria'

interface NavbarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'transparencia', label: 'Transparencia' },
]

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-white text-lg font-bold shadow">
            ✝
          </div>
          <div className="leading-tight">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">
              Parroquia
            </p>
            <h1 className="text-stone-800 font-bold text-base sm:text-lg leading-none">
              Por una Vida Mejor
            </h1>
          </div>
        </div>

        {/* Navegación pública */}
        <nav className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white text-amber-700 shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export type { Tab }
