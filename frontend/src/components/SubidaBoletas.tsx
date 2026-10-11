import { useRef, useState } from 'react'

interface SubidaBoletasProps {
  onLogout: () => void
}

interface FormState {
  fecha: string
  monto: string
  archivo: File | null
  preview: string | null
}

export default function SubidaBoletas({ onLogout }: SubidaBoletasProps) {
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

    // Generar preview si es imagen
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Barra de sesión activa */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
            🗂️ Secretaría — Carga de Boletas
          </h2>
          <p className="text-stone-500 text-sm">
            Sube o fotografía una boleta y procésala con IA para registrarla en el sistema de rendición de cuentas.
          </p>
        </div>
        {/* Botón cerrar sesión */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-red-50 hover:border-red-300 text-stone-500 hover:text-red-600 transition-all text-sm font-medium group shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Botones de captura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Adjuntar archivo */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:text-amber-700 transition-all"
          >
            📁 Adjuntar archivo
          </button>

          {/* Tomar foto con cámara */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:text-amber-700 transition-all"
          >
            📷 Tomar foto con cámara
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
          {/* Preview de imagen */}
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
              <span className="text-4xl">📄</span>
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
              <span className="text-4xl text-stone-300">📷</span>
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
            '🤖 Procesar con IA'
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

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">ℹ️ Acceso restringido</p>
        <p className="text-xs text-amber-700">
          Esta sección es exclusiva para el personal de secretaría del ministerio. Los antecedentes cargados son procesados mediante inteligencia artificial para su clasificación y registro en el sistema de rendición de cuentas.
        </p>
      </div>
    </div>
  )
}
