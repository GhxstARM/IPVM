import type { ComponentType, SVGProps } from 'react'
import {
  AcademicCapIcon,
  BoltIcon,
  BookIcon,
  BriefcaseIcon,
  FaceSmileIcon,
  FolderIcon,
  HeartIcon,
  HomeIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from '../components/icons'
import type { Gasto, Ingreso } from '../types/finanzas'

export type IconoComponente = ComponentType<SVGProps<SVGSVGElement>>

/** Períodos: 'todos' (todo el tiempo), 'YYYY' (año) o 'YYYY-MM' (mes). */
export const PERIODO_TODOS = 'todos'

// Ícono según la categoría que viene de la hoja (si no hay coincidencia: etiqueta genérica)
const ICONOS: readonly (readonly [string, IconoComponente])[] = [
  ['acción social', UsersIcon],
  ['servicios básicos', BoltIcon],
  ['aseo', SparklesIcon],
  ['material litúrgico', BookIcon],
  ['gastos administrativos', FolderIcon],
  ['alimentación', ShoppingBagIcon],
  ['transporte', TruckIcon],
  ['salud', HeartIcon],
  ['hogar', HomeIcon],
  ['entretenimiento', FaceSmileIcon],
  ['educación', AcademicCapIcon],
  ['trabajo', BriefcaseIcon],
]

export const iconoCategoria = (categoria: string): IconoComponente =>
  ICONOS.find(([clave]) => categoria.toLowerCase().startsWith(clave))?.[1] ?? TagIcon

/** "2026-09" -> "Septiembre 2026" */
export function nombreMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const texto = new Date(y ?? 0, (m ?? 1) - 1, 1)
    .toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    .replace(' de ', ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function nombrePeriodo(periodo: string): string {
  if (!periodo) return 'sin datos'
  if (periodo === PERIODO_TODOS) return 'Todo el tiempo'
  if (/^\d{4}$/.test(periodo)) return `Año ${periodo}`
  return nombreMes(periodo)
}

export const aniosDisponibles = (meses: string[]): string[] =>
  Array.from(new Set(meses.map((m) => m.slice(0, 4))))
    .sort()
    .reverse()

export const mesesDisponibles = (gastos: Gasto[], ingresos: Ingreso[]): string[] =>
  Array.from(
    new Set(
      [...gastos, ...ingresos]
        .map((x) => (x.fecha ?? '').slice(0, 7))
        .filter((m) => /^\d{4}-\d{2}$/.test(m)),
    ),
  )
    .sort()
    .reverse()
