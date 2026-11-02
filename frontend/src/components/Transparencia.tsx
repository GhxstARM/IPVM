import { useEffect, useMemo, useState } from 'react'

// En desarrollo: crea un .env con VITE_API_URL=http://TU_IP_LOCAL:3000 si pruebas desde el celular
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface Gasto {
  id: number | string
  gasto: string
  fecha: string // YYYY-MM-DD
  razon: string
  monto: number
}

interface Ingreso {
  fecha: string // YYYY-MM-DD
  descripcion: string
  monto: number
}

interface GastoCategoria {
  categoria: string
  icon: string
  monto: number
  porcentaje: number
}

interface Movimiento {
  fecha: string
  desc: string
  tipo: 'ingreso' | 'gasto'
  monto: number
}

/** Formato CLP: $1.450.000 */
function formatCLP(n: number) {
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return `${n < 0 ? '-' : ''}$${formatted}`
}

// Ícono según la categoría que viene de la hoja (si no hay coincidencia: 📌)
const ICONOS: [string, string][] = [
  ['acción social', '🤝'],
  ['servicios básicos', '💡'],
  ['aseo', '🧹'],
  ['material litúrgico', '📖'],
  ['gastos administrativos', '🗂️'],
  ['alimentación', '🍽️'],
  ['transporte', '🚌'],
  ['salud', '🩺'],
  ['hogar', '🏠'],
  ['entretenimiento', '🎭'],
  ['educación', '🎓'],
  ['trabajo', '💼'],
]

const iconoCategoria = (cat: string) =>
  ICONOS.find(([clave]) => cat.toLowerCase().startsWith(clave))?.[1] ?? '📌'

