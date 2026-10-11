interface FooterProps {
  onAdminClick: () => void
}

export default function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="bg-white border-t border-stone-200">
      {/* Bloque principal del pie */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-stone-500">
        {/* Columna 1: identidad */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 text-lg">✝</span>
            <span className="font-semibold text-stone-700">Por una Vida Mejor</span>
          </div>
          <p className="text-xs leading-relaxed">
            Somos un Ministerio Familiar comprometido con la fe, la solidaridad y el servicio al prójimo.
          </p>
          <p className="text-xs italic text-amber-700 font-medium">"Amamos a Dios y a su creación 🌟💫"</p>
        </div>

        {/* Columna 2: contacto */}
        <div className="space-y-1.5">
          <p className="font-semibold text-stone-700 text-xs uppercase tracking-widest mb-2">Contacto</p>
          <p>📍 Laguna Salada 1651, Peñalolén</p>
          <a
            href="https://instagram.com/ministerio.pvm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-pink-600 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @ministerio.pvm
          </a>
        </div>

        {/* Columna 3: horarios */}
        <div className="space-y-1.5">
          <p className="font-semibold text-stone-700 text-xs uppercase tracking-widest mb-2">Horario de Reuniones</p>
          <p>🗓️ Domingo — Reunión dominical 10:00 hrs</p>
          <p className="text-xs mt-2 text-stone-400">
            Pastor Principal: <span className="font-semibold text-stone-500">Héctor Chanampe</span>
          </p>
        </div>
      </div>

      {/* Separador y pie legal */}
      <div className="border-t border-stone-100 px-4 sm:px-6 py-4 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} Ministerio Por una Vida Mejor — Sistema de gestión comunitaria
        </p>

        {/* Enlace administrativo discreto */}
        <button
          onClick={onAdminClick}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 group-hover:text-amber-600 transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>¿Eres parte de la administración? Ingresa aquí</span>
        </button>
      </div>
    </footer>
  )
}
