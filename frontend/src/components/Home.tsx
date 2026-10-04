export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

      {/* Hero bienvenida */}
      <section className="text-center space-y-4">
        <span className="inline-block text-4xl">✝</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 leading-tight">
          Bienvenidos a nuestra comunidad
        </h2>
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
          En la Parroquia <strong className="text-stone-700">Por una Vida Mejor</strong> nos reunimos cada domingo para crecer juntos en fe, caridad y servicio al prójimo.
        </p>
        <button className="mt-2 px-6 py-2.5 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 transition-colors shadow">
          Conoce nuestra comunidad
        </button>
      </section>

      {/* Mensaje del párroco */}
      <section className="bg-amber-50 border border-amber-100 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
        <div className="shrink-0 w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-white text-2xl shadow">
          👤
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Mensaje del Párroco
          </p>
          <h3 className="text-xl font-bold text-stone-800">Pbro. Marcelo Herrera</h3>
          <p className="text-stone-600 leading-relaxed">
            "Les doy la bienvenida a todos quienes buscan un lugar de paz, crecimiento y comunidad. Esta parroquia es un hogar abierto para toda persona que desea encontrar sentido y propósito en la fe. Juntos construimos una comunidad más justa, solidaria y esperanzadora. Los esperamos con los brazos abiertos cada domingo."
          </p>
        </div>
      </section>

      {/* Llamado a participar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: '🙏',
            title: 'Únete a la oración',
            desc: 'Cada miércoles a las 19:00 h celebramos una hora de oración comunitaria en el salón parroquial.',
          },
          {
            icon: '📖',
            title: 'Estudio bíblico',
            desc: 'Viernes a las 18:30 h. Grupos pequeños para reflexionar la Palabra con profundidad y fraternidad.',
          },
          {
            icon: '🤝',
            title: 'Acción social',
            desc: 'Apoyamos familias en situación de vulnerabilidad. Puedes sumarte al equipo de asistencia comunitaria y olla común.',
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow space-y-2"
          >
            <div className="text-3xl">{icon}</div>
            <h4 className="font-semibold text-stone-800">{title}</h4>
            <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Horarios */}
      <section className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-stone-800">📅 Horario semanal</h3>
        <ul className="divide-y divide-stone-200 text-sm text-stone-600">
          {[
            ['Domingo', 'Liturgia dominical', '10:00 h'],
            ['Domingo', 'Misa vespertina familiar', '19:00 h'],
            ['Miércoles', 'Oración comunitaria', '19:00 h'],
            ['Viernes', 'Estudio bíblico', '18:30 h'],
          ].map(([dia, actividad, hora]) => (
            <li key={`${dia}-${actividad}`} className="flex justify-between py-2.5">
              <span>
                <strong className="text-stone-700">{dia}</strong> — {actividad}
              </span>
              <span className="font-mono text-amber-700 font-semibold">{hora}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
