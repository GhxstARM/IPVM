import { useRef, useState } from 'react'

interface FormState {
  fecha: string
  monto: string
  archivo: File | null
}

export default function SubidaBoletas() {
  const [form, setForm] = useState<FormState>({
    fecha: new Date().toISOString().split('T')[0] ?? '',
    monto: '',
    archivo: null,
  })
  const [dragging, setDragging] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setForm((f) => ({ ...f, archivo: file }))
    setResultado(null)
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

    // Simulación de procesamiento con IA
    await new Promise((r) => setTimeout(r, 2200))

    const montoNum = parseInt(form.monto.replace(/\D/g, ''), 10)
    setProcesando(false)
    setResultado(
      `✅ Boleta procesada correctamente.\n📅 Fecha: ${form.fecha}\n💵 Monto registrado: $${montoNum.toLocaleString('es-CL')} CLP\n🏷️ Categoría detectada: Servicios básicos (luz)\n📁 Archivo: ${form.archivo.name}`,
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          🗂️ Secretaría — Carga de Boletas
        </h2>
        <p className="text-stone-500 text-sm">
          Sube la fotografía o escaneo de una boleta y procésala con IA para registrarla en el sistema de rendición de cuentas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
            dragging
              ? 'border-amber-500 bg-amber-50'
              : form.archivo
              ? 'border-green-400 bg-green-50'
              : 'border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {form.archivo ? (
            <>
              <span className="text-4xl">📄</span>
              <p className="text-sm font-semibold text-green-700">{form.archivo.name}</p>
              <p className="text-xs text-stone-400">
                {(form.archivo.size / 1024).toFixed(1)} KB — Haz clic para cambiar
              </p>
            </>
          ) : (
            <>
              <span className="text-4xl text-stone-300">📷</span>
              <p className="text-sm font-medium text-stone-600">
                Arrastra una fotografía o haz clic para seleccionar
              </p>
              <p className="text-xs text-stone-400">PNG, JPG, PDF — máx. 10 MB</p>
            </>
          )}
        </div>

        {/* Campos */}
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

        {/* Botón */}
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
            onClick={() => {
              setForm({ fecha: new Date().toISOString().split('T')[0] ?? '', monto: '', archivo: null })
              setResultado(null)
            }}
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
          Esta sección es exclusiva para el personal de secretaría parroquial. Los antecedentes cargados son procesados mediante inteligencia artificial para su clasificación y registro en el sistema de rendición de cuentas.
        </p>
      </div>
    </div>
  )
}
