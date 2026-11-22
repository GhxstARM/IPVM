import { CalendarIcon, CrossIcon, InstagramIcon, LockIcon, MapPinIcon } from './icons'

interface FooterProps {
  onAdminClick: () => void
}

const tituloColumna = 'mb-3 text-xs font-semibold uppercase tracking-widest text-stone-700'
const filaContacto = 'flex items-start gap-2'

export default function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 text-sm text-stone-600 sm:grid-cols-3 sm:px-6">
        {/* Columna 1: identidad */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-700 text-white">
              <CrossIcon className="h-4 w-4" />
            </span>
            <span className="font-bold text-stone-900">Por una Vida Mejor</span>
          </div>
          <p className="leading-relaxed">
            Somos un Ministerio Familiar comprometido con la fe, la solidaridad y el servicio al prójimo.
          </p>
          <p className="font-display text-base italic text-amber-800">“Amamos a Dios y a su creación”</p>
        </div>

        {/* Columna 2: contacto */}
        <div>
          <h2 className={tituloColumna}>Contacto</h2>
          <ul className="space-y-2.5">
            <li className={filaContacto}>
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
              Laguna Salada 1651, Peñalolén
            </li>
            <li>
              <a
                href="https://instagram.com/ministerio.pvm"
                target="_blank"
                rel="noopener noreferrer"
                className={`${filaContacto} rounded-md transition-colors hover:text-pink-700`}
              >
                <InstagramIcon className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
                @ministerio.pvm
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 3: horarios */}
        <div>
          <h2 className={tituloColumna}>Horario de reuniones</h2>
          <ul className="space-y-2.5">
            <li className={filaContacto}>
              <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
              Domingo — Reunión dominical 10:00 hrs
            </li>
          </ul>
          <p className="mt-4 text-stone-500">
            Pastor Principal: <span className="font-semibold text-stone-700">Héctor Chanampe</span>
          </p>
        </div>
      </div>

      {/* Pie legal + acceso secretaría */}
      <div className="border-t border-stone-100">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-6">
          <p className="text-center text-xs text-stone-500 sm:text-left">
            © {new Date().getFullYear()} Ministerio Por una Vida Mejor — Sistema de gestión comunitaria
          </p>

          <button type="button" onClick={onAdminClick} className="btn btn-secondary btn-sm">
            <LockIcon className="h-4 w-4" />
            Acceso Secretaría
          </button>
        </div>
      </div>
    </footer>
  )
}
