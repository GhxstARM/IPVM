import { useEffect, useState } from 'react'
import { type Evento, getEventos } from '../services/eventosService'

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          Próximas Celebraciones
        </h2>
        <p className="text-stone-500 capitalize">{fechaDomingo}</p>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-stone-200 rounded-2xl h-64 animate-pulse"
            />
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-12 bg-white border border-stone-200 rounded-2xl p-6">
          <p className="text-stone-500 text-sm">No hay celebraciones programadas por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {eventos.map((ev) => (
            <article
              key={ev.id}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="h-1.5 bg-amber-700 w-full" />

              <div className="p-5 flex flex-col gap-3 flex-1">
                {ev.etiqueta && (
                  <span
                    className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      ev.color || 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {ev.etiqueta}
                  </span>
                )}

                <h3 className="text-base font-bold text-stone-800 leading-snug">
                  {ev.titulo}
                </h3>

                {ev.descripcion && (
                  <p className="text-sm text-stone-500 leading-relaxed flex-1">
                    {ev.descripcion}
                  </p>
                )}

                <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-stone-700">{ev.hora} hrs</span>
                  </div>
                  {ev.lugar && (
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span>{ev.lugar}</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-500">
        <strong className="text-stone-700">¿Deseas publicar una actividad?</strong>{' '}
        Comunícate con la secretaría parroquial para que sea incluida en la agenda comunitaria.
      </div>
    </div>
  )
}
