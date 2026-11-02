import { useRef, useState } from 'react'
import AdminEventos from './AdminEventos'
import AdminInicio from './AdminInicio'

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

type ModuloSecretaria = 'boletas' | 'eventos' | 'inicio'

const MODULOS: { id: ModuloSecretaria; label: string }[] = [
  { id: 'boletas', label: 'Boletas' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'inicio', label: 'Mensaje Pastoral' },
]

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
  const [moduloActivo, setModuloActivo] = useState<ModuloSecretaria>('boletas')
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
    limpiarResultados()

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

  // Paso 1: escanear y procesar la boleta con backend
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
          `Boleta escaneada y procesada correctamente:\n\n` +
          `Fecha: ${data.analisis.fecha}\n` +
          `Razón: ${data.analisis.razon}\n` +
          `Monto: $${data.analisis.monto}`
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
        setResultado(`Error procesando imagen: ${data.error}`)
      }
    } catch (error) {
      console.error('Error al conectar con la API OCR:', error)
      setResultado('Error de conexión: No se pudo contactar al backend.')
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
        setEstadoSubida({ ok: true, msg: 'Gasto guardado en la hoja de cálculo con éxito.' })
      } else {
        setEstadoSubida({ ok: false, msg: `No se pudo guardar: ${data.error}` })
      }
    } catch (error) {
      console.error('Error al subir el gasto:', error)
      setEstadoSubida({ ok: false, msg: 'Error de conexión: No se pudo contactar al backend.' })
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* ── Barra superior: título + cerrar sesión ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
            Panel de Secretaría
          </h2>
          <p className="text-stone-500 text-sm">
            Gestiona boletas, eventos y el mensaje pastoral.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-red-50 hover:border-red-300 text-stone-500 hover:text-red-600 transition-all text-sm font-medium shrink-0"
        >
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
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586" />
                  </svg>
                  <p className="text-sm font-semibold text-green-700">{form.archivo.name}</p>
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

            <button
              type="submit"
              disabled={procesando || !form.archivo}
              className="w-full py-3 rounded-xl font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 transition-colors flex justify-center items-center"
            >
              {procesando ? 'Procesando con OCR...' : 'Procesar con OCR'}
            </button>
          </form>

          {/* Resultados Visuales */}
          {resultado && (
            <div className="space-y-4">
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
                    {subiendo ? 'Subiendo...' : yaSubido ? 'Subido con éxito' : 'Subir a la hoja de cálculo'}
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
                      Copiar
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
      )}
    </div>
  )
}
