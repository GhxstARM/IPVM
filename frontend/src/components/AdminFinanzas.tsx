import { useEffect, useMemo, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
type Tipo = 'gastos' | 'ingresos'
interface Gasto { id: number | string; gasto: string; fecha: string; razon: string; monto: number; actualizadoEn?: string }
interface Ingreso { id: number | string; fecha: string; tipoIngreso: string; descripcion: string; monto: number; actualizadoEn?: string }
type Registro = Gasto | Ingreso

const STORAGE_MODS = 'ipvm_finanzas_modificaciones'
const leerModificacionesLocales = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(STORAGE_MODS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const formatearFechaHora = (iso?: string) => {
  if (!iso || !iso.trim()) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`
}

const fechaInput = (value: string) => {
  const str = String(value || '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(str)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''
}

const fechaSheet = (value?: string) => {
  if (!value) return ''
  const [y, m, d] = value.split('-')
  return `${d ?? ''}-${m ?? ''}-${y ?? ''}`
}

const inputClass = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200'
const hoyInput = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function AdminFinanzas({ token }: { token: string }) {
  const [tipo, setTipo] = useState<Tipo>('gastos')
  const [datos, setDatos] = useState<{ gastos: Gasto[]; ingresos: Ingreso[] }>({ gastos: [], ingresos: [] })
  const [modificaciones, setModificaciones] = useState<Record<string, number>>(leerModificacionesLocales)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [editando, setEditando] = useState<Registro | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  const formRef = useRef<HTMLFormElement | null>(null)
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/finanzas`, { headers: authHeaders })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los registros.')
      setDatos({ gastos: data.gastos ?? [], ingresos: data.ingresos ?? [] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión.')
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
    setMensaje('')
    setError('')

    if (!registro) {
      setForm({
        fecha: hoyInput(),
        gasto: 'Otros',
        razon: '',
        monto: '',
        tipoIngreso: 'Presencial',
        descripcion: '',
      })
    } else {
      setForm({
        ...registro,
        fecha: fechaInput(registro.fecha),
        monto: String(registro.monto),
      } as Record<string, string>)
    }

    // Llevar automáticamente la vista hacia el formulario de edición
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const primerInput = formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select')
      primerInput?.focus()
    }, 80)
  }

  const cerrarFormulario = () => {
    setEditando(null)
    setFormAbierto(false)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')
    const gasto = tipo === 'gastos'
    const body = gasto
      ? { gasto: form.gasto, fecha: fechaSheet(form.fecha), razon: form.razon, monto: form.monto }
      : { tipoIngreso: form.tipoIngreso, fecha: fechaSheet(form.fecha), descripcion: form.descripcion, monto: form.monto }

    try {
      const id = editando?.id
      const response = await fetch(
        `${API_URL}/api/finanzas/${tipo}${id !== undefined ? `/${encodeURIComponent(String(id))}` : ''}`,
        {
          method: id !== undefined ? 'PUT' : 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el registro.')

      const targetId = data.id ?? id
      if (targetId !== undefined && targetId !== null) {
        const ahora = Date.now()
        try {
          const mods = leerModificacionesLocales()
          mods[String(targetId)] = ahora
          localStorage.setItem(STORAGE_MODS, JSON.stringify(mods))
        } catch {
          // Ignorar si localStorage está deshabilitado
        }
        setModificaciones((prev) => ({ ...prev, [String(targetId)]: ahora }))
      }

      setEditando(null)
      setFormAbierto(false)
      setMensaje(id !== undefined ? 'Registro actualizado con éxito.' : 'Registro agregado con éxito.')
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: number | string) => {
    if (!window.confirm(`¿Eliminar este ${tipo === 'gastos' ? 'gasto' : 'ingreso'}? Esta acción no se puede deshacer.`)) return
    setError('')
    setMensaje('')
    try {
      const response = await fetch(`${API_URL}/api/finanzas/${tipo}/${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el registro.')
      setMensaje('Registro eliminado correctamente.')
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión.')
    }
  }

  const registros: Registro[] = useMemo(() => {
    const lista = tipo === 'gastos' ? datos.gastos : datos.ingresos
    return [...lista].sort((a, b) => {
      const rawA = a.actualizadoEn ? new Date(a.actualizadoEn).getTime() : 0
      const rawB = b.actualizadoEn ? new Date(b.actualizadoEn).getTime() : 0
      const tsA = !isNaN(rawA) && rawA > 0 ? rawA : (modificaciones[String(a.id)] ?? 0)
      const tsB = !isNaN(rawB) && rawB > 0 ? rawB : (modificaciones[String(b.id)] ?? 0)

      if (tsA !== tsB) {
        return tsB - tsA
      }

      const idA = Number(a.id)
      const idB = Number(b.id)
      if (!isNaN(idA) && !isNaN(idB)) {
        return idB - idA
      }
      return String(b.id ?? '').localeCompare(String(a.id ?? ''), undefined, { numeric: true })
    })
  }, [tipo, datos, modificaciones])

  return (
    <section className="space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h3 className="text-xl font-bold text-stone-800">Administración Financiera</h3>
        <p className="mt-1 text-sm text-stone-500">
          Administra y consulta los movimientos registrados en Google Sheets.
        </p>
      </div>

      {/* ── Selector de Tipo (Gastos / Ingresos) ── */}
      <div className="flex gap-2 rounded-2xl bg-stone-100 p-1.5">
        {(['gastos', 'ingresos'] as Tipo[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTipo(t)
              cerrarFormulario()
              setMensaje('')
              setError('')
            }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition-all ${
              tipo === t ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {t} ({t === 'gastos' ? datos.gastos.length : datos.ingresos.length})
          </button>
        ))}
      </div>

      {/* ── Botón Agregar ── */}
      {!formAbierto && (
        <button
          onClick={() => abrirFormulario()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Agregar {tipo === 'gastos' ? 'Gasto' : 'Ingreso'}
        </button>
      )}

      {/* ── Avisos de error y éxito ── */}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {mensaje && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm font-medium text-green-700">
          {mensaje}
        </div>
      )}

      {/* ── Formulario de Creación / Edición ── */}
      {formAbierto && (
        <form
          ref={formRef}
          onSubmit={guardar}
          className="grid gap-4 rounded-2xl border-2 border-amber-300 bg-white p-5 shadow-md sm:grid-cols-2 transition-all scroll-mt-6"
        >
          <div className="flex items-center justify-between sm:col-span-2 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-stone-800 text-base">
                {editando?.id !== undefined ? 'Editar' : 'Agregar'} {tipo === 'gastos' ? 'Gasto' : 'Ingreso'}
              </h4>
              {editando?.id !== undefined && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  ID #{editando.id}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={cerrarFormulario}
              className="text-xs font-medium text-stone-400 hover:text-stone-700"
            >
              ✕ Cerrar
            </button>
          </div>

          <label className="space-y-1 text-sm font-medium text-stone-700">
            Fecha
            <input
              required
              type="date"
              className={inputClass}
              value={form.fecha ?? ''}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </label>

          {tipo === 'gastos' ? (
            <>
              <label className="space-y-1 text-sm font-medium text-stone-700">
                Categoría
                <input
                  required
                  placeholder="Ej: Servicios básicos, Comida, etc."
                  className={inputClass}
                  value={form.gasto ?? ''}
                  onChange={(e) => setForm({ ...form, gasto: e.target.value })}
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-stone-700 sm:col-span-2">
                Razón / Destino
                <input
                  required
                  placeholder="Detalle o nombre del comercio"
                  className={inputClass}
                  value={form.razon ?? ''}
                  onChange={(e) => setForm({ ...form, razon: e.target.value })}
                />
              </label>
            </>
          ) : (
            <>
              <label className="space-y-1 text-sm font-medium text-stone-700">
                Tipo de ingreso
                <select
                  className={inputClass}
                  value={form.tipoIngreso ?? 'Presencial'}
                  onChange={(e) => setForm({ ...form, tipoIngreso: e.target.value })}
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Online">Online</option>
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium text-stone-700 sm:col-span-2">
                Descripción
                <input
                  required
                  placeholder="Detalle o concepto del ingreso"
                  className={inputClass}
                  value={form.descripcion ?? ''}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </label>
            </>
          )}

          <label className="space-y-1 text-sm font-medium text-stone-700">
            Monto (CLP)
            <input
              required
              min="1"
              step="1"
              type="number"
              placeholder="Ej: 25000"
              className={inputClass}
              value={form.monto ?? ''}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
            />
          </label>

          <div className="flex items-center gap-3 pt-2 sm:col-span-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Guardando…' : editando?.id !== undefined ? 'Actualizar registro' : 'Guardar registro'}
            </button>
            <button
              type="button"
              onClick={cerrarFormulario}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ── Tabla de Registros ── */}
      {cargando ? (
        <div className="rounded-2xl border border-stone-200 bg-white py-12 text-center text-sm text-stone-500">
          <p className="animate-pulse">Cargando registros financieros…</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
          No hay {tipo} registrados.
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-auto">
              <thead className="bg-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center">ID</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Fecha</th>
                  <th className="px-3.5 py-3 min-w-[140px]">Detalle</th>
                  <th className="px-3.5 py-3 whitespace-nowrap text-right">Monto</th>
                  <th className="px-3.5 py-3 whitespace-nowrap hidden md:table-cell text-stone-400">Actualizado</th>
                  <th className="px-3.5 py-3 whitespace-nowrap text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {registros.map((r) => {
                  const g = tipo === 'gastos' ? (r as Gasto) : null
                  const i = tipo === 'ingresos' ? (r as Ingreso) : null
                  const actIso =
                    r.actualizadoEn ||
                    (modificaciones[String(r.id)]
                      ? new Date(modificaciones[String(r.id)]).toISOString()
                      : '')
                  const estaEditando = editando?.id === r.id

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        estaEditando
                          ? 'bg-amber-50/80 ring-2 ring-inset ring-amber-400'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* ID */}
                      <td className="px-3.5 py-3 text-center font-mono text-xs text-stone-400">
                        #{r.id}
                      </td>

                      {/* Fecha */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-xs sm:text-sm text-stone-700">
                        {r.fecha}
                        {/* Fecha de actualización en pantallas pequeñas */}
                        <div className="md:hidden text-[10px] text-stone-400 mt-0.5">
                          {formatearFechaHora(actIso)}
                        </div>
                      </td>

                      {/* Detalle */}
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-stone-800 leading-snug">
                          {g ? g.razon : i?.descripcion}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {g ? (
                            <span className="inline-block rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-600">
                              {g.gasto}
                            </span>
                          ) : (
                            <span
                              className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                                (i?.tipoIngreso || '').toLowerCase().includes('pres')
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {i?.tipoIngreso}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Monto */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-right font-bold text-stone-900 sm:text-sm">
                        ${Number(r.monto).toLocaleString('es-CL')}
                      </td>

                      {/* Última actualización */}
                      <td className="px-3.5 py-3 whitespace-nowrap hidden md:table-cell text-xs text-stone-500">
                        {formatearFechaHora(actIso)}
                      </td>

                      {/* Acciones (Editar / Eliminar siempre a la vista) */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => abrirFormulario(r)}
                            className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 active:bg-amber-200 transition-colors"
                            title="Editar este registro"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => void eliminar(r.id)}
                            className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 active:bg-red-200 transition-colors"
                            title="Eliminar este registro"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Refrescar ── */}
      <div className="pt-1">
        <button
          onClick={() => void cargar()}
          className="text-xs font-medium text-stone-500 hover:text-stone-800 underline transition-colors"
        >
          ↻ Actualizar lista desde Google Sheets
        </button>
      </div>
    </section>
  )
}
