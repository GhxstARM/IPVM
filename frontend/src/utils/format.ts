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
