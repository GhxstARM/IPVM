import { useEffect, useMemo, useState } from 'react'
import { API_URL } from '../config'
import type { Gasto, Ingreso } from '../types/finanzas'
import { formatCLP, formatFecha } from '../utils/format'
import {
  type IconoComponente,
  PERIODO_TODOS,
  aniosDisponibles,
  iconoCategoria,
  mesesDisponibles,
  nombreMes,
  nombrePeriodo,
} from '../utils/periodos'
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ChartIcon,
  ExclamationIcon,
  RefreshIcon,
} from './icons'
import TransparenciaSkeleton from './TransparenciaSkeleton'

interface GastoCategoria {
  categoria: string
  Icono: IconoComponente
  monto: number
  porcentaje: number
}

interface Movimiento {
  fecha: string
  desc: string
  tipo: 'ingreso' | 'gasto'
  monto: number
}

type TipoFiltro = 'periodo' | 'dia' | 'rango'

export default function Transparencia() {
  const [datos, setDatos] = useState<{ gastos: Gasto[]; ingresos: Ingreso[] } | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mes, setMes] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('periodo')
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
          : (meses[0] ?? ''),
      )
    } catch {
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
    [datos],
  )

  const anios = useMemo(() => aniosDisponibles(meses), [meses])
  const rangoInvalido = Boolean(desde && hasta && desde > hasta)
  const periodoVisible =
    tipoFiltro === 'dia'
      ? dia
        ? formatFecha(dia)
        : 'Selecciona un día'
      : tipoFiltro === 'rango'
        ? rangoInvalido
          ? 'Rango inválido'
          : `${desde ? formatFecha(desde) : 'Sin límite inicial'} – ${hasta ? formatFecha(hasta) : 'Sin límite final'}`
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
        return (
          !rangoInvalido &&
          /^\d{4}-\d{2}-\d{2}$/.test(fechaDia) &&
          (!desde || fechaDia >= desde) &&
          (!hasta || fechaDia <= hasta)
        )
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
        Icono: iconoCategoria(categoria),
        monto,
        porcentaje: totalGastado > 0 ? Math.round((monto / totalGastado) * 100) : 0,
      }))
      .sort((a, b) => b.monto - a.monto)

    const movimientos: Movimiento[] = [
      ...ingresosMes.map((i) => ({
        fecha: i.fecha,
        desc: `${i.tipoIngreso ? `${i.tipoIngreso} · ` : ''}${i.descripcion}`,
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

  if (cargando && !datos) return <TransparenciaSkeleton />

  if (error && !datos) {
    return (
      <div className="page animate-fade-in">
        <div role="alert" className="alert alert-error flex-col sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3">
            <ExclamationIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">No se pudo cargar la rendición de cuentas</p>
              <p className="mt-0.5 font-normal text-zinc-700">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void cargar()}
            className="btn btn-primary btn-sm self-start sm:self-auto"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!resumen) return null

  const { totalGastado, totalRecaudado, saldo, categorias, movimientos, hayIngresos } = resumen

  const limpiarFiltros = () => {
    setTipoFiltro('periodo')
    setMes(PERIODO_TODOS)
    setDia('')
    setDesde('')
    setHasta('')
  }

  const metricas = [
    {
      label: 'Total Recaudado',
      value: hayIngresos ? formatCLP(totalRecaudado) : '—',
      Icono: BanknotesIcon,
      sub: hayIngresos ? 'Colectas, ofrendas y donaciones' : 'Sin ingresos registrados en el período',
      cardClass: 'border-zinc-900 bg-zinc-950 text-white',
      labelClass: 'text-zinc-300',
      iconClass: 'bg-white/15 text-white',
      valueColor: 'text-white',
      subClass: 'text-zinc-400',
    },
    {
      label: 'Total Gastado',
      value: formatCLP(totalGastado),
      Icono: ArrowDownCircleIcon,
      sub: 'Todos los egresos del período',
      cardClass: 'border-zinc-200 bg-white text-zinc-950',
      labelClass: 'text-zinc-600',
      iconClass: 'bg-zinc-100 text-zinc-900',
      valueColor: 'text-zinc-950',
      subClass: 'text-zinc-500',
    },
    {
      label: 'Saldo Disponible',
      value: hayIngresos ? formatCLP(saldo) : '—',
      Icono: BuildingLibraryIcon,
      sub: 'Reserva para el próximo período',
      cardClass: 'border-zinc-300 bg-zinc-100 text-zinc-950',
      labelClass: 'text-zinc-700',
      iconClass: 'bg-zinc-950 text-white',
      valueColor: 'text-zinc-950',
      subClass: 'text-zinc-600',
    },
  ]

  return (
    <div className="page animate-fade-in space-y-8">
      {/* Encabezado */}
      <div className="space-y-2">
        <p className="eyebrow">Transparencia Financiera · PVM</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <ChartIcon className="h-5 w-5" />
          </span>
          <h2 className="page-title">Rendición de Cuentas</h2>
        </div>
        <p className="muted">
          Período: <strong className="font-semibold text-zinc-800">{periodoVisible}</strong> ·
          Montos en Pesos Chilenos (CLP)
        </p>
      </div>

      {/* Barra de filtros */}
      {meses.length > 0 && (
        <div className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[150px] flex-1 sm:flex-none">
              <label htmlFor="filtro-tipo" className="label">
                Filtrar por
              </label>
              <select
                id="filtro-tipo"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
                className="input"
              >
                <option value="periodo">Período</option>
                <option value="dia">Por día</option>
                <option value="rango">Rango de fechas</option>
              </select>
            </div>

            {tipoFiltro === 'periodo' && (
              <div className="min-w-[200px] flex-1 sm:flex-none">
                <label htmlFor="filtro-periodo" className="label">
                  Período
                </label>
                <select
                  id="filtro-periodo"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="input"
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
              </div>
            )}

            {tipoFiltro === 'dia' && (
              <div className="min-w-[180px] flex-1 sm:flex-none">
                <label htmlFor="filtro-dia" className="label">
                  Día
                </label>
                <input
                  id="filtro-dia"
                  type="date"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="input"
                />
              </div>
            )}

            {tipoFiltro === 'rango' && (
              <>
                <div className="min-w-[160px] flex-1 sm:flex-none">
                  <label htmlFor="filtro-desde" className="label">
                    Desde
                  </label>
                  <input
                    id="filtro-desde"
                    type="date"
                    value={desde}
                    max={hasta || undefined}
                    onChange={(e) => setDesde(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    aria-invalid={rangoInvalido}
                    aria-describedby={rangoInvalido ? 'error-rango' : undefined}
                    className={`input ${rangoInvalido ? 'input-error' : ''}`}
                  />
                </div>
                <div className="min-w-[160px] flex-1 sm:flex-none">
                  <label htmlFor="filtro-hasta" className="label">
                    Hasta
                  </label>
                  <input
                    id="filtro-hasta"
                    type="date"
                    value={hasta}
                    min={desde || undefined}
                    onChange={(e) => setHasta(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    aria-invalid={rangoInvalido}
                    aria-describedby={rangoInvalido ? 'error-rango' : undefined}
                    className={`input ${rangoInvalido ? 'input-error' : ''}`}
                  />
                </div>
              </>
            )}

            {tipoFiltro !== 'periodo' && (
              <button type="button" onClick={limpiarFiltros} className="btn btn-ghost text-zinc-900">
                Limpiar filtro
              </button>
            )}
          </div>

          {tipoFiltro === 'rango' && rangoInvalido && (
            <p
              id="error-rango"
              role="alert"
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-zinc-900"
            >
              <ExclamationIcon className="h-4 w-4 shrink-0" />
              La fecha inicial debe ser anterior o igual a la fecha final.
            </p>
          )}
        </div>
      )}

      {meses.length === 0 && (
        <div className="panel flex items-center gap-3 p-5 text-sm text-zinc-600">
          <ChartIcon className="h-5 w-5 shrink-0 text-zinc-700" />
          <span>Aún no hay movimientos registrados.</span>
        </div>
      )}

      {/* Métricas clave */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metricas.map(
          ({ label, value, Icono, sub, cardClass, labelClass, iconClass, valueColor, subClass }) => (
            <div key={label} className={`rounded-2xl border p-5 shadow-card ${cardClass}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-semibold ${labelClass}`}>{label}</p>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                  <Icono className="h-5 w-5" />
                </span>
              </div>
              <p
                className={`mt-3 text-2xl font-black tracking-tight tabular-nums sm:text-3xl ${valueColor}`}
              >
                {value}
              </p>
              <p className={`mt-1.5 text-xs ${subClass}`}>{sub}</p>
            </div>
          ),
        )}
      </div>

      {/* Desglose de gastos */}
      <section className="card space-y-5 p-6">
        <h3 className="section-title">Desglose de Gastos por Categoría</h3>
        {categorias.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
              <ChartIcon className="h-5 w-5" />
            </span>
            <p className="text-sm text-zinc-500">No hay gastos registrados en este período.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {categorias.map(({ categoria, Icono, monto, porcentaje }) => (
              <li key={categoria} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2.5 font-medium text-zinc-800">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
                      <Icono className="h-4 w-4" />
                    </span>
                    <span className="truncate">{categoria}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-zinc-950">
                    {formatCLP(monto)}
                    <span className="ml-1.5 font-normal text-zinc-500">({porcentaje}%)</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-950 transition-all duration-500"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Últimas transacciones */}
      <section className="card overflow-hidden">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h3 className="section-title">Últimos Movimientos</h3>
        </div>
        {movimientos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
              <BanknotesIcon className="h-5 w-5" />
            </span>
            <p className="text-sm text-zinc-500">No hay movimientos en este período.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {movimientos.map(({ fecha, desc, tipo, monto }, i) => {
              const esIngreso = tipo === 'ingreso'
              return (
                <li
                  key={`${tipo}-${fecha}-${desc}-${i}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        esIngreso
                          ? 'bg-zinc-950 text-white'
                          : 'border border-zinc-300 bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {esIngreso ? (
                        <ArrowUpCircleIcon className="h-5 w-5" />
                      ) : (
                        <ArrowDownCircleIcon className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {desc || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-zinc-500">{formatFecha(fecha)}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      monto > 0 ? 'text-zinc-950' : 'text-zinc-600'
                    }`}
                  >
                    {monto > 0 ? '+' : ''}
                    {formatCLP(monto)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-zinc-500 sm:flex-row sm:gap-4">
        <p>
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
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={cargando}
          className="inline-flex items-center gap-1 font-semibold text-zinc-900 transition-colors hover:text-zinc-700 disabled:opacity-50"
        >
          <RefreshIcon className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>
    </div>
  )
}
