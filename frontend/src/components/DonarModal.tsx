import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { API_URL } from '../config'
import { useModalDialog } from '../hooks/useModalDialog'
import { CheckCircleIcon, ClipboardIcon, ExclamationIcon, PvmLogo, XIcon } from './icons'
import Spinner from './Spinner'

interface DonarModalProps {
  onClose: () => void
}

const DATOS_BANCARIOS: readonly (readonly [string, string])[] = [
  ['Nombre', 'Ministerio Por una Vida Mejor'],
  ['RUT', '65.123.456-7'],
  ['Banco', 'BancoEstado'],
  ['Tipo de cuenta', 'Cuenta Corriente'],
  ['N° de cuenta', '00012345678'],
  ['Asunto', 'Aporte comunitario'],
]

const DATOS_BANCO_TEXTO = DATOS_BANCARIOS.map(([label, value]) => `${label}: ${value}`).join('\n')

const MONTOS_SUGERIDOS = [2000, 5000, 10000, 20000]
const MONTO_MINIMO = 500
const URL_QR_WEBPAY = `${API_URL}/api/webpay/qr`

export default function DonarModal({ onClose }: DonarModalProps) {
  const [copiado, setCopiado] = useState(false)
  const [monto, setMonto] = useState<string>('5000')
  const [cargandoWebpay, setCargandoWebpay] = useState(false)
  const [errorWebpay, setErrorWebpay] = useState<string | null>(null)
  const copiadoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useModalDialog(onClose, cargandoWebpay)

  useEffect(
    () => () => {
      if (copiadoTimerRef.current) clearTimeout(copiadoTimerRef.current)
    },
    [],
  )

  const marcarCopiado = () => {
    setCopiado(true)
    if (copiadoTimerRef.current) clearTimeout(copiadoTimerRef.current)
    copiadoTimerRef.current = setTimeout(() => setCopiado(false), 2500)
  }

  const copiarDatos = async () => {
    try {
      await navigator.clipboard.writeText(DATOS_BANCO_TEXTO)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = DATOS_BANCO_TEXTO
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    marcarCopiado()
  }

  const iniciarPagoWebpay = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorWebpay(null)

    const montoNumerico = Math.round(Number(monto))
    if (!montoNumerico || montoNumerico < MONTO_MINIMO) {
      setErrorWebpay(`Ingresa un monto válido (mínimo $${MONTO_MINIMO}).`)
      return
    }

    try {
      setCargandoWebpay(true)
      const res = await fetch(`${API_URL}/api/webpay/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: montoNumerico }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo conectar con Webpay.')
      }

      // Redirección obligatoria vía POST con token_ws hacia Transbank
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.url

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'token_ws'
      input.value = data.token

      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      setErrorWebpay(err instanceof Error ? err.message : 'Error al iniciar Webpay.')
      setCargandoWebpay(false)
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !cargandoWebpay) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="donar-modal-title"
        className="modal max-h-[92vh] overflow-y-auto rounded-t-3xl sm:max-w-md sm:rounded-2xl"
      >
        {/* Encabezado negro con logo PVM */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-zinc-950 px-6 py-5">
          <div className="flex items-center gap-3">
            <PvmLogo size="sm" invertRing />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                Iglesia de Dios · PVM
              </p>
              <h2 id="donar-modal-title" className="mt-0.5 text-lg font-extrabold text-white">
                Donar / Aporte Comunitario
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={cargandoWebpay}
            className="-mr-1 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            aria-label="Cerrar ventana de donación"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {/* Sección 1: Donación online con Webpay */}
          <form
            onSubmit={iniciarPagoWebpay}
            className="space-y-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
            noValidate
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-900">
                Donación rápida con Webpay
              </p>
              <span className="badge border-zinc-300 bg-white text-zinc-800">Modo Prueba</span>
            </div>

            {/* Botones de montos rápidos */}
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Montos sugeridos">
              {MONTOS_SUGERIDOS.map((sugerido) => {
                const seleccionado = Number(monto) === sugerido
                return (
                  <button
                    key={sugerido}
                    type="button"
                    aria-pressed={seleccionado}
                    onClick={() => {
                      setMonto(String(sugerido))
                      setErrorWebpay(null)
                    }}
                    className={`rounded-xl border py-2 text-xs font-semibold tabular-nums transition-all active:scale-[0.98] ${
                      seleccionado
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                        : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-900'
                    }`}
                  >
                    ${sugerido.toLocaleString('es-CL')}
                  </button>
                )
              })}
            </div>

            {/* Input de monto personalizado */}
            <div>
              <label htmlFor="monto-donacion" className="sr-only">
                Monto de donación en pesos chilenos (mínimo ${MONTO_MINIMO})
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500"
                >
                  $
                </span>
                <input
                  id="monto-donacion"
                  type="number"
                  min={MONTO_MINIMO}
                  step={100}
                  value={monto}
                  onChange={(e) => {
                    setMonto(e.target.value)
                    setErrorWebpay(null)
                  }}
                  placeholder="Otro monto (CLP)"
                  aria-invalid={Boolean(errorWebpay)}
                  aria-describedby={errorWebpay ? 'error-webpay' : undefined}
                  className={`input pl-8 font-semibold tabular-nums ${errorWebpay ? 'input-error' : ''}`}
                />
              </div>
            </div>

            {errorWebpay && (
              <p
                id="error-webpay"
                role="alert"
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900"
              >
                <ExclamationIcon className="h-4 w-4 shrink-0" />
                {errorWebpay}
              </p>
            )}

            <button type="submit" disabled={cargandoWebpay} className="btn btn-primary w-full py-3">
              {cargandoWebpay ? (
                <>
                  <Spinner />
                  Conectando con Transbank...
                </>
              ) : (
                'Donar con Webpay (Débito / Crédito)'
              )}
            </button>
          </form>

          {/* Sección 2: QR real para abrir en el celular */}
          <div className="flex flex-col items-center gap-2.5 pt-1">
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-card">
              <QRCodeSVG
                value={URL_QR_WEBPAY}
                size={148}
                level="H"
                fgColor="#09090b"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-center text-xs text-zinc-500">
              Escanea con tu celular para abrir esta ventana y donar
            </p>
          </div>

          {/* Sección 3: Datos bancarios para transferencia directa */}
          <div className="panel space-y-2.5 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-600">
              O transfiere directo (sin comisión)
            </p>
            {DATOS_BANCARIOS.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-sm">
                <span className="shrink-0 text-zinc-500">{label}</span>
                <span className="text-right font-semibold text-zinc-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Botón copiar */}
          <button
            type="button"
            onClick={copiarDatos}
            className={`btn w-full py-3 ${copiado ? 'btn-secondary border-zinc-950' : 'btn-primary'}`}
          >
            {copiado ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Datos copiados al portapapeles
              </>
            ) : (
              <>
                <ClipboardIcon className="h-4 w-4" />
                Copiar datos bancarios
              </>
            )}
          </button>

          <p className="text-center text-xs text-zinc-500">
            Gracias por tu generosidad. Cada aporte fortalece nuestra comunidad.
          </p>
        </div>
      </div>
    </div>
  )
}
