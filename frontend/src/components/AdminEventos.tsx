import { useEffect, useState } from 'react'
import {
  type Evento,
  type ServiceError,
  crearEvento,
  eliminarEvento,
  getEventos,
} from '../services/eventosService'

// ── Tipos locales ─────────────────────────────────────────────────────────────
type Notificacion = { tipo: 'exito' | 'error'; mensaje: string }

interface FormEvento {
  titulo: string
  fecha: string
  hora: string
  descripcion: string
}

const FORM_VACIO: FormEvento = { titulo: '', fecha: '', hora: '', descripcion: '' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function esServiceError(err: unknown): err is ServiceError {
  return typeof err === 'object' && err !== null && 'message' in err
}

function extraerMensaje(err: unknown, fallback: string): string {
  return esServiceError(err) ? err.message : fallback
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function AdminEventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [notif, setNotif] = useState<Notificacion | null>(null)
  const [form, setForm] = useState<FormEvento>(FORM_VACIO)

  // ── Notificación temporal ────────────────────────────────────────────────
  const mostrarNotif = (tipo: Notificacion['tipo'], mensaje: string) => {
    setNotif({ tipo, mensaje })
    setTimeout(() => setNotif(null), 4000)
  }

  // ── Carga inicial ────────────────────────────────────────────────────────
  const cargarEventos = async () => {
    setCargando(true)
    try {
      const data = await getEventos()
      setEventos(data)
    } catch (err) {
      mostrarNotif('error', extraerMensaje(err, 'Error al cargar los eventos.'))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarEventos()
  }, [])

  // ── Crear evento ─────────────────────────────────────────────────────────
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo || !form.fecha || !form.hora) return

    setGuardando(true)
    try {
      const nuevo = await crearEvento(form)
      setEventos((prev) => [nuevo, ...prev])
      setForm(FORM_VACIO)
      mostrarNotif('exito', 'Evento publicado correctamente.')
    } catch (err) {
      mostrarNotif('error', extraerMensaje(err, 'No se pudo publicar el evento.'))
    } finally {
      setGuardando(false)
    }
  }

  // ── Eliminar evento ──────────────────────────────────────────────────────
  const handleEliminar = async (id: string) => {
    setEliminandoId(id)
    try {
      await eliminarEvento(id)
      setEventos((prev) => prev.filter((ev) => ev.id !== id))
      mostrarNotif('exito', 'Evento eliminado correctamente.')
    } catch (err) {
      mostrarNotif('error', extraerMensaje(err, 'No se pudo eliminar el evento.'))
    } finally {
      setEliminandoId(null)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-stone-800">Administrador de Eventos</h3>
        <p className="text-sm text-stone-500 mt-1">
          Publica y gestiona las actividades de la iglesia.
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

      {/* Formulario de creación */}
      <form
        onSubmit={handleCrear}
        className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4"
        noValidate
      >
        <p className="text-sm font-semibold text-stone-700">Nuevo evento</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-600" htmlFor="ev-titulo">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="ev-titulo"
            type="text"
            placeholder="Ej: Reunión dominical"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            required
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600" htmlFor="ev-fecha">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              id="ev-fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600" htmlFor="ev-hora">
              Hora <span className="text-red-500">*</span>
            </label>
            <input
              id="ev-hora"
              type="time"
              value={form.hora}
              onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-600" htmlFor="ev-desc">
            Descripción
          </label>
          <textarea
            id="ev-desc"
            rows={3}
            placeholder="Descripción breve del evento..."
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none"
            maxLength={500}
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-3 rounded-xl font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow text-sm"
        >
          {guardando ? (
            <>
              <Spinner />
              Publicando...
            </>
          ) : (
            'Publicar evento'
          )}
        </button>
      </form>

      {/* Lista de eventos */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-stone-700">
          Eventos publicados
          {cargando && (
            <span className="text-xs font-normal text-stone-400 ml-2">cargando...</span>
          )}
        </p>

        {cargando && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-stone-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        )}

        {!cargando && eventos.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-10">
            No hay eventos publicados aún.
          </p>
        )}

        {!cargando && (
          <div className="grid grid-cols-1 gap-3">
            {eventos.map((ev) => (
              <div
                key={ev.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col sm:flex-row sm:items-stretch"
              >
                <div className="h-1.5 sm:h-auto sm:w-1.5 bg-amber-700 shrink-0" />

                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h4 className="font-bold text-stone-800 text-sm leading-snug">{ev.titulo}</h4>
                    <div className="flex items-center gap-3 text-xs text-stone-400 shrink-0">
                      <time dateTime={ev.fecha}>{ev.fecha}</time>
                      <time>{ev.hora}</time>
                    </div>
                  </div>
                  {ev.descripcion && (
                    <p className="text-xs text-stone-500 leading-relaxed">{ev.descripcion}</p>
                  )}
                </div>

                <div className="px-4 pb-4 sm:px-3 sm:py-4 flex items-center shrink-0">
                  <button
                    onClick={() => handleEliminar(ev.id)}
                    disabled={eliminandoId === ev.id}
                    aria-label={`Eliminar evento ${ev.titulo}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    {eliminandoId === ev.id ? (
                      <>
                        <Spinner className="h-3 w-3" />
                        Eliminando...
                      </>
                    ) : (
                      'Eliminar'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-componente reutilizable ───────────────────────────────────────────────
function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
