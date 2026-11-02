import { useEffect, useRef, useState } from 'react'
import {
  type ServiceError,
  getMensajeInicio,
  guardarMensajeInicio,
} from '../services/inicioService'

// ── Tipos locales ─────────────────────────────────────────────────────────────
type Notificacion = { tipo: 'exito' | 'error'; mensaje: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
function esServiceError(err: unknown): err is ServiceError {
  return typeof err === 'object' && err !== null && 'message' in err
}

function extraerMensaje(err: unknown, fallback: string): string {
  return esServiceError(err) ? err.message : fallback
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function AdminInicio() {
  const [mensaje, setMensaje] = useState('')
  const [mensajeGuardado, setMensajeGuardado] = useState('')
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [notif, setNotif] = useState<Notificacion | null>(null)
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hayCambios = mensaje !== mensajeGuardado

  // ── Notificación temporal ────────────────────────────────────────────────
  const mostrarNotif = (tipo: Notificacion['tipo'], texto: string) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current)
    setNotif({ tipo, mensaje: texto })
    notifTimerRef.current = setTimeout(() => setNotif(null), 4000)
  }

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    let activo = true
    setCargando(true)

    getMensajeInicio()
      .then(({ mensaje: texto }) => {
        if (!activo) return
        setMensaje(texto)
        setMensajeGuardado(texto)
      })
      .catch((err: unknown) => {
        if (!activo) return
        mostrarNotif('error', extraerMensaje(err, 'No se pudo cargar el mensaje pastoral.'))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current)
    }
  }, [])

  // ── Guardar ──────────────────────────────────────────────────────────────
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensaje.trim() || !hayCambios) return

    setGuardando(true)
    try {
      await guardarMensajeInicio({ mensaje })
      setMensajeGuardado(mensaje)
      mostrarNotif('exito', 'Mensaje pastoral actualizado correctamente.')
    } catch (err) {
      mostrarNotif('error', extraerMensaje(err, 'No se pudo guardar el mensaje pastoral.'))
    } finally {
      setGuardando(false)
    }
  }

  const handleDescartar = () => {
    setMensaje(mensajeGuardado)
    setNotif(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-stone-800">Mensaje Pastoral</h3>
        <p className="text-sm text-stone-500 mt-1">
          Edita las palabras del Pastor Principal (Héctor Chanampe) que se publican en la página de inicio.
        </p>
      </div>

      {/* Notificación */}
      {notif && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl px-4 py-3 text-sm font-medium border ${
            notif.tipo === 'exito'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notif.mensaje}
        </div>
      )}

      <form onSubmit={handleGuardar} className="space-y-4" noValidate>
        {/* Vista previa con formato pastoral */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Vista previa — Pastor Héctor Chanampe
          </p>
          {cargando ? (
            <div className="h-16 bg-stone-200 animate-pulse rounded-lg" />
          ) : (
            <p className="text-stone-700 text-sm leading-relaxed italic whitespace-pre-wrap min-h-[3rem]">
              "{mensaje || 'El mensaje pastoral aparecerá aquí...'}"
            </p>
          )}
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700" htmlFor="msg-inicio">
            Texto del mensaje pastoral{' '}
            <span className="text-red-500">*</span>
          </label>
          {cargando ? (
            <div className="w-full h-32 bg-stone-100 animate-pulse rounded-lg" />
          ) : (
            <textarea
              id="msg-inicio"
              rows={5}
              placeholder="Escribe aquí las palabras del Pastor Principal..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              disabled={guardando}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none leading-relaxed disabled:opacity-60"
              required
              maxLength={1000}
            />
          )}
          <p className="text-xs text-stone-400 text-right">{mensaje.length} / 1000 caracteres</p>
        </div>

        {/* Indicador de cambios sin guardar */}
        {hayCambios && !cargando && (
          <p className="text-xs text-amber-700 font-medium" role="status">
            Tienes cambios sin guardar
          </p>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={guardando || !hayCambios || cargando}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow text-sm"
          >
            {guardando ? (
              <>
                <Spinner />
                Guardando...
              </>
            ) : (
              'Guardar mensaje pastoral'
            )}
          </button>

          {hayCambios && !cargando && (
            <button
              type="button"
              onClick={handleDescartar}
              disabled={guardando}
              className="px-5 py-3 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Descartar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// ── Sub-componente reutilizable ───────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
