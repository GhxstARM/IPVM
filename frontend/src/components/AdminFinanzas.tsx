import { useEffect, useMemo, useState } from 'react'
import { API_URL } from '../config'
import type { Gasto, Ingreso, Registro, TipoRegistro } from '../types/finanzas'
import { extraerMensaje } from '../utils/errors'
import { fechaAInput, formatCLP, formatFechaHora, hoyInput, inputAFecha } from '../utils/format'
import {
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
} from './icons'
import Spinner from './Spinner'

// ── Tipos locales ─────────────────────────────────────────────────────────────
interface DatosFinanzas {
  gastos: Gasto[]
  ingresos: Ingreso[]
}

/** Valores del formulario: todos como texto, tal como los entregan los inputs. */
interface FormFinanzas {
  fecha: string
  monto: string
  gasto: string
  razon: string
  tipoIngreso: string
  descripcion: string
}

type Modificaciones = Record<string, number>

// ── Persistencia local de fechas de modificación ──────────────────────────────
const STORAGE_MODS = 'ipvm_finanzas_modificaciones'

function leerModificacionesLocales(): Modificaciones {
  try {
    const raw = localStorage.getItem(STORAGE_MODS)
    return raw ? (JSON.parse(raw) as Modificaciones) : {}
  } catch {
    return {}
  }
}

