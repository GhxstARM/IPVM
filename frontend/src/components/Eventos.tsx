import { useEffect, useState } from 'react'
import { type Evento, getEventos } from '../services/eventosService'
import { CalendarIcon, ClockIcon, InfoIcon, MapPinIcon } from './icons'

function formatearFechaEvento(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    getEventos()
      .then((data) => {
        if (activo) setEventos(data)
      })
      .catch(() => {
        // En caso de error se mantendrán los que haya
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const fechaDomingo = (() => {
    const hoy = new Date()
    const diff = (7 - hoy.getDay()) % 7 || 7
    const domingo = new Date(hoy)
    domingo.setDate(hoy.getDate() + diff)
    return domingo.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })()

  return (
    <div className="page animate-fade-in space-y-8">
      <div className="space-y-2">
        <p className="eyebrow">Agenda Comunitaria · PVM</p>
        <h2 className="page-title">Próximas Celebraciones</h2>
        <p className="flex items-center gap-2 text-sm capitalize text-zinc-500">
          <CalendarIcon className="h-4 w-4 text-zinc-900" />
          Próximo domingo: {fechaDomingo}
        </p>
      </div>

      {cargando ? (
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Cargando celebraciones"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-1.5 w-full bg-zinc-200" />
              <div className="space-y-4 p-6">
                <div className="h-5 w-24 rounded-full bg-zinc-100" />
                <div className="h-5 w-3/4 rounded-lg bg-zinc-200" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-zinc-100" />
                  <div className="h-3.5 w-5/6 rounded bg-zinc-100" />
                </div>
                <div className="space-y-2 border-t border-zinc-100 pt-4">
                  <div className="h-3.5 w-2/3 rounded bg-zinc-200" />
                  <div className="h-3.5 w-1/3 rounded bg-zinc-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <CalendarIcon className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">Sin celebraciones programadas</h3>
            <p className="text-sm text-zinc-500">
              No hay actividades registradas por el momento. Te esperamos cada domingo a las 10:00
              hrs.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((ev) => (
            <article key={ev.id} className="card card-hover flex flex-col overflow-hidden">
              <div className="h-1.5 w-full bg-zinc-950" />

              <div className="flex flex-1 flex-col gap-3 p-6">
                {ev.etiqueta && (
                  <span className="badge self-start border-zinc-300 bg-zinc-100 text-zinc-900">
                    {ev.etiqueta}
                  </span>
                )}

                <h3 className="text-lg font-extrabold leading-snug text-zinc-950">{ev.titulo}</h3>

                {ev.descripcion && (
                  <p className="flex-1 text-sm leading-relaxed text-zinc-600">{ev.descripcion}</p>
                )}

                <div className="mt-auto space-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-600">
                  {ev.fecha && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-900" />
                      <time dateTime={ev.fecha} className="font-semibold capitalize text-zinc-900">
                        {formatearFechaEvento(ev.fecha)}
                      </time>
                    </div>
                  )}
                  {ev.hora && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="font-semibold text-zinc-900">{ev.hora} hrs</span>
                    </div>
                  )}
                  {ev.lugar && (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span>{ev.lugar}</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="panel flex items-start gap-3 px-5 py-4 text-sm text-zinc-600">
        <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-950" />
        <p>
          <strong className="font-semibold text-zinc-900">
            ¿Deseas publicar una actividad?
          </strong>{' '}
          Comunícate con la secretaría parroquial para que sea incluida en la agenda comunitaria.
        </p>
      </div>
    </div>
  )
}
