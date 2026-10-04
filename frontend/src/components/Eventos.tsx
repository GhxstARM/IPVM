interface Evento {
  id: number
  titulo: string
  descripcion: string
  hora: string
  lugar: string
  etiqueta: string
  color: string
}

const eventos: Evento[] = [
  {
    id: 1,
    titulo: 'Liturgia Dominical',
    descripcion:
      'Celebración eucarística central de la semana. Todos los feligreses son bienvenidos. Se realizará la colecta dominical para las obras sociales de la parroquia.',
    hora: '10:00 h',
    lugar: 'Templo principal — Av. Los Libertadores 842',
    etiqueta: 'Liturgia',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 2,
    titulo: 'Catequesis Infantil',
    descripcion:
      'Encuentro formativo para niños y niñas de 6 a 12 años. Se trabajará sobre los valores del respeto y la solidaridad mediante dinámicas grupales y reflexión bíblica.',
    hora: '11:30 h',
    lugar: 'Sala de catequesis — Primer piso',
    etiqueta: 'Formación',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: 3,
    titulo: 'Misa Vespertina Familiar',
    descripcion:
      'Segunda celebración del día, orientada a familias. Incluye canto litúrgico y reflexión breve. Al finalizar se realizará compartido comunitario en el patio parroquial.',
    hora: '19:00 h',
    lugar: 'Templo principal — Av. Los Libertadores 842',
    etiqueta: 'Liturgia',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
]

export default function Eventos() {
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
          📅 Próximas Celebraciones
        </h2>
        <p className="text-stone-500 capitalize">{fechaDomingo}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {eventos.map((ev) => (
          <article
            key={ev.id}
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
          >
            {/* Top accent */}
            <div className="h-1.5 bg-amber-700 w-full" />

            <div className="p-5 flex flex-col gap-3 flex-1">
              {/* Etiqueta */}
              <span
                className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ev.color}`}
              >
                {ev.etiqueta}
              </span>

              {/* Título */}
              <h3 className="text-base font-bold text-stone-800 leading-snug">
                {ev.titulo}
              </h3>

              {/* Descripción */}
              <p className="text-sm text-stone-500 leading-relaxed flex-1">
                {ev.descripcion}
              </p>

              {/* Meta */}
              <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs text-stone-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🕐</span>
                  <span className="font-semibold text-stone-700">{ev.hora}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📍</span>
                  <span>{ev.lugar}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Nota informativa */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-500">
        💡 <strong className="text-stone-700">¿Deseas publicar una actividad?</strong>{' '}
        Comunícate con la secretaría parroquial para que sea incluida en la agenda comunitaria.
      </div>
    </div>
  )
}
