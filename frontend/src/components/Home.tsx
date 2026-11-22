import { useEffect, useState } from 'react'
import { getMensajeInicio } from '../services/inicioService'
import {
  BookIcon,
  CalendarIcon,
  ClockIcon,
  CrossIcon,
  HeartIcon,
  InstagramIcon,
  MapPinIcon,
  UserIcon,
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
      {/* Hero bienvenida */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-b from-amber-50/90 via-white to-white px-6 py-12 text-center shadow-card sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-md">
            <CrossIcon className="h-7 w-7" />
          </div>

          <p className="eyebrow">Ministerio Familiar · Peñalolén</p>

          <h2 className="page-title">Amamos a Dios y a su creación</h2>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Somos un <strong className="font-semibold text-stone-800">Ministerio Familiar</strong>{' '}
            ubicado en{' '}
            <strong className="font-semibold text-stone-800">Laguna Salada 1651, Peñalolén</strong>.
            Nos reunimos cada domingo a las{' '}
            <strong className="font-semibold text-amber-800">10:00 hrs</strong> para crecer juntos
            en fe, caridad y servicio.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onDonar} className="btn btn-primary btn-lg w-full sm:w-auto">
              <HeartIcon className="h-4 w-4" />
              Donar / Aporte Comunitario
            </button>
            <a
              href="https://instagram.com/ministerio.pvm"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg w-full sm:w-auto"
            >
              <InstagramIcon className="h-4 w-4 text-pink-600" />
              @ministerio.pvm
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Llamado a oración */}
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-6 text-center shadow-card sm:p-8">
        <div className="mx-auto max-w-lg space-y-3">
          <h3 className="font-display text-2xl font-bold text-amber-900">¿Necesitas oración?</h3>
          <p className="text-sm leading-relaxed text-amber-900/85">
            Contáctanos, queremos ayudarte. Escríbenos por Instagram o visítanos cualquier domingo a
            las 10:00 hrs en{' '}
            <span className="font-semibold text-amber-950">Laguna Salada 1651, Peñalolén</span>.
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
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-sm">
          <UserIcon className="h-8 w-8" />
        </div>
        <div className="flex-1 space-y-2.5">
          <p className="eyebrow">Mensaje del Pastor Principal</p>
          <h3 className="font-display text-2xl font-bold text-stone-900">Pastor Héctor Chanampe</h3>

          {cargandoPastoral ? (
            <div className="space-y-2.5 py-1" aria-label="Cargando mensaje pastoral">
              <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
            </div>
          ) : (
            <blockquote className="border-l-2 border-amber-300 pl-4 text-base leading-relaxed italic text-stone-600 whitespace-pre-wrap">
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Icono className="h-5 w-5" />
            </span>
            <h4 className="text-base font-bold text-stone-900">{title}</h4>
            <p className="text-sm leading-relaxed text-stone-600">{desc}</p>
          </div>
        ))}
      </section>

      {/* Horarios */}
      <section className="card space-y-4 p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-amber-700">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <h3 className="section-title">Horario de reuniones</h3>
        </div>

        <ul className="divide-y divide-stone-100 text-sm text-stone-600">
          {HORARIOS.map(([dia, actividad, hora]) => (
            <li
              key={`${dia}-${actividad}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3.5"
            >
              <span>
                <strong className="font-semibold text-stone-800">{dia}</strong> — {actividad}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-mono text-xs font-semibold text-amber-800">
                <ClockIcon className="h-3.5 w-3.5" />
                {hora}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <MapPinIcon className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <strong className="font-semibold">Laguna Salada 1651</strong>, Peñalolén — Todos los
            domingos
          </span>
        </div>
      </section>
    </div>
  )
}
