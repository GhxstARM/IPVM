import { useRef, useState } from 'react'

const API_URL = 'http://localhost:3000'

const CATEGORIAS = [
  'Alimentación',
  'Transporte',
  'Salud',
  'Servicios básicos',
  'Hogar',
  'Entretenimiento',
  'Educación',
  'Trabajo',
  'Otros',
]

interface SubidaBoletasProps {
  onLogout: () => void
}

interface FormState {
  archivo: File | null
  preview: string | null
}

// Datos que devuelve la IA, editables antes de subirlos
interface DatosBoleta {
  gasto: string
  fecha: string // formato del <input type="date">: YYYY-MM-DD
  razon: string
  monto: string // formateado para mostrar: 175.000
}

// Deja solo los dígitos: "175.000" -> "175000"
const soloDigitos = (val: string) => val.replace(/\D/g, '')

// "01-10-2021" -> "2021-10-01" (lo que necesita <input type="date">)
const fechaAInput = (val: unknown): string => {
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(String(val ?? '').trim())
  if (!m) return ''
  return `${m[3]}-${(m[2] ?? '').padStart(2, '0')}-${(m[1] ?? '').padStart(2, '0')}`
}

// "2021-10-01" -> "01-10-2021" (lo que espera el backend / Google Sheets)
const inputAFecha = (val: string): string => {
  const [y, m, d] = val.split('-')
  return y && m && d ? `${d}-${m}-${y}` : val
}