// "2026-09" -> "Septiembre 2026"
const nombreMes = (mes: string) => {
  const [y, m] = mes.split('-').map(Number)
  const texto = new Date(y ?? 0, (m ?? 1) - 1, 1)
    .toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    .replace(' de ', ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// "2026-09-29" -> "29 sept 2026"
const formatFecha = (iso: string) => {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Períodos: 'todos' (todo el tiempo), 'YYYY' (año) o 'YYYY-MM' (mes)
const PERIODO_TODOS = 'todos'

const nombrePeriodo = (periodo: string) => {
  if (!periodo) return 'sin datos'
  if (periodo === PERIODO_TODOS) return 'Todo el tiempo'
  if (/^\d{4}$/.test(periodo)) return `Año ${periodo}`
  return nombreMes(periodo)
}

const aniosDisponibles = (meses: string[]) =>
  Array.from(new Set(meses.map((m) => m.slice(0, 4)))).sort().reverse()

const mesesDisponibles = (gastos: Gasto[], ingresos: Ingreso[]) =>
  Array.from(
    new Set(
      [...gastos, ...ingresos]
        .map((x) => (x.fecha ?? '').slice(0, 7))
        .filter((m) => /^\d{4}-\d{2}$/.test(m))
    )
  )
    .sort()
    .reverse()

export default function Transparencia() {
  const [datos, setDatos] = useState<{ gastos: Gasto[]; ingresos: Ingreso[] } | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mes, setMes] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('periodo')
  const [dia, setDia] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [consultadoEn, setConsultadoEn] = useState<Date | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/transparencia`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Error desconocido')

      const gastos: Gasto[] = data.gastos ?? []
      const ingresos: Ingreso[] = data.ingresos ?? []
      setDatos({ gastos, ingresos })
      setConsultadoEn(new Date())

      // Período por defecto: el mes más reciente con datos
      const meses = mesesDisponibles(gastos, ingresos)
      const anios = aniosDisponibles(meses)
      setMes((actual) =>
        actual === PERIODO_TODOS || meses.includes(actual) || anios.includes(actual)
          ? actual
          : meses[0] ?? ''
      )
    } catch (e) {
      console.error('Error cargando transparencia:', e)
      setError('No se pudieron cargar los datos. Intenta nuevamente en unos minutos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const meses = useMemo(
    () => (datos ? mesesDisponibles(datos.gastos, datos.ingresos) : []),
    [datos]
  )

  const anios = useMemo(() => aniosDisponibles(meses), [meses])
  const rangoInvalido = Boolean(desde && hasta && desde > hasta)
  const periodoVisible = tipoFiltro === 'dia'
    ? (dia ? formatFecha(dia) : 'Selecciona un día')
    : tipoFiltro === 'rango'
      ? (rangoInvalido ? 'Rango inválido' : `${desde ? formatFecha(desde) : 'Sin límite inicial'} – ${hasta ? formatFecha(hasta) : 'Sin límite final'}`)
      : nombrePeriodo(mes)

  // Todos los cálculos se hacen aquí con las filas de la hoja
  const resumen = useMemo(() => {
    if (!datos) return null

    // 'todos' -> prefijo vacío (coincide con todo); 'YYYY' o 'YYYY-MM' -> filtra por prefijo
    const prefijo = mes === PERIODO_TODOS ? '' : mes
    const coincideFecha = ({ fecha }: { fecha: string }) => {
      const fechaDia = (fecha ?? '').slice(0, 10)
      if (tipoFiltro === 'dia') return Boolean(dia) && fechaDia === dia
      if (tipoFiltro === 'rango') {
        return !rangoInvalido && /^\d{4}-\d{2}-\d{2}$/.test(fechaDia)
          && (!desde || fechaDia >= desde) && (!hasta || fechaDia <= hasta)
      }
      return (fecha ?? '').startsWith(prefijo)
    }
    const gastosMes = datos.gastos.filter(coincideFecha)
    const ingresosMes = datos.ingresos.filter(coincideFecha)

    const totalGastado = gastosMes.reduce((s, g) => s + g.monto, 0)
    const totalRecaudado = ingresosMes.reduce((s, i) => s + i.monto, 0)

    const porCategoria = new Map<string, number>()
    gastosMes.forEach((g) => {
      porCategoria.set(g.gasto, (porCategoria.get(g.gasto) ?? 0) + g.monto)
    })

    const categorias: GastoCategoria[] = Array.from(porCategoria.entries())
      .map(([categoria, monto]) => ({
        categoria,
        icon: iconoCategoria(categoria),
        monto,
        porcentaje: totalGastado > 0 ? Math.round((monto / totalGastado) * 100) : 0,
      }))
      .sort((a, b) => b.monto - a.monto)

    const movimientos: Movimiento[] = [
      ...ingresosMes.map((i) => ({
        fecha: i.fecha,
        desc: i.descripcion,
        tipo: 'ingreso' as const,
        monto: i.monto,
      })),
      ...gastosMes.map((g) => ({
        fecha: g.fecha,
        desc: g.razon,
        tipo: 'gasto' as const,
        monto: -g.monto,
      })),
    ]
      .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
      .slice(0, 8)

    return {
      totalGastado,
      totalRecaudado,
      saldo: totalRecaudado - totalGastado,
      categorias,
      movimientos,
      hayIngresos: ingresosMes.length > 0,
    }
  }, [datos, mes, tipoFiltro, dia, desde, hasta, rangoInvalido])

  if (cargando && !datos) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-stone-500 text-sm">Cargando rendición de cuentas…</p>
      </div>
    )
  }

  if (error && !datos) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-3">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <p className="text-sm text-rose-700">{error}</p>
          <button onClick={() => void cargar()} className="mt-2 text-xs text-rose-600 underline">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!resumen) return null

  const { totalGastado, totalRecaudado, saldo, categorias, movimientos, hayIngresos } = resumen

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
            📊 Rendición de Cuentas
          </h2>
          <p className="text-stone-500 text-sm">
            Período: {periodoVisible} · Montos en Pesos Chilenos (CLP)
          </p>
        </div>

        {meses.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-stone-700">
              Filtrar por
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="border border-stone-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="periodo">Período</option>
                <option value="dia">Por día</option>
                <option value="rango">Rango de fechas</option>
              </select>
            </label>
            {tipoFiltro === 'periodo' && (
            <label className="flex flex-col gap-1 text-sm text-stone-700">
              Período
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-stone-300 bg-white rounded-lg px-3 py-2 text-sm text-stone-700 focus:ring-2 focus:ring-amber-500"
            aria-label="Período"
          >
            <option value={PERIODO_TODOS}>Todo el tiempo</option>
            <optgroup label="Por año">
              {anios.map((a) => (
                <option key={a} value={a}>
                  Año {a}
                </option>
              ))}
            </optgroup>
            <optgroup label="Por mes">
              {meses.map((m) => (
                <option key={m} value={m}>
                  {nombreMes(m)}
                </option>
              ))}
            </optgroup>
          </select>
            </label>
            )}
            {tipoFiltro === 'dia' && (
              <label className="flex flex-col gap-1 text-sm text-stone-700">
                Día
                <input
                  type="date"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="border border-stone-300 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
                />
              </label>
            )}
            {tipoFiltro === 'rango' && (
              <>
                <label className="flex flex-col gap-1 text-sm text-stone-700">
                  Desde
                  <input type="date" value={desde} max={hasta || undefined}
                    onChange={(e) => setDesde(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    aria-invalid={rangoInvalido} aria-describedby={rangoInvalido ? 'error-rango' : undefined}
                    className="border border-stone-300 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                </label>
                <label className="flex flex-col gap-1 text-sm text-stone-700">
                  Hasta
                  <input type="date" value={hasta} min={desde || undefined}
                    onChange={(e) => setHasta(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    aria-invalid={rangoInvalido} aria-describedby={rangoInvalido ? 'error-rango' : undefined}
                    className="border border-stone-300 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                </label>
              </>
            )}
            {tipoFiltro !== 'periodo' && (
              <button type="button" onClick={() => {
                setTipoFiltro('periodo')
                setMes(PERIODO_TODOS)
                setDia('')
                setDesde('')
                setHasta('')
              }} className="px-3 py-2 text-sm text-amber-800 underline rounded-lg focus:ring-2 focus:ring-amber-500">
                Limpiar filtro
              </button>
            )}
          </div>
        )}
      </div>

      {tipoFiltro === 'rango' && rangoInvalido && (
        <p id="error-rango" role="alert" className="text-sm text-rose-700">
          La fecha inicial debe ser anterior o igual a la fecha final.
        </p>
      )}

      {meses.length === 0 && (
        <div className="bg-stone-100 border border-stone-200 rounded-2xl p-5 text-sm text-stone-500">
          Aún no hay movimientos registrados.
        </div>
      )}

      {/* Métricas clave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Recaudado',
            value: hayIngresos ? formatCLP(totalRecaudado) : '—',
            icon: '💰',
            sub: hayIngresos ? 'Colectas + ofrendas y donaciones' : 'Sin ingresos registrados en el período',
            color: 'bg-green-50 border-green-200',
            valueColor: 'text-green-700',
          },
          {
            label: 'Total Gastado',
            value: formatCLP(totalGastado),
            icon: '📤',
            sub: 'Todos los egresos del período',
            color: 'bg-rose-50 border-rose-200',
            valueColor: 'text-rose-700',
          },
          {
            label: 'Saldo Disponible',
            value: hayIngresos ? formatCLP(saldo) : '—',
            icon: '🏦',
            sub: 'Reserva para el próximo período',
            color: 'bg-sky-50 border-sky-200',
            valueColor: 'text-sky-700',
          },
        ].map(({ label, value, icon, sub, color, valueColor }) => (
          <div key={label} className={`border rounded-2xl p-5 space-y-1 ${color}`}>
            <p className="text-sm font-medium text-stone-500 flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              {label}
            </p>
            <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
            <p className="text-xs text-stone-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Desglose de gastos */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <h3 className="font-bold text-stone-800 text-lg">Desglose de Gastos por Categoría</h3>
        {categorias.length === 0 ? (
          <p className="text-sm text-stone-400">No hay gastos registrados en este período.</p>
        ) : (
          <ul className="space-y-4">
            {categorias.map(({ categoria, icon, monto, porcentaje }) => (
              <li key={categoria} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-700 font-medium">
                    {icon} {categoria}
                  </span>
                  <span className="font-semibold text-stone-800">
                    {formatCLP(monto)}
                    <span className="text-stone-400 font-normal ml-1.5">({porcentaje}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full transition-all"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Últimas transacciones */}
      <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-800 text-lg">Últimos Movimientos</h3>
        </div>
        {movimientos.length === 0 ? (
          <p className="px-6 py-4 text-sm text-stone-400">No hay movimientos en este período.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {movimientos.map(({ fecha, desc, tipo, monto }, i) => (
              <li
                key={`${tipo}-${fecha}-${desc}-${i}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tipo === 'ingreso' ? '🟢' : '🔴'}</span>
                  <div>
                    <p className="text-sm font-medium text-stone-700">{desc || 'Sin descripción'}</p>
                    <p className="text-xs text-stone-400">{formatFecha(fecha)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${monto > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                  {monto > 0 ? '+' : ''}
                  {formatCLP(monto)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-stone-400 text-center">
        Los antecedentes son registrados y procesados por la secretaría parroquial.
        {consultadoEn &&
          ` Última consulta: ${consultadoEn.toLocaleString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`}
      </p>
    </div>
  )
}
