import { useRef, useState } from 'react'
import { API_URL } from '../config'
import { CATEGORIAS_GASTO } from '../types/finanzas'
import { fechaAInput, inputAFecha, soloDigitos } from '../utils/format'
import {
  CameraIcon,
  CheckCircleIcon,
  DocumentIcon,
  ExclamationIcon,
  PaperClipIcon,
  XIcon,
} from './icons'
import Spinner from './Spinner'

interface CargaBoletasProps {
  token: string
}

interface ArchivoSeleccionado {
  archivo: File | null
  preview: string | null
}

/** Datos que devuelve la IA, editables antes de subirlos. */
interface DatosBoleta {
  gasto: string
  /** Formato del `<input type="date">`: YYYY-MM-DD */
  fecha: string
  razon: string
  /** Solo dígitos: 175000 */
  monto: string
}

interface AnalisisBoleta {
  gasto?: string
  fecha?: string
  razon?: string
  monto?: string | number
}

interface RespuestaOcr {
  success: boolean
  error?: string
  analisis?: AnalisisBoleta
}

interface RespuestaGuardado {
  success: boolean
  error?: string
}

interface ResultadoOcr {
  ok: boolean
  texto: string
}

const categoriasValidas: readonly string[] = CATEGORIAS_GASTO

export default function CargaBoletas({ token }: CargaBoletasProps) {
  const [seleccion, setSeleccion] = useState<ArchivoSeleccionado>({ archivo: null, preview: null })
  const [dragging, setDragging] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoOcr | null>(null)

  // Valores obtenidos por la IA, editables para confirmar
  const [datos, setDatos] = useState<DatosBoleta | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [estadoSubida, setEstadoSubida] = useState<{ ok: boolean; msg: string } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const limpiarResultados = () => {
    setResultado(null)
    setDatos(null)
    setEstadoSubida(null)
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    limpiarResultados()

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSeleccion({ archivo: file, preview: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      setSeleccion({ archivo: file, preview: null })
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  // Paso 1: escanear y procesar la boleta con backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seleccion.archivo) return
    setProcesando(true)
    limpiarResultados()

    try {
      const formData = new FormData()
      formData.append('image', seleccion.archivo)

      const response = await fetch(`${API_URL}/api/ocr`, { method: 'POST', body: formData })
      const data: RespuestaOcr = await response.json()

      if (data.success && data.analisis) {
        const { analisis } = data
        setResultado({
          ok: true,
          texto:
            `Boleta escaneada y procesada correctamente:\n\n` +
            `Fecha: ${analisis.fecha}\n` +
            `Razón: ${analisis.razon}\n` +
            `Monto: $${analisis.monto}`,
        })
        // Valores iniciales del formulario de confirmación
        const razon = String(analisis.razon ?? '')
        setDatos({
          gasto: categoriasValidas.includes(analisis.gasto ?? '')
            ? (analisis.gasto ?? 'Otros')
            : 'Otros',
          fecha: fechaAInput(analisis.fecha),
          razon: razon === 'No detectado' ? '' : razon,
          monto: soloDigitos(String(analisis.monto ?? '')),
        })
      } else {
        setResultado({ ok: false, texto: `Error procesando imagen: ${data.error}` })
      }
    } catch {
      setResultado({ ok: false, texto: 'Error de conexión: No se pudo contactar al backend.' })
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          gasto: datos.gasto,
          fecha: inputAFecha(datos.fecha),
          razon: datos.razon.trim(),
          monto: datos.monto,
        }),
      })
      const data: RespuestaGuardado = await response.json()

      setEstadoSubida(
        data.success
          ? { ok: true, msg: 'Gasto guardado en la hoja de cálculo con éxito.' }
          : { ok: false, msg: `No se pudo guardar: ${data.error}` },
      )
    } catch {
      setEstadoSubida({ ok: false, msg: 'Error de conexión: No se pudo contactar al backend.' })
    } finally {
      setSubiendo(false)
    }
  }

  const resetForm = () => {
    setSeleccion({ archivo: null, preview: null })
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
    limpiarResultados()
  }

  const yaSubido = estadoSubida?.ok === true
  const puedeSubir =
    !!datos && !!datos.fecha && !!datos.razon.trim() && !!datos.monto && !subiendo && !yaSubido

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="section-title text-xl">Carga de Boletas</h3>
        <p className="muted mt-1">
          Sube o fotografía una boleta y procésala con IA para registrarla en el sistema de
          rendición de cuentas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {/* Botones de captura */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn btn-secondary py-3 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
          >
            <PaperClipIcon className="h-4 w-4" />
            Adjuntar archivo
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="btn btn-secondary py-3 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
          >
            <CameraIcon className="h-4 w-4" />
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
          role={seleccion.archivo ? undefined : 'button'}
          tabIndex={seleccion.archivo ? undefined : 0}
          aria-label={seleccion.archivo ? undefined : 'Seleccionar o arrastrar una fotografía de boleta'}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !seleccion.archivo && fileRef.current?.click()}
          onKeyDown={(e) => {
            if (!seleccion.archivo && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              fileRef.current?.click()
            }
          }}
          className={`overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
            dragging
              ? 'border-zinc-950 bg-zinc-100'
              : seleccion.archivo
                ? 'border-zinc-950 bg-zinc-50'
                : 'cursor-pointer border-zinc-300 bg-zinc-50 hover:border-zinc-900 hover:bg-zinc-100/60'
          }`}
        >
          {seleccion.preview ? (
            <div className="relative">
              <img
                src={seleccion.preview}
                alt="Vista previa de la boleta"
                className="max-h-72 w-full bg-zinc-100 object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-zinc-950/85 px-3.5 py-2 text-xs text-white backdrop-blur-xs">
                <span className="truncate">{seleccion.archivo?.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    resetForm()
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Cambiar
                </button>
              </div>
            </div>
          ) : seleccion.archivo ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                <DocumentIcon className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-zinc-900">{seleccion.archivo.name}</p>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary btn-sm"
              >
                <XIcon className="h-3.5 w-3.5" />
                Cambiar archivo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-card">
                <CameraIcon className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-zinc-800">
                Arrastra una fotografía o haz clic para seleccionar
              </p>
              <p className="text-xs text-zinc-500">PNG, JPG, PDF — máx. 10 MB</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={procesando || !seleccion.archivo}
          className="btn btn-primary btn-lg w-full"
        >
          {procesando ? (
            <>
              <Spinner />
              Procesando con OCR...
            </>
          ) : (
            'Procesar con OCR'
          )}
        </button>
      </form>

      {/* Resultados visuales */}
      {resultado && (
        <div className="animate-fade-in space-y-5">
          <div
            role={resultado.ok ? 'status' : 'alert'}
            className={`alert flex-col gap-3 p-5 ${resultado.ok ? 'alert-success' : 'alert-error'}`}
          >
            <div className="flex items-start gap-3">
              {resultado.ok ? (
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <ExclamationIcon className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-bold">
                  {resultado.ok ? 'Lectura completada' : 'No se pudo procesar la boleta'}
                </p>
                <pre className="whitespace-pre-wrap font-sans text-sm font-normal">
                  {resultado.texto}
                </pre>
              </div>
            </div>
            <div className="pl-8">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold underline underline-offset-2 hover:opacity-80"
              >
                Cargar otra boleta
              </button>
            </div>
          </div>

          {/* Confirmación: valores obtenidos, editables, y botón para subir */}
          {datos && (
            <div className="card space-y-5 p-6">
              <div>
                <h4 className="section-title text-base">Confirma los datos antes de subir</h4>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Revisa los valores detectados y corrígelos si hace falta.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="boleta-fecha" className="label">
                    Fecha
                  </label>
                  <input
                    id="boleta-fecha"
                    type="date"
                    value={datos.fecha}
                    onChange={(e) => setDato('fecha', e.target.value)}
                    disabled={yaSubido}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="boleta-monto" className="label">
                    Monto (CLP)
                  </label>
                  <input
                    id="boleta-monto"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={datos.monto}
                    onChange={(e) => setDato('monto', soloDigitos(e.target.value))}
                    disabled={yaSubido}
                    className="input tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="boleta-razon" className="label">
                    Razón (comercio o motivo)
                  </label>
                  <input
                    id="boleta-razon"
                    type="text"
                    placeholder="Nombre del comercio o motivo"
                    value={datos.razon}
                    onChange={(e) => setDato('razon', e.target.value)}
                    disabled={yaSubido}
                    className="input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="boleta-gasto" className="label">
                    Gasto (categoría)
                  </label>
                  <select
                    id="boleta-gasto"
                    value={datos.gasto}
                    onChange={(e) => setDato('gasto', e.target.value)}
                    disabled={yaSubido}
                    className="input"
                  >
                    {CATEGORIAS_GASTO.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubirHoja}
                disabled={!puedeSubir}
                className="btn btn-primary btn-lg w-full"
              >
                {subiendo ? (
                  <>
                    <Spinner />
                    Subiendo...
                  </>
                ) : yaSubido ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Subido con éxito
                  </>
                ) : (
                  'Subir a la hoja de cálculo'
                )}
              </button>

              {estadoSubida && (
                <div
                  role={estadoSubida.ok ? 'status' : 'alert'}
                  className={`alert ${estadoSubida.ok ? 'alert-success' : 'alert-error'}`}
                >
                  {estadoSubida.ok ? (
                    <CheckCircleIcon className="h-5 w-5 shrink-0" />
                  ) : (
                    <ExclamationIcon className="h-5 w-5 shrink-0" />
                  )}
                  <span>{estadoSubida.msg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
