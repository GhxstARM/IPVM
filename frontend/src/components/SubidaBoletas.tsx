import { useRef, useState } from 'react'
import AdminEventos from './AdminEventos'
import AdminInicio from './AdminInicio'

interface SubidaBoletasProps {
  onLogout: () => void
}

interface FormState {
  fecha: string
  monto: string
  archivo: File | null
  preview: string | null
}

type ModuloSecretaria = 'boletas' | 'eventos' | 'inicio'

const MODULOS: { id: ModuloSecretaria; label: string }[] = [
  { id: 'boletas', label: 'Boletas' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'inicio', label: 'Mensaje Pastoral' },
]

export default function SubidaBoletas({ onLogout }: SubidaBoletasProps) {
  const [moduloActivo, setModuloActivo] = useState<ModuloSecretaria>('boletas')

  const [form, setForm] = useState<FormState>({
    fecha: new Date().toISOString().split('T')[0] ?? '',
    monto: '',
    archivo: null,
    preview: null,
  })
  const [dragging, setDragging] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setResultado(null)

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setForm((f) => ({ ...f, archivo: file, preview: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    } else {
      setForm((f) => ({ ...f, archivo: file, preview: null }))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const formatCLP = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10)
    if (isNaN(num)) return ''
    return num.toLocaleString('es-CL')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.archivo || !form.monto || !form.fecha) return
    setProcesando(true)
    setResultado(null)

    await new Promise((r) => setTimeout(r, 2200))

    const montoNum = parseInt(form.monto.replace(/\D/g, ''), 10)
    setProcesando(false)
    setResultado(
      `✅ Boleta procesada correctamente.\n📅 Fecha: ${form.fecha}\n💵 Monto registrado: $${montoNum.toLocaleString('es-CL')} CLP\n🏷️ Categoría detectada: Servicios básicos (luz)\n📁 Archivo: ${form.archivo.name}`,
    )
  }

  const resetForm = () => {
    setForm({ fecha: new Date().toISOString().split('T')[0] ?? '', monto: '', archivo: null, preview: null })
    setResultado(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* ── Barra superior: título + cerrar sesión ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
            Panel de Secretaría
          </h2>
          <p className="text-stone-500 text-sm">
            Gestiona boletas, eventos y el mensaje de inicio.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-red-50 hover:border-red-300 text-stone-500 hover:text-red-600 transition-all text-sm font-medium shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>

      {/* ── Navegación de módulos (tabs) ── */}
      <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1.5 rounded-2xl">
        {MODULOS.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setModuloActivo(mod.id)}
            className={`py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-xl transition-all text-center truncate ${
              moduloActivo === mod.id
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            {mod.label}
          </button>
        ))}
      </div>

      {/* ── Módulo: Administrador de Eventos ── */}
      {moduloActivo === 'eventos' && <AdminEventos />}

      {/* ── Módulo: Editor de Mensaje de Inicio ── */}
      {moduloActivo === 'inicio' && <AdminInicio />}

      {/* ── Módulo: Carga de Boletas ── */}
      {moduloActivo === 'boletas' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-stone-800">Carga de Boletas</h3>
            <p className="text-stone-500 text-sm mt-1">
              Sube o fotografía una boleta y procésala con IA para registrarla en el sistema de rendición de cuentas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Botones de captura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 border-2 border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:text-amber-700 transition-all"
              >
                Adjuntar archivo
              </button>

              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center justify-center gap-2 border-2 border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:text-amber-700 transition-all"
              >
                Fotografiar boleta
              </button>
            </div>

            {/* Input archivo normal (oculto) */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {/* Input cámara (oculto) */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !form.archivo && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl overflow-hidden transition-colors ${
                dragging
                  ? 'border-amber-500 bg-amber-50'
                  : form.archivo
                  ? 'border-green-400 bg-green-50'
                  : 'border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50 cursor-pointer'
              }`}
            >
              {form.preview ? (
                <div className="relative">
                  <img
                    src={form.preview}
                    alt="Vista previa de la boleta"
                    className="w-full max-h-72 object-contain bg-stone-100"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1.5 px-3 flex justify-between items-center">
                    <span className="truncate max-w-[70%]">{form.archivo?.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); resetForm() }}
                      className="text-white/80 hover:text-white transition-colors shrink-0"
                    >
                      ✕ Cambiar
                    </button>
                  </div>
                </div>
              ) : form.archivo ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586" />
                  </svg>
                  <p className="text-sm font-semibold text-green-700">{form.archivo.name}</p>
                  <p className="text-xs text-stone-400">
                    {(form.archivo.size / 1024).toFixed(1)} KB —{' '}
                    <button type="button" onClick={resetForm} className="underline text-stone-400 hover:text-stone-600">
                      Cambiar
                    </button>
                  </p>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <svg className="w-10 h-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <p className="text-sm font-medium text-stone-600">
                    Arrastra una fotografía o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-stone-400">PNG, JPG, PDF — máx. 10 MB</p>
                </div>
              )}
            </div>

            {/* Campos fecha + monto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700" htmlFor="fecha">
                  Fecha de la boleta
                </label>
                <input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700" htmlFor="monto">
                  Monto (CLP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">
                    $
                  </span>
                  <input
                    id="monto"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.monto}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setForm((f) => ({ ...f, monto: raw ? formatCLP(raw) : '' }))
                    }}
                    className="w-full border border-stone-300 rounded-lg pl-7 pr-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                    required
                  />
                </div>
                <p className="text-xs text-stone-400">Ejemplo: $152.000</p>
              </div>
            </div>

            {/* Botón procesar */}
            <button
              type="submit"
              disabled={procesando || !form.archivo}
              className="w-full py-3 rounded-xl font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow"
            >
              {procesando ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Procesando con IA...
                </>
              ) : (
                'Procesar con IA'
              )}
            </button>
          </form>

          {/* Resultado */}
          {resultado && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-2">
              <p className="font-semibold text-green-800 text-sm">Resultado del procesamiento</p>
              <pre className="text-sm text-green-700 whitespace-pre-wrap font-sans leading-relaxed">
                {resultado}
              </pre>
              <button
                onClick={resetForm}
                className="text-xs text-green-600 hover:text-green-800 underline transition-colors"
              >
                Cargar otra boleta
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
