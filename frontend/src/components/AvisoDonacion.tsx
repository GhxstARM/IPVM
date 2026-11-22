import type { ResultadoDonacion } from '../types/donacion'
import { CheckCircleIcon, ExclamationIcon, InfoIcon, XIcon } from './icons'

interface AvisoDonacionProps {
  resultado: ResultadoDonacion
  onClose: () => void
}

function estiloPorEstado(estado: ResultadoDonacion['estado']) {
  if (estado === 'aprobada') {
    return {
      fondo: 'bg-emerald-700 text-white',
      Icono: CheckCircleIcon,
    }
  }
  if (estado === 'anulada') {
    return {
      fondo: 'bg-amber-600 text-white',
      Icono: InfoIcon,
    }
  }
  return {
    fondo: 'bg-rose-700 text-white',
    Icono: ExclamationIcon,
  }
}

/** Aviso mostrado al volver de Webpay con el resultado del pago. */
export default function AvisoDonacion({ resultado, onClose }: AvisoDonacionProps) {
  const { fondo, Icono } = estiloPorEstado(resultado.estado)

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-fade-in px-4 py-3 text-sm font-medium ${fondo}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 sm:px-2">
        <div className="flex flex-1 items-center justify-center gap-2 text-center">
          <Icono className="h-5 w-5 shrink-0" />
          <p>
            {resultado.estado === 'aprobada' && (
              <>
                ¡Gracias por tu donación! Aporte de{' '}
                <strong className="tabular-nums">
                  ${Number(resultado.monto || 0).toLocaleString('es-CL')}
                </strong>{' '}
                aprobado{resultado.orden ? ` (Orden: ${resultado.orden})` : ''}.
              </>
            )}
            {resultado.estado === 'anulada' && 'La donación en Webpay fue anulada.'}
            {resultado.estado === 'rechazada' && 'El pago fue rechazado por el banco o la tarjeta.'}
            {resultado.estado === 'error' && 'Ocurrió un problema al verificar el pago con Webpay.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          aria-label="Cerrar aviso"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
