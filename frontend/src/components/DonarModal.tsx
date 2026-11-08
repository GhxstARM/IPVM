import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface DonarModalProps {
  onClose: () => void
}

const API_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`

const DATOS_BANCO = `Nombre: Ministerio Por una Vida Mejor
RUT: 65.123.456-7
Banco: BancoEstado
Tipo de cuenta: Cuenta Corriente
N° de cuenta: 00012345678
Asunto: Aporte comunitario`

const MONTOS_SUGERIDOS = [2000, 5000, 10000, 20000]

export default function DonarModal({ onClose }: DonarModalProps) {
  const [copiado, setCopiado] = useState(false)
  const [monto, setMonto] = useState<string>('5000')
  const [cargandoWebpay, setCargandoWebpay] = useState(false)
  const [errorWebpay, setErrorWebpay] = useState<string | null>(null)

  // URL dinámica: abre automáticamente este modal al escanear el QR desde el celular
  const montoValido = Math.round(Number(monto)) >= 500 ? Math.round(Number(monto)) : 5000
  const urlQrWebpay = `${API_URL}/api/webpay/qr`

  const copiarDatos = async () => {
    try {
      await navigator.clipboard.writeText(DATOS_BANCO)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = DATOS_BANCO
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  const iniciarPagoWebpay = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorWebpay(null)

    const montoNumerico = Math.round(Number(monto))
    if (!montoNumerico || montoNumerico < 500) {
      setErrorWebpay('Ingresa un monto válido (mínimo $500).')
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="bg-amber-700 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-amber-200 text-xs font-semibold uppercase tracking-widest">Ministerio PVM</p>
            <h2 className="text-white font-bold text-xl mt-0.5">Donar / Aporte Comunitario</h2>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white transition-colors p-1"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">

          {/* Sección 1: Donación online con Webpay */}
          <form onSubmit={iniciarPagoWebpay} className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800">
                Donación rápida con Webpay
              </p>
              <span className="text-[11px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-medium">
                Modo Prueba
              </span>
            </div>

            {/* Botones de montos rápidos */}
            <div className="grid grid-cols-4 gap-2">
              {MONTOS_SUGERIDOS.map((sugerido) => (
                <button
                  key={sugerido}
                  type="button"
                  onClick={() => setMonto(String(sugerido))}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    Number(monto) === sugerido
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-amber-500'
                  }`}
                >
                  ${sugerido.toLocaleString('es-CL')}
                </button>
              ))}
            </div>

            {/* Input de monto personalizado */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">$</span>
              <input
                type="number"
                min={500}
                step={100}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Otro monto (CLP)"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {errorWebpay && (
              <p className="text-xs text-red-600 font-medium">{errorWebpay}</p>
            )}

            <button
              type="submit"
              disabled={cargandoWebpay}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {cargandoWebpay ? 'Conectando con Transbank...' : 'Donar con Webpay (Débito / Crédito)'}
            </button>
          </form>

          {/* Sección 2: QR real para abrir en el celular */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="p-3 border border-stone-200 rounded-2xl bg-white shadow-sm">
              <QRCodeSVG
                value={urlQrWebpay}
                size={148}
                level="H"
                fgColor="#292524"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-xs text-stone-500 text-center">
              Escanea con tu celular para abrir esta ventana y donar
            </p>
          </div>

          {/* Sección 3: Datos bancarios para transferencia directa */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
              O transfiere directo (sin comisión)
            </p>
            {[
              ['Nombre', 'Ministerio Por una Vida Mejor'],
              ['RUT', '65.123.456-7'],
              ['Banco', 'BancoEstado'],
              ['Tipo de cuenta', 'Cuenta Corriente'],
              ['N° de cuenta', '00012345678'],
              ['Asunto', 'Aporte comunitario'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm gap-4">
                <span className="text-stone-400 shrink-0">{label}</span>
                <span className="font-semibold text-stone-700 text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Botón copiar */}
          <button
            type="button"
            onClick={copiarDatos}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              copiado
                ? 'bg-green-600 text-white'
                : 'bg-amber-700 hover:bg-amber-800 text-white'
            }`}
          >
            {copiado ? 'Datos copiados al portapapeles' : 'Copiar datos bancarios'}
          </button>

          <p className="text-center text-xs text-stone-400">
            Gracias por tu generosidad. Cada aporte fortalece nuestra comunidad.
          </p>
        </div>
      </div>
    </div>
  )
}