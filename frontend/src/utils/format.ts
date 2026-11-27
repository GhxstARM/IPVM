/** Utilidades de formato de montos y fechas (locale es-CL). */

/** Formato CLP: $1.450.000 */
export function formatCLP(n: number): string {
  const formatted = Math.abs(n).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return `${n < 0 ? '-' : ''}$${formatted}`
}

/** Deja solo los dígitos: "175.000" -> "175000" */
export const soloDigitos = (val: string): string => val.replace(/\D/g, '')

/**
 * Convierte un monto devuelto por el OCR/IA a pesos enteros (solo dígitos),
 * respetando el separador decimal:
 *   1400.0 -> "1400" | "1400.0" -> "1400" | "1.400" -> "1400" | "$1.450.000" -> "1450000"
 *   "1,400.50" -> "1401" | "1400,5" -> "1401"
 */
export function montoADigitos(val: unknown): string {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(Math.round(Math.abs(val))) : ''
  }
  let str = String(val ?? '').replace(/[^\d.,]/g, '')
  if (!/\d/.test(str)) return ''

  const ultimoPunto = str.lastIndexOf('.')
  const ultimaComa = str.lastIndexOf(',')

  if (ultimoPunto !== -1 && ultimaComa !== -1) {
    // Ambos separadores: el último es el decimal, el otro es de miles
    const decimal = ultimoPunto > ultimaComa ? '.' : ','
    const miles = decimal === '.' ? ',' : '.'
    str = str.split(miles).join('').replace(decimal, '.')
  } else if (ultimoPunto !== -1 || ultimaComa !== -1) {
    const sep = ultimoPunto !== -1 ? '.' : ','
    const partes = str.split(sep)
    const esMiles =
      partes.length > 2 || (partes.length === 2 && (partes[1] ?? '').length === 3)
    // Separador de miles ("1.400", "1.450.000") o decimal ("1400.0", "14,5")
    str = esMiles ? partes.join('') : partes.join('.')
  }

  const n = Number(str)
  return Number.isFinite(n) ? String(Math.round(n)) : soloDigitos(str)
}

/** Convierte "DD-MM-YYYY" (o con / o .) a "YYYY-MM-DD", el formato de `<input type="date">`. */
export function fechaAInput(val: unknown): string {
  const str = String(val ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(str)
  if (!m) return ''
  return `${m[3]}-${(m[2] ?? '').padStart(2, '0')}-${(m[1] ?? '').padStart(2, '0')}`
}

/** Convierte "YYYY-MM-DD" a "DD-MM-YYYY", el formato que espera el backend / Google Sheets. */
export function inputAFecha(val?: string): string {
  if (!val) return ''
  const [y, m, d] = val.split('-')
  return y && m && d ? `${d}-${m}-${y}` : val
}

/** "2026-09-29" -> "29 sept 2026" */
export function formatFecha(iso: string): string {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** ISO completo -> "DD-MM-YYYY HH:mm" ("—" si no es válido). */
export function formatFechaHora(iso?: string): string {
  if (!iso || !iso.trim()) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Fecha de hoy en formato "YYYY-MM-DD" (hora local). */
export function hoyInput(): string {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}
