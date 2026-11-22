import { useEffect, useRef, useState } from 'react'
import { getMensajeInicio, guardarMensajeInicio } from '../services/inicioService'
import { extraerMensaje } from '../utils/errors'
import { CheckCircleIcon, ExclamationIcon, InfoIcon } from './icons'
import Spinner from './Spinner'

// ── Tipos locales ─────────────────────────────────────────────────────────────
type Notificacion = { tipo: 'exito' | 'error'; mensaje: string }

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
    if (!mensaje.trim()) {
      mostrarNotif('error', 'El mensaje pastoral no puede quedar vacío.')
      return
    }
    if (!hayCambios) return

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
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="section-title text-xl">Mensaje Pastoral</h3>
        <p className="muted mt-1">
          Edita las palabras del Pastor Principal (Héctor Chanampe) que se publican en la página de
          inicio.
        </p>
      </div>

      {/* Notificación */}
      {notif && (
        <div
          role={notif.tipo === 'exito' ? 'status' : 'alert'}
          aria-live="polite"
          className={`alert animate-fade-in ${notif.tipo === 'exito' ? 'alert-success' : 'alert-error'}`}
        >
          {notif.tipo === 'exito' ? (
            <CheckCircleIcon className="h-5 w-5 shrink-0" />
          ) : (
            <ExclamationIcon className="h-5 w-5 shrink-0" />
          )}
          <span>{notif.mensaje}</span>
        </div>
      )}

      <form onSubmit={handleGuardar} className="space-y-5" noValidate>
        {/* Vista previa con formato pastoral */}
        <div className="panel space-y-3 p-5 sm:p-6">
          <p className="eyebrow">Vista previa — Pastor Héctor Chanampe</p>
          {cargando ? (
            <div className="space-y-2 py-1" aria-busy="true">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
            </div>
          ) : (
            <blockquote className="min-h-[3rem] border-l-2 border-zinc-950 pl-4 text-sm leading-relaxed italic text-zinc-700 whitespace-pre-wrap">
              “{mensaje || 'El mensaje pastoral aparecerá aquí...'}”
            </blockquote>
          )}
        </div>

        {/* Editor */}
        <div className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="msg-inicio">
              Texto del mensaje pastoral <span className="text-zinc-950">*</span>
            </label>
            {cargando ? (
              <div className="h-36 w-full animate-pulse rounded-xl bg-zinc-100" />
            ) : (
              <textarea
                id="msg-inicio"
                rows={5}
                placeholder="Escribe aquí las palabras del Pastor Principal..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                disabled={guardando}
                className="input resize-none leading-relaxed"
                required
                maxLength={1000}
              />
            )}
            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
              {hayCambios && !cargando ? (
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-900" role="status">
                  <InfoIcon className="h-3.5 w-3.5" />
                  Tienes cambios sin guardar
                </span>
              ) : (
                <span />
              )}
              <span className="tabular-nums text-zinc-500">{mensaje.length} / 1000 caracteres</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={guardando || !hayCambios || cargando}
              className="btn btn-primary btn-lg flex-1"
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
                className="btn btn-secondary btn-lg"
              >
                Descartar
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
