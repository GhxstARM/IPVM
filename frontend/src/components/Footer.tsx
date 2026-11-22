import { CalendarIcon, InstagramIcon, LockIcon, MapPinIcon, PvmLogo } from './icons'

interface FooterProps {
  onAdminClick: () => void
}

const tituloColumna = 'mb-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400'
const filaContacto = 'flex items-start gap-2'

export default function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-12 text-sm sm:grid-cols-3 sm:px-6">
        {/* Columna 1: identidad con logo oficial PVM */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <PvmLogo size="md" invertRing />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                Iglesia de Dios
              </p>
              <p className="text-base font-black tracking-tight text-white">
                PVM · Por una Vida Mejor
              </p>
            </div>
          </div>
          <p className="leading-relaxed text-zinc-400">
            Somos un Ministerio Familiar comprometido con la fe, la solidaridad y el servicio al
            prójimo.
          </p>
          <p className="text-sm font-semibold italic text-zinc-200">
            “Amamos a Dios y a su creación”
          </p>
        </div>

        {/* Columna 2: contacto */}
        <div>
          <h2 className={tituloColumna}>Contacto</h2>
          <ul className="space-y-2.5 text-zinc-300">
            <li className={filaContacto}>
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              Laguna Salada 1651, Peñalolén
            </li>
            <li>
              <a
                href="https://instagram.com/ministerio.pvm"
                target="_blank"
                rel="noopener noreferrer"
                className={`${filaContacto} rounded-md transition-colors hover:text-white`}
              >
                <InstagramIcon className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                @ministerio.pvm
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 3: horarios */}
        <div>
          <h2 className={tituloColumna}>Horario de reuniones</h2>
          <ul className="space-y-2.5 text-zinc-300">
            <li className={filaContacto}>
              <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              Domingo — Reunión dominical 10:00 hrs
            </li>
          </ul>
          <p className="mt-4 text-zinc-400">
            Pastor Principal: <span className="font-semibold text-white">Héctor Chanampe</span>
          </p>
        </div>
      </div>

      {/* Pie legal + acceso secretaría */}
      <div className="border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-6">
          <p className="text-center text-xs text-zinc-500 sm:text-left">
            © {new Date().getFullYear()} Iglesia de Dios PVM — Por una Vida Mejor · Sistema de
            gestión comunitaria
          </p>

          <button
            type="button"
            onClick={onAdminClick}
            className="btn btn-outline-invert btn-sm"
          >
            <LockIcon className="h-4 w-4" />
            Acceso Secretaría
          </button>
        </div>
      </div>
    </footer>
  )
}