function guardarModificacionLocal(id: string, marca: number): void {
  try {
    const mods = leerModificacionesLocales()
    mods[id] = marca
    localStorage.setItem(STORAGE_MODS, JSON.stringify(mods))
  } catch {
    // Ignorar si localStorage está deshabilitado
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const etiquetaTipo = (tipo: TipoRegistro) => (tipo === 'gastos' ? 'gasto' : 'ingreso')

const esGasto = (registro: Registro): registro is Gasto => 'gasto' in registro

function formularioVacio(): FormFinanzas {
  return {
    fecha: hoyInput(),
    monto: '',
    gasto: 'Otros',
    razon: '',
    tipoIngreso: 'Presencial',
    descripcion: '',
  }
}

function formularioDesde(registro: Registro): FormFinanzas {
  const base: FormFinanzas = {
    ...formularioVacio(),
    fecha: fechaAInput(registro.fecha),
    monto: String(registro.monto),
  }
  return esGasto(registro)
    ? { ...base, gasto: registro.gasto, razon: registro.razon }
    : {
        ...base,
        tipoIngreso: registro.tipoIngreso || 'Presencial',
        descripcion: registro.descripcion,
      }
}

/** Marca de tiempo (ms) de la última modificación de un registro; 0 si se desconoce. */
function marcaDeTiempo(registro: Registro, modificaciones: Modificaciones): number {
  const remota = registro.actualizadoEn ? new Date(registro.actualizadoEn).getTime() : 0
  return !Number.isNaN(remota) && remota > 0 ? remota : (modificaciones[String(registro.id)] ?? 0)
}

/** Más recientes primero; a igualdad de fecha, el ID más alto arriba. */
function ordenarRegistros(lista: Registro[], modificaciones: Modificaciones): Registro[] {
  return [...lista].sort((a, b) => {
    const tsA = marcaDeTiempo(a, modificaciones)
    const tsB = marcaDeTiempo(b, modificaciones)
    if (tsA !== tsB) return tsB - tsA

    const idA = Number(a.id)
    const idB = Number(b.id)
    if (!Number.isNaN(idA) && !Number.isNaN(idB)) return idB - idA
    return String(b.id ?? '').localeCompare(String(a.id ?? ''), undefined, { numeric: true })
  })
}

function construirCuerpo(tipo: TipoRegistro, form: FormFinanzas) {
  return tipo === 'gastos'
    ? { gasto: form.gasto, fecha: inputAFecha(form.fecha), razon: form.razon, monto: form.monto }
    : {
        tipoIngreso: form.tipoIngreso,
        fecha: inputAFecha(form.fecha),
        descripcion: form.descripcion,
        monto: form.monto,
      }
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function AdminFinanzas({ token }: { token: string }) {
  const [tipo, setTipo] = useState<TipoRegistro>('gastos')
  const [datos, setDatos] = useState<DatosFinanzas>({ gastos: [], ingresos: [] })
  const [modificaciones, setModificaciones] = useState<Modificaciones>(leerModificacionesLocales)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [editando, setEditando] = useState<Registro | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [form, setForm] = useState<FormFinanzas>(formularioVacio)
  const [guardando, setGuardando] = useState(false)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const authHeaders = { Authorization: `Bearer ${token}` }
  const nombre = etiquetaTipo(tipo)

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/finanzas`, { headers: authHeaders })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los registros.')
      setDatos({ gastos: data.gastos ?? [], ingresos: data.ingresos ?? [] })
    } catch (e) {
      setError(extraerMensaje(e, 'Error de conexión.'))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const abrirFormulario = (registro?: Registro) => {
    setFormAbierto(true)
    setEditando(registro ?? null)
    setConfirmandoId(null)
    setMensaje('')
    setError('')
    setForm(registro ? formularioDesde(registro) : formularioVacio())
  }

  const cerrarFormulario = () => {
    setEditando(null)
    setFormAbierto(false)
  }

  const cambiarTipo = (nuevo: TipoRegistro) => {
    setTipo(nuevo)
    cerrarFormulario()
    setConfirmandoId(null)
    setMensaje('')
    setError('')
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      const id = editando?.id
      const esEdicion = id !== undefined
      const response = await fetch(
        `${API_URL}/api/finanzas/${tipo}${esEdicion ? `/${encodeURIComponent(String(id))}` : ''}`,
        {
          method: esEdicion ? 'PUT' : 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(construirCuerpo(tipo, form)),
        },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el registro.')

      const targetId = data.id ?? id
      if (targetId !== undefined && targetId !== null) {
        const ahora = Date.now()
        guardarModificacionLocal(String(targetId), ahora)
        setModificaciones((prev) => ({ ...prev, [String(targetId)]: ahora }))
      }
      cerrarFormulario()
      setMensaje(esEdicion ? 'Registro actualizado.' : 'Registro agregado.')
      await cargar()
    } catch (e) {
      setError(extraerMensaje(e, 'Error de conexión.'))
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: number | string) => {
    const idKey = String(id)
    setEliminandoId(idKey)
    setError('')
    setMensaje('')
    try {
      const response = await fetch(
        `${API_URL}/api/finanzas/${tipo}/${encodeURIComponent(idKey)}`,
        { method: 'DELETE', headers: authHeaders },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el registro.')
      setConfirmandoId(null)
      setMensaje('Registro eliminado.')
      await cargar()
    } catch (e) {
      setError(extraerMensaje(e, 'Error de conexión.'))
    } finally {
      setEliminandoId(null)
    }
  }

  const registros = useMemo(
    () => ordenarRegistros(tipo === 'gastos' ? datos.gastos : datos.ingresos, modificaciones),
    [tipo, datos, modificaciones],
  )

  const setCampo = (campo: keyof FormFinanzas, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  return (
    <section className="space-y-5">
      {/* Cabecera y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-title text-xl">Administración financiera</h3>
          <p className="muted mt-1">Administra los movimientos registrados en Google Sheets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void cargar()}
            disabled={cargando}
            className="btn btn-secondary btn-sm"
            aria-label="Actualizar lista de registros"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {!formAbierto && (
            <button type="button" onClick={() => abrirFormulario()} className="btn btn-primary btn-sm">
              <PlusIcon className="h-4 w-4" />
              Agregar {nombre}
            </button>
          )}
        </div>
      </div>

      {/* Selector gastos / ingresos */}
      <div role="tablist" aria-label="Tipo de movimiento" className="segmented">
        {(['gastos', 'ingresos'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tipo === t}
            onClick={() => cambiarTipo(t)}
            className="segmented-item capitalize"
          >
            {t} <span className="tabular-nums opacity-75">({datos[t].length})</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="alert alert-error animate-fade-in">
          <ExclamationIcon className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {mensaje && (
        <div role="status" className="alert alert-success animate-fade-in">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Formulario crear / editar */}
      {formAbierto && (
        <form
          onSubmit={guardar}
          className="card animate-fade-in grid gap-4 p-6 sm:grid-cols-2"
        >
          <h4 className="section-title text-base sm:col-span-2">
            {editando?.id !== undefined ? 'Editar' : 'Agregar'} {nombre}
          </h4>

          <div>
            <label htmlFor="fin-fecha" className="label">
              Fecha
            </label>
            <input
              id="fin-fecha"
              required
              type="date"
              className="input"
              value={form.fecha}
              onChange={(e) => setCampo('fecha', e.target.value)}
            />
          </div>

          {tipo === 'gastos' ? (
            <>
              <div>
                <label htmlFor="fin-categoria" className="label">
                  Categoría
                </label>
                <input
                  id="fin-categoria"
                  required
                  className="input"
                  value={form.gasto}
                  onChange={(e) => setCampo('gasto', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fin-razon" className="label">
                  Razón / destino
                </label>
                <input
                  id="fin-razon"
                  required
                  className="input"
                  value={form.razon}
                  onChange={(e) => setCampo('razon', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="fin-tipo-ingreso" className="label">
                  Tipo de ingreso
                </label>
                <select
                  id="fin-tipo-ingreso"
                  className="input"
                  value={form.tipoIngreso}
                  onChange={(e) => setCampo('tipoIngreso', e.target.value)}
                >
                  <option>Presencial</option>
                  <option>Online</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fin-descripcion" className="label">
                  Descripción
                </label>
                <input
                  id="fin-descripcion"
                  required
                  className="input"
                  value={form.descripcion}
                  onChange={(e) => setCampo('descripcion', e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="fin-monto" className="label">
              Monto (CLP)
            </label>
            <input
              id="fin-monto"
              required
              min="1"
              step="1"
              type="number"
              className="input tabular-nums"
              value={form.monto}
              onChange={(e) => setCampo('monto', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2 sm:col-span-2">
            <button type="submit" disabled={guardando} className="btn btn-primary">
              {guardando ? (
                <>
                  <Spinner />
                  Guardando…
                </>
              ) : (
                'Guardar'
              )}
            </button>
            <button
              type="button"
              onClick={cerrarFormulario}
              disabled={guardando}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Listado de registros */}
      {cargando ? (
        <div className="card overflow-hidden animate-pulse" aria-busy="true" aria-label="Cargando registros">
          <div className="border-b border-stone-100 bg-stone-50 px-5 py-3.5">
            <div className="h-3.5 w-48 rounded bg-stone-200" />
          </div>
          <ul className="divide-y divide-stone-100">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="space-y-2">
                  <div className="h-4 w-56 rounded bg-stone-200" />
                  <div className="h-3 w-32 rounded bg-stone-100" />
                </div>
                <div className="h-4 w-24 rounded bg-stone-200" />
              </li>
            ))}
          </ul>
        </div>
      ) : registros.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
            <BanknotesIcon className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-stone-700">No hay {tipo} registrados.</p>
            <p className="text-xs text-stone-500">
              Agrega un nuevo registro con el botón superior para comenzar.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Vista móvil: tarjetas apiladas (sin scroll horizontal) */}
          <div className="space-y-3 md:hidden">
            {registros.map((r) => {
              const idKey = String(r.id)
              const modificada = modificaciones[idKey]
              const actualizadoIso =
                r.actualizadoEn || (modificada ? new Date(modificada).toISOString() : '')
              const tituloDetalle = esGasto(r) ? r.razon : r.descripcion
              const etiqueta = esGasto(r) ? r.gasto : (r.tipoIngreso || 'Ingreso')
              const confirmando = confirmandoId === idKey
              const eliminando = eliminandoId === idKey

              return (
                <article key={r.id} className="card space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge border-stone-200 bg-stone-100 text-stone-700">
                          {etiqueta}
                        </span>
                        <span className="text-xs text-stone-500">#{r.id}</span>
                      </div>
                      <p className="text-sm font-semibold text-stone-900">{tituloDetalle}</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        tipo === 'gastos' ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatCLP(Number(r.monto))}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <span>Fecha: {r.fecha}</span>
                    <span>Act.: {formatFechaHora(actualizadoIso)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                    {confirmando ? (
                      <>
                        <span className="text-xs font-medium text-rose-700">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => void eliminar(r.id)}
                          disabled={eliminando}
                          className="btn btn-danger btn-sm"
                        >
                          {eliminando ? (
                            <>
                              <Spinner className="h-3.5 w-3.5" />
                              Eliminando…
                            </>
                          ) : (
                            'Sí, eliminar'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmandoId(null)}
                          disabled={eliminando}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirFormulario(r)}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmandoId(idKey)}
                          className="btn btn-danger btn-sm flex-1"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {/* Vista escritorio: tabla amplia */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-4 py-3.5">ID</th>
                  <th className="px-4 py-3.5">Fecha</th>
                  <th className="px-4 py-3.5">Detalle</th>
                  <th className="px-4 py-3.5 text-right">Monto</th>
                  <th className="px-4 py-3.5">Última actualización</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {registros.map((r) => {
                  const idKey = String(r.id)
                  const modificada = modificaciones[idKey]
                  const actualizadoIso =
                    r.actualizadoEn || (modificada ? new Date(modificada).toISOString() : '')
                  const etiqueta = esGasto(r) ? r.gasto : (r.tipoIngreso || 'Ingreso')
                  const detalleTexto = esGasto(r) ? r.razon : r.descripcion
                  const confirmando = confirmandoId === idKey
                  const eliminando = eliminandoId === idKey

                  return (
                    <tr key={r.id} className="transition-colors hover:bg-stone-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-stone-500">
                        #{r.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-stone-700">{r.fecha}</td>
                      <td className="px-4 py-3.5">
                        <span className="badge mr-2 border-stone-200 bg-stone-100 text-stone-700">
                          {etiqueta}
                        </span>
                        <span className="font-medium text-stone-800">{detalleTexto}</span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums ${
                          tipo === 'gastos' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCLP(Number(r.monto))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs tabular-nums text-stone-500">
                        {formatFechaHora(actualizadoIso)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        {confirmando ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void eliminar(r.id)}
                              disabled={eliminando}
                              className="btn btn-danger btn-sm"
                            >
                              {eliminando ? <Spinner className="h-3.5 w-3.5" /> : 'Confirmar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmandoId(null)}
                              disabled={eliminando}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => abrirFormulario(r)}
                              className="btn btn-ghost btn-sm text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                              aria-label={`Editar ${nombre} ${r.id}`}
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmandoId(idKey)}
                              className="btn btn-ghost btn-sm text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              aria-label={`Eliminar ${nombre} ${r.id}`}
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
