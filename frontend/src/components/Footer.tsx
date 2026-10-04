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
            Comunidad parroquial comprometida con la fe, la solidaridad y el servicio al prójimo en nuestra región.
          </p>
        </div>

        {/* Columna 2: contacto */}
        <div className="space-y-1.5">
          <p className="font-semibold text-stone-700 text-xs uppercase tracking-widest mb-2">Contacto</p>
          <p>📍 Av. Los Libertadores 842, Santiago</p>
          <p>📞 +56 2 2345 6789</p>
          <p>✉️ contacto@porvidamejor.cl</p>
        </div>

        {/* Columna 3: horarios */}
        <div className="space-y-1.5">
          <p className="font-semibold text-stone-700 text-xs uppercase tracking-widest mb-2">Horario de Misas</p>
          <p>Domingo — 10:00 y 19:00 h</p>
          <p>Miércoles — Oración 19:00 h</p>
          <p>Viernes — Estudio bíblico 18:30 h</p>
        </div>
      </div>

      {/* Separador y pie legal */}
      <div className="border-t border-stone-100 px-4 sm:px-6 py-4 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} Parroquia Por una Vida Mejor — Sistema de gestión comunitaria
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