export default function SubidaBoletas({ onLogout }: SubidaBoletasProps) {
  const [form, setForm] = useState<FormState>({ archivo: null, preview: null })
  const [dragging, setDragging] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  // Texto crudo del OCR (Testing)
  const [ocrText, setOcrText] = useState<string | null>(null)

  // Valores obtenidos por la IA, editables para confirmar
  const [datos, setDatos] = useState<DatosBoleta | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [estadoSubida, setEstadoSubida] = useState<{ ok: boolean; msg: string } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const limpiarResultados = () => {
    setResultado(null)
    setOcrText(null)
    setDatos(null)
    setEstadoSubida(null)
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    limpiarResultados() // Limpiamos todo al cambiar de archivo

    // Generar preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setForm({ archivo: file, preview: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      setForm({ archivo: file, preview: null })
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  // Paso 1: escanear y procesar la boleta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.archivo) return
    setProcesando(true)
    limpiarResultados()

    try {
      const formData = new FormData()
      formData.append('image', form.archivo)

      const response = await fetch(`${API_URL}/api/ocr`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResultado(
          `✅ Boleta escaneada y procesada por Grok:\n\n` +
          `📅 Fecha: ${data.analisis.fecha}\n` +
          `🛒 Razón: ${data.analisis.razon}\n` +
          `💵 Monto: $${data.analisis.monto}`
        )
        setOcrText(data.text)

        // Valores iniciales del formulario de confirmación
        const razon = String(data.analisis.razon ?? '')
        setDatos({
          gasto: CATEGORIAS.includes(data.analisis.gasto) ? data.analisis.gasto : 'Otros',
          fecha: fechaAInput(data.analisis.fecha),
          razon: razon === 'No detectado' ? '' : razon,
          monto: soloDigitos(String(data.analisis.monto ?? '')),
        })
      } else {
        setResultado(`❌ Error procesando imagen: ${data.error}`)
      }
    } catch (error) {
      console.error('Error al conectar con la API OCR:', error)
      setResultado('❌ Error de conexión: No se pudo contactar al backend.')
    } finally {
      setProcesando(false)
    }
  }

  const setDato = (campo: keyof DatosBoleta, valor: string) => {
    setDatos((d) => (d ? { ...d, [campo]: valor } : d))
  }

  // Paso 2: subir los datos confirmados a la hoja de cálculo
  const handleSubirHoja = async () => {
    if (!datos) return
    setSubiendo(true)
    setEstadoSubida(null)

    try {
      const response = await fetch(`${API_URL}/api/gastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasto: datos.gasto,
          fecha: inputAFecha(datos.fecha),
          razon: datos.razon.trim(),
          monto: datos.monto,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEstadoSubida({ ok: true, msg: '✅ Gasto guardado en la hoja de cálculo.' })
      } else {
        setEstadoSubida({ ok: false, msg: `❌ No se pudo guardar: ${data.error}` })
      }
    } catch (error) {
      console.error('Error al subir el gasto:', error)
      setEstadoSubida({ ok: false, msg: '❌ Error de conexión: No se pudo contactar al backend.' })
    } finally {
      setSubiendo(false)
    }
  }

  const resetForm = () => {
    setForm({ archivo: null, preview: null })
    limpiarResultados()
  }

  const yaSubido = estadoSubida?.ok === true
  const puedeSubir =
    !!datos && !!datos.fecha && !!datos.razon.trim() && !!datos.monto && !subiendo && !yaSubido

  const inputClass =
    'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 disabled:bg-stone-100 disabled:text-stone-500'

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
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-red-50 hover:border-red-300 text-stone-500 hover:text-red-600 transition-all text-sm font-medium group shrink-0"
        >
          Cerrar Sesión
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Botones de captura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:text-amber-700 transition-all"
          >
            📁 Adjuntar archivo
          </button>

          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:text-amber-700 transition-all"
          >
            📷 Tomar foto
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
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
                alt="Vista previa"
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
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
              <span className="text-4xl text-stone-300">📷</span>
              <p className="text-sm font-medium text-stone-600">
                Arrastra una fotografía o haz clic
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={procesando || !form.archivo}
          className="w-full py-3 rounded-xl font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 transition-colors flex justify-center items-center"
        >
          {procesando ? 'Procesando con OCR...' : '🤖 Procesar con OCR'}
        </button>
      </form>

      {/* Resultados Visuales */}
      {resultado && (
        <div className="space-y-4">
          {/* Mensaje de éxito de la carga */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="font-semibold text-green-800 text-sm mb-2">Resultado</p>
            <pre className="text-sm text-green-700 whitespace-pre-wrap font-sans mb-3">
              {resultado}
            </pre>
            <button onClick={resetForm} className="text-xs text-green-600 underline">
              Cargar otra boleta
            </button>
          </div>

          {/* Confirmación: valores obtenidos, editables, y botón para subir */}
          {datos && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div>
                <p className="font-semibold text-stone-800 text-sm">Confirma los datos antes de subir</p>
                <p className="text-xs text-stone-500">
                  Revisa los valores detectados y corrígelos si hace falta.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">Fecha</label>
                  <input
                    type="date"
                    value={datos.fecha}
                    onChange={(e) => setDato('fecha', e.target.value)}
                    disabled={yaSubido}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">Monto (CLP)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={datos.monto}
                    onChange={(e) => setDato('monto', soloDigitos(e.target.value))}
                    disabled={yaSubido}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-stone-700">Razón (comercio o motivo)</label>
                  <input
                    type="text"
                    placeholder="Nombre del comercio o motivo"
                    value={datos.razon}
                    onChange={(e) => setDato('razon', e.target.value)}
                    disabled={yaSubido}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-stone-700">Gasto (categoría)</label>
                  <select
                    value={datos.gasto}
                    onChange={(e) => setDato('gasto', e.target.value)}
                    disabled={yaSubido}
                    className={inputClass}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubirHoja}
                disabled={!puedeSubir}
                className="w-full py-3 rounded-xl font-semibold text-white bg-green-700 hover:bg-green-800 disabled:opacity-50 transition-colors flex justify-center items-center"
              >
                {subiendo ? 'Subiendo...' : yaSubido ? 'Subido ✓' : '📤 Subir a la hoja de cálculo'}
              </button>

              {estadoSubida && (
                <p className={`text-sm ${estadoSubida.ok ? 'text-green-700' : 'text-red-600'}`}>
                  {estadoSubida.msg}
                </p>
              )}
            </div>
          )}

          {/* Caja de Testing para el texto crudo del OCR */}
          {ocrText && (
            <div className="bg-stone-900 rounded-xl p-4 shadow-inner border border-stone-800">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  RAW OCR DATA (MODO TEST)
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(ocrText)}
                  className="text-xs text-stone-400 hover:text-white transition-colors"
                >
                  📋 Copiar
                </button>
              </div>
              <textarea
                readOnly
                className="w-full h-48 bg-stone-950/50 text-stone-300 font-mono text-sm p-3 rounded-lg focus:outline-none resize-y border border-stone-700/50"
                value={ocrText || 'No se detectó texto.'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}