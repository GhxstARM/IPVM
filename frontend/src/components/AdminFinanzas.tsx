import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
type Tipo = 'gastos' | 'ingresos'
interface Gasto { id: number | string; gasto: string; fecha: string; razon: string; monto: number }
interface Ingreso { id: number | string; fecha: string; tipoIngreso: string; descripcion: string; monto: number }
type Registro = Gasto | Ingreso

const fechaInput = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(value)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''
}
const fechaSheet = (value: string) => { const [y, m, d] = value.split('-'); return `${d}-${m}-${y}` }
const inputClass = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200'
const hoyInput = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }

export default function AdminFinanzas({ token }: { token: string }) {
  const [tipo, setTipo] = useState<Tipo>('gastos')
  const [datos, setDatos] = useState<{ gastos: Gasto[]; ingresos: Ingreso[] }>({ gastos: [], ingresos: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [editando, setEditando] = useState<Registro | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  const authHeaders = { Authorization: `Bearer ${token}` }
  const cargar = async () => {
    setCargando(true); setError('')
    try {
      const response = await fetch(`${API_URL}/api/finanzas`, { headers: authHeaders })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los registros.')
      setDatos({ gastos: data.gastos ?? [], ingresos: data.ingresos ?? [] })
    } catch (e) { setError(e instanceof Error ? e.message : 'Error de conexión.') }
    finally { setCargando(false) }
  }
  useEffect(() => { void cargar() }, [])

  const abrirFormulario = (registro?: Registro) => {
    setFormAbierto(true)
    setEditando(registro ?? null); setMensaje(''); setError('')
    if (!registro) setForm({ fecha: hoyInput(), gasto: 'Otros', razon: '', monto: '', tipoIngreso: 'Presencial', descripcion: '' })
    else setForm({ ...registro, fecha: fechaInput(registro.fecha), monto: String(registro.monto) } as Record<string, string>)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault(); setGuardando(true); setError(''); setMensaje('')
    const gasto = tipo === 'gastos'
    const body = gasto
      ? { gasto: form.gasto, fecha: fechaSheet(form.fecha), razon: form.razon, monto: form.monto }
      : { tipoIngreso: form.tipoIngreso, fecha: fechaSheet(form.fecha), descripcion: form.descripcion, monto: form.monto }
    try {
      const id = editando?.id
      const response = await fetch(`${API_URL}/api/finanzas/${tipo}${id !== undefined ? `/${encodeURIComponent(String(id))}` : ''}`, {
        method: id !== undefined ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el registro.')
      setEditando(null); setFormAbierto(false); setMensaje(id !== undefined ? 'Registro actualizado.' : 'Registro agregado.')
      await cargar()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error de conexión.') }
    finally { setGuardando(false) }
  }

  const eliminar = async (id: number | string) => {
    if (!window.confirm(`¿Eliminar este ${tipo === 'gastos' ? 'gasto' : 'ingreso'}? Esta acción no se puede deshacer.`)) return
    setError(''); setMensaje('')
    try {
      const response = await fetch(`${API_URL}/api/finanzas/${tipo}/${encodeURIComponent(String(id))}`, { method: 'DELETE', headers: authHeaders })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el registro.')
      setMensaje('Registro eliminado.'); await cargar()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error de conexión.') }
  }

  const registros: Registro[] = tipo === 'gastos' ? datos.gastos : datos.ingresos
  return <section className="space-y-5">
    <div><h3 className="text-xl font-bold text-stone-800">Administración financiera</h3><p className="mt-1 text-sm text-stone-500">Administra los movimientos registrados en Google Sheets.</p></div>
    <div className="flex gap-2 rounded-xl bg-stone-100 p-1">
      {(['gastos', 'ingresos'] as Tipo[]).map((t) => <button key={t} onClick={() => { setTipo(t); setEditando(null); setFormAbierto(false); setMensaje(''); setError('') }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${tipo === t ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-500'}`}>{t} ({t === 'gastos' ? datos.gastos.length : datos.ingresos.length})</button>)}
    </div>
    {!formAbierto && <button onClick={() => abrirFormulario()} className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">+ Agregar {tipo === 'gastos' ? 'gasto' : 'ingreso'}</button>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {mensaje && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{mensaje}</p>}
    {formAbierto && <form onSubmit={guardar} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
      <h4 className="font-bold text-stone-800 sm:col-span-2">{editando?.id !== undefined ? 'Editar' : 'Agregar'} {tipo === 'gastos' ? 'gasto' : 'ingreso'}</h4>
      <label className="space-y-1 text-sm font-medium">Fecha<input required type="date" className={inputClass} value={form.fecha ?? ''} onChange={e => setForm({ ...form, fecha: e.target.value })} /></label>
      {tipo === 'gastos' ? <>
        <label className="space-y-1 text-sm font-medium">Categoría<input required className={inputClass} value={form.gasto ?? ''} onChange={e => setForm({ ...form, gasto: e.target.value })} /></label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">Razón / destino<input required className={inputClass} value={form.razon ?? ''} onChange={e => setForm({ ...form, razon: e.target.value })} /></label>
      </> : <>
        <label className="space-y-1 text-sm font-medium">Tipo de ingreso<select className={inputClass} value={form.tipoIngreso ?? 'Presencial'} onChange={e => setForm({ ...form, tipoIngreso: e.target.value })}><option>Presencial</option><option>Online</option></select></label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">Descripción<input required className={inputClass} value={form.descripcion ?? ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></label>
      </>}
      <label className="space-y-1 text-sm font-medium">Monto (CLP)<input required min="1" step="1" type="number" className={inputClass} value={form.monto ?? ''} onChange={e => setForm({ ...form, monto: e.target.value })} /></label>
      <div className="flex gap-2 sm:col-span-2"><button disabled={guardando} className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{guardando ? 'Guardando…' : 'Guardar'}</button><button type="button" onClick={() => { setEditando(null); setFormAbierto(false) }} className="rounded-xl border border-stone-300 px-4 py-2 text-sm">Cancelar</button></div>
    </form>}
    {cargando ? <p className="py-8 text-center text-sm text-stone-500">Cargando registros…</p> : registros.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-stone-500">No hay {tipo} registrados.</p> : <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-stone-100 text-xs uppercase text-stone-500"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Detalle</th><th className="px-4 py-3">Monto</th><th className="px-4 py-3">Acciones</th></tr></thead><tbody className="divide-y divide-stone-100">{registros.map((r) => { const g = tipo === 'gastos' ? r as Gasto : null; const i = tipo === 'ingresos' ? r as Ingreso : null; return <tr key={r.id}><td className="px-4 py-3">{r.id}</td><td className="px-4 py-3 whitespace-nowrap">{r.fecha}</td><td className="px-4 py-3">{g ? `${g.gasto}: ${g.razon}` : `${i?.tipoIngreso}: ${i?.descripcion}`}</td><td className="px-4 py-3 whitespace-nowrap">${Number(r.monto).toLocaleString('es-CL')}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => abrirFormulario(r)} className="font-medium text-amber-800 hover:underline">Editar</button><button onClick={() => void eliminar(r.id)} className="font-medium text-red-700 hover:underline">Eliminar</button></div></td></tr> })}</tbody></table></div>}
    <button onClick={() => void cargar()} className="text-sm font-medium text-stone-500 underline">Actualizar lista</button>
  </section>
}
