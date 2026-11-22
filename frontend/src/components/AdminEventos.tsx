import { useEffect, useRef, useState } from 'react'
import { type Evento, crearEvento, eliminarEvento, getEventos } from '../services/eventosService'
import { extraerMensaje } from '../utils/errors'
import { formatFecha } from '../utils/format'
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationIcon,
  PlusIcon,
  TrashIcon,
} from './icons'
import Spinner from './Spinner'

// ── Tipos locales ─────────────────────────────────────────────────────────────
type Notificacion = { tipo: 'exito' | 'error'; mensaje: string }

interface FormEvento {
  titulo: string
  fecha: string
  hora: string
  descripcion: string
}

const FORM_VACIO: FormEvento = { titulo: '', fecha: '', hora: '', descripcion: '' }

// ── Componente ────────────────────────────────────────────────────────────────
export default function AdminEventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [notif, setNotif] = useState<Notificacion | null>(null)
  const [form, setForm] = useState<FormEvento>(FORM_VACIO)
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Notificación temporal ────────────────────────────────────────────────
  const mostrarNotif = (tipo: Notificacion['tipo'], mensaje: string) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current)
    setNotif({ tipo, mensaje })
    notifTimerRef.current = setTimeout(() => setNotif(null), 4000)
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
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current)
    }
  }, [])

  // ── Crear evento ─────────────────────────────────────────────────────────
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.fecha || !form.hora) {
      mostrarNotif('error', 'Completa título, fecha y hora para publicar el evento.')
      return
    }

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
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="section-title text-xl">Administrador de Eventos</h3>
        <p className="muted mt-1">Publica y gestiona las actividades de la iglesia.</p>
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

      {/* Formulario de creación */}
      <form onSubmit={handleCrear} className="card space-y-4 p-6" noValidate>
        <h4 className="section-title text-base">Nuevo evento</h4>

        <div>
          <label className="label" htmlFor="ev-titulo">
            Título <span className="text-rose-600">*</span>
          </label>
          <input
            id="ev-titulo"
            type="text"
            placeholder="Ej: Reunión dominical"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className="input"
            required
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ev-fecha">
              Fecha <span className="text-rose-600">*</span>
            </label>
            <input
              id="ev-fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="ev-hora">
              Hora <span className="text-rose-600">*</span>
            </label>
            <input
              id="ev-hora"
              type="time"
              value={form.hora}
              onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="ev-desc">
            Descripción
          </label>
          <textarea
            id="ev-desc"
            rows={3}
            placeholder="Descripción breve del evento..."
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="input resize-none"
            maxLength={500}
          />
        </div>

        <button type="submit" disabled={guardando} className="btn btn-primary btn-lg w-full">
          {guardando ? (
            <>
              <Spinner />
              Publicando...
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Publicar evento
            </>
          )}
        </button>
      </form>

      {/* Lista de eventos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="section-title text-base">
            Eventos publicados {!cargando && <span className="text-stone-500">({eventos.length})</span>}
          </h4>
        </div>

        {cargando && (
          <div className="space-y-3" aria-busy="true" aria-label="Cargando eventos">
            {[1, 2].map((i) => (
              <div key={i} className="card flex animate-pulse items-center justify-between p-5">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-stone-200" />
                  <div className="h-3 w-32 rounded bg-stone-100" />
                </div>
                <div className="h-8 w-20 rounded-xl bg-stone-100" />
              </div>
            ))}
          </div>
        )}

        {!cargando && eventos.length === 0 && (
          <div className="card flex flex-col items-center gap-2.5 px-6 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-stone-600">No hay eventos publicados aún.</p>
          </div>
        )}

        {!cargando && eventos.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {eventos.map((ev) => (
              <div
                key={ev.id}
                className="card flex flex-col overflow-hidden sm:flex-row sm:items-stretch"
              >
                <div className="h-1.5 shrink-0 bg-amber-700 sm:h-auto sm:w-1.5" />

                <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h5 className="text-sm font-bold leading-snug text-stone-900">{ev.titulo}</h5>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-amber-700" />
                        <time dateTime={ev.fecha}>{formatFecha(ev.fecha)}</time>
                      </span>
                      {ev.hora && (
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          <time>{ev.hora} hrs</time>
                        </span>
                      )}
                    </div>
                  </div>
                  {ev.descripcion && (
                    <p className="text-xs leading-relaxed text-stone-600">{ev.descripcion}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center px-4 pb-4 sm:px-4 sm:py-4">
                  <button
                    type="button"
                    onClick={() => void handleEliminar(ev.id)}
                    disabled={eliminandoId === ev.id}
                    aria-label={`Eliminar evento ${ev.titulo}`}
                    className="btn btn-danger btn-sm w-full sm:w-auto"
                  >
                    {eliminandoId === ev.id ? (
                      <>
                        <Spinner className="h-3.5 w-3.5" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-3.5 w-3.5" />
                        Eliminar
                      </>
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
