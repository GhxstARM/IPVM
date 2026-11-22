import { useEffect, useState } from 'react'
import { getMensajeInicio } from '../services/inicioService'
import {
  BookIcon,
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  InstagramIcon,
  MapPinIcon,
  PvmLogo,
  UsersIcon,
} from './icons'

interface HomeProps {
  onDonar: () => void
}

const PILARES = [
  {
    title: 'Únete a la oración',
    desc: 'Cada domingo a las 10:00 hrs celebramos una reunión comunitaria en Laguna Salada 1651, Peñalolén.',
    Icono: HeartIcon,
  },
  {
    title: 'Estudio bíblico',
    desc: 'Grupos pequeños para reflexionar la Palabra con profundidad y fraternidad durante la semana.',
    Icono: BookIcon,
  },
  {
    title: 'Acción social',
    desc: 'Apoyamos familias en situación de vulnerabilidad. Puedes sumarte al equipo de olla común y asistencia comunitaria.',
    Icono: UsersIcon,
  },
] as const

const HORARIOS = [['Domingo', 'Reunión dominical', '10:00 hrs']] as const

export default function Home({ onDonar }: HomeProps) {
  const [mensajePastoral, setMensajePastoral] = useState<string>('')
  const [cargandoPastoral, setCargandoPastoral] = useState<boolean>(true)

  useEffect(() => {
    let activo = true
    getMensajeInicio()
      .then((data) => {
        if (activo) setMensajePastoral(data.mensaje)
      })
      .catch(() => {
        // En caso de error, el fallback mostrará el mensaje predeterminado
      })
      .finally(() => {
        if (activo) setCargandoPastoral(false)
      })

    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="page animate-fade-in space-y-12">
      {/* Hero bienvenida inspirado en el emblema monocromo de Iglesia de Dios PVM */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 px-6 py-14 text-center text-white shadow-overlay sm:px-10 sm:py-18">
        {/* Trazos circulares concéntricos decorativos inspirados en el logo PVM */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 600"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 opacity-15 sm:h-[680px] sm:w-[680px]"
          fill="none"
        >
          <circle cx="300" cy="300" r="260" stroke="white" strokeWidth="1.5" strokeDasharray="220 90 140 70" />
          <circle cx="300" cy="300" r="225" stroke="white" strokeWidth="2.5" strokeDasharray="180 120 260 80" />
          <circle cx="300" cy="300" r="190" stroke="white" strokeWidth="1.5" strokeDasharray="120 80 200 110" />
        </svg>

        <div className="relative mx-auto max-w-2xl space-y-6">
          <div className="flex justify-center">
            <PvmLogo size="xl" invertRing />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
              Iglesia de Dios · PVM
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              Amamos a Dios y a su creación
            </h2>
          </div>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Somos un <strong className="font-semibold text-white">Ministerio Familiar</strong>{' '}
            ubicado en{' '}
            <strong className="font-semibold text-white">Laguna Salada 1651, Peñalolén</strong>. Nos
            reunimos cada domingo a las{' '}
            <strong className="rounded-md bg-white/15 px-2 py-0.5 font-bold text-white">
              10:00 hrs
            </strong>{' '}
            para crecer juntos en fe, caridad y servicio.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onDonar}
              className="btn btn-invert btn-lg w-full sm:w-auto"
            >
              <HeartIcon className="h-4 w-4" />
              Donar / Aporte Comunitario
            </button>
            <a
              href="https://instagram.com/ministerio.pvm"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-invert btn-lg w-full sm:w-auto"
            >
              <InstagramIcon className="h-4 w-4" />
              @ministerio.pvm
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Llamado a oración */}
      <section className="card relative overflow-hidden p-6 text-center sm:p-8">
        <div className="mx-auto max-w-lg space-y-3">
          <p className="eyebrow">Comunidad y Fe</p>
          <h3 className="text-2xl font-black tracking-tight text-zinc-950">¿Necesitas oración?</h3>
          <p className="text-sm leading-relaxed text-zinc-600">
            Contáctanos, queremos ayudarte. Escríbenos por Instagram o visítanos cualquier domingo a
            las 10:00 hrs en{' '}
            <span className="font-semibold text-zinc-950">Laguna Salada 1651, Peñalolén</span>.
          </p>
          <div className="pt-1">
            <a
              href="https://instagram.com/ministerio.pvm"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <InstagramIcon className="h-4 w-4" />
              Escríbenos en Instagram
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Mensaje del Pastor Principal (Dinámico) */}
      <section
        aria-busy={cargandoPastoral}
        className="card flex flex-col items-start gap-6 p-6 sm:flex-row sm:p-8"
      >
        <PvmLogo size="lg" />
        <div className="flex-1 space-y-2.5">
          <p className="eyebrow">Mensaje del Pastor Principal</p>
          <h3 className="text-2xl font-black tracking-tight text-zinc-950">
            Pastor Héctor Chanampe
          </h3>

          {cargandoPastoral ? (
            <div className="space-y-2.5 py-1" aria-label="Cargando mensaje pastoral">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
            </div>
          ) : (
            <blockquote className="border-l-2 border-zinc-950 pl-4 text-base leading-relaxed italic text-zinc-700 whitespace-pre-wrap">
              “
              {mensajePastoral ||
                'Les doy la bienvenida a todos quienes buscan un lugar de paz, crecimiento y comunidad.'}
              ”
            </blockquote>
          )}
        </div>
      </section>

      {/* Llamado a participar */}
      <section aria-label="Áreas de participación" className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {PILARES.map(({ title, desc, Icono }) => (
          <div key={title} className="card card-hover flex flex-col gap-3 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm">
              <Icono className="h-5 w-5" />
            </span>
            <h4 className="text-base font-extrabold text-zinc-950">{title}</h4>
            <p className="text-sm leading-relaxed text-zinc-600">{desc}</p>
          </div>
        ))}
      </section>

      {/* Horarios */}
      <section className="card space-y-4 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <h3 className="section-title">Horario de reuniones</h3>
        </div>

        <ul className="divide-y divide-zinc-100 text-sm text-zinc-600">
          {HORARIOS.map(([dia, actividad, hora]) => (
            <li
              key={`${dia}-${actividad}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3.5"
            >
              <span>
                <strong className="font-semibold text-zinc-900">{dia}</strong> — {actividad}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1 font-mono text-xs font-semibold text-white">
                <ClockIcon className="h-3.5 w-3.5" />
                {hora}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-800">
          <MapPinIcon className="h-4 w-4 shrink-0 text-zinc-950" />
          <span>
            <strong className="font-semibold text-zinc-950">Laguna Salada 1651</strong>, Peñalolén —
            Todos los domingos
          </span>
        </div>
      </section>
    </div>
  )
}
