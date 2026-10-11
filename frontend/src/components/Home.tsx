interface HomeProps {
  onDonar: () => void
}

export default function Home({ onDonar }: HomeProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

      {/* Hero bienvenida */}
      <section className="text-center space-y-4">
        <span className="inline-block text-4xl">✝</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 leading-tight">
          Amamos a Dios y a su creación 🌟💫
        </h2>
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
          Somos un <strong className="text-stone-700">Ministerio Familiar</strong> ubicado en{' '}
          <strong className="text-stone-700">Laguna Salada 1651, Peñalolén</strong>. Nos reunimos cada domingo a las{' '}
          <strong className="text-amber-700">10:00 hrs</strong> para crecer juntos en fe, caridad y servicio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onDonar}
            className="px-6 py-2.5 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors shadow flex items-center gap-2"
          >
            💛 Donar / Aporte Comunitario
          </button>
          <a
            href="https://instagram.com/ministeriopvm"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 border border-stone-300 text-stone-600 rounded-xl font-semibold hover:bg-stone-100 transition-colors flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @ministeriopvm
          </a>
        </div>
      </section>

      {/* Llamado a oración */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
        <p className="text-2xl">🙏</p>
        <h3 className="text-lg font-bold text-amber-800">¿Necesitas oración?</h3>
        <p className="text-amber-700 text-sm max-w-lg mx-auto">
          Contáctanos, queremos ayudarte. Escríbenos por Instagram o visítanos cualquier domingo a las 10:00 hrs en{' '}
          <span className="font-semibold">Laguna Salada 1651, Peñalolén</span>.
        </p>
        <a
          href="https://instagram.com/ministeriopvm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-2 bg-amber-700 text-white text-sm font-semibold rounded-xl hover:bg-amber-800 transition-colors"
        >
          Escríbenos en Instagram
        </a>
      </section>

      {/* Mensaje del Pastor */}
      <section className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
        <div className="shrink-0 w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-white text-2xl shadow">
          👤
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Mensaje del Pastor Principal
          </p>
          <h3 className="text-xl font-bold text-stone-800">Pastor Héctor Chanampe</h3>
          <p className="text-stone-600 leading-relaxed">
            "Les doy la bienvenida a todos quienes buscan un lugar de paz, crecimiento y comunidad. Somos un ministerio familiar que ama a Dios y a su creación. Esta comunidad es un hogar abierto para toda persona que desea encontrar sentido y propósito en la fe. Juntos construimos una comunidad más justa, solidaria y esperanzadora. Los esperamos cada domingo a las 10:00 hrs."
          </p>
        </div>
      </section>

      {/* Llamado a participar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: '🙏',
            title: 'Únete a la oración',
            desc: 'Cada domingo a las 10:00 hrs celebramos una reunión comunitaria en Laguna Salada 1651, Peñalolén.',
          },
          {
            icon: '📖',
            title: 'Estudio bíblico',
            desc: 'Grupos pequeños para reflexionar la Palabra con profundidad y fraternidad durante la semana.',
          },
          {
            icon: '🤝',
            title: 'Acción social',
            desc: 'Apoyamos familias en situación de vulnerabilidad. Puedes sumarte al equipo de olla común y asistencia comunitaria.',
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
        <h3 className="text-lg font-bold text-stone-800">📅 Horario de reuniones</h3>
        <ul className="divide-y divide-stone-200 text-sm text-stone-600">
          {[
            ['Domingo', 'Reunión dominical', '10:00 hrs'],
          ].map(([dia, actividad, hora]) => (
            <li key={`${dia}-${actividad}`} className="flex justify-between py-3">
              <span>
                <strong className="text-stone-700">{dia}</strong> — {actividad}
              </span>
              <span className="font-mono text-amber-700 font-semibold">{hora}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800">
          <span>📍</span>
          <span><strong>Laguna Salada 1651</strong>, Peñalolén — Todos los domingos</span>
        </div>
      </section>
    </div>
  )
}
