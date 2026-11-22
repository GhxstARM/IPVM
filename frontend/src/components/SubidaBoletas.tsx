import { useState, type ComponentType, type SVGProps } from 'react'
import AdminEventos from './AdminEventos'
import AdminFinanzas from './AdminFinanzas'
import AdminInicio from './AdminInicio'
import CargaBoletas from './CargaBoletas'
import { BanknotesIcon, CalendarIcon, DocumentIcon, LockIcon, PencilIcon } from './icons'

interface SubidaBoletasProps {
  onLogout: () => void
  token: string
}

type ModuloSecretaria = 'boletas' | 'eventos' | 'inicio' | 'finanzas'

interface ModuloConfig {
  id: ModuloSecretaria
  label: string
  Icono: ComponentType<SVGProps<SVGSVGElement>>
}

const MODULOS: readonly ModuloConfig[] = [
  { id: 'boletas', label: 'Boletas', Icono: DocumentIcon },
  { id: 'eventos', label: 'Eventos', Icono: CalendarIcon },
  { id: 'inicio', label: 'Mensaje Pastoral', Icono: PencilIcon },
  { id: 'finanzas', label: 'Gastos e ingresos', Icono: BanknotesIcon },
]

/** Panel de Secretaría: contenedor con la navegación entre módulos de administración. */
export default function SubidaBoletas({ onLogout, token }: SubidaBoletasProps) {
  const [moduloActivo, setModuloActivo] = useState<ModuloSecretaria>('boletas')

  return (
    <div className="page animate-fade-in space-y-6">
      {/* Barra superior: título + cerrar sesión */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow flex items-center gap-1.5">
            <LockIcon className="h-3.5 w-3.5" />
            Sesión autenticada
          </p>
          <h2 className="page-title">Panel de Secretaría</h2>
          <p className="muted">
            Gestiona boletas, eventos, mensaje pastoral y movimientos financieros.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="btn btn-secondary hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Navegación de módulos (tabs) */}
      <div
        role="tablist"
        aria-label="Módulos de secretaría"
        className="segmented grid grid-cols-2 sm:grid-cols-4"
      >
        {MODULOS.map(({ id, label, Icono }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={moduloActivo === id}
            aria-controls={`panel-${id}`}
            onClick={() => setModuloActivo(id)}
            className="segmented-item flex items-center justify-center gap-2 truncate py-2.5 text-xs sm:text-sm"
          >
            <Icono className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Siempre montado (solo oculto) para conservar la boleta en curso al cambiar de pestaña */}
      <div
        id="panel-boletas"
        role="tabpanel"
        aria-labelledby="tab-boletas"
        hidden={moduloActivo !== 'boletas'}
      >
        <CargaBoletas token={token} />
      </div>

      {moduloActivo === 'eventos' && (
        <div id="panel-eventos" role="tabpanel" aria-labelledby="tab-eventos">
          <AdminEventos />
        </div>
      )}

      {moduloActivo === 'inicio' && (
        <div id="panel-inicio" role="tabpanel" aria-labelledby="tab-inicio">
          <AdminInicio />
        </div>
      )}

      {moduloActivo === 'finanzas' && (
        <div id="panel-finanzas" role="tabpanel" aria-labelledby="tab-finanzas">
          <AdminFinanzas token={token} />
        </div>
      )}
    </div>
  )
}
