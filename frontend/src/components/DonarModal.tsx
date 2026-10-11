import { useState } from 'react'

interface DonarModalProps {
  onClose: () => void
}

const DATOS_BANCO = `Nombre: Ministerio Por una Vida Mejor
RUT: 65.123.456-7
Banco: BancoEstado
Tipo de cuenta: Cuenta Corriente
N° de cuenta: 00012345678
Asunto: Aporte comunitario`

export default function DonarModal({ onClose }: DonarModalProps) {
  const [copiado, setCopiado] = useState(false)

  const copiarDatos = async () => {
    try {
      await navigator.clipboard.writeText(DATOS_BANCO)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Fallback para navegadores sin permiso
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

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-amber-700 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-amber-200 text-xs font-semibold uppercase tracking-widest">Ministerio PVM</p>
            <h2 className="text-white font-bold text-xl mt-0.5">💛 Donar / Aporte Comunitario</h2>
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

          {/* QR placeholder */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-44 h-44 border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center bg-stone-50 gap-2">
              {/* QR simulado con patrón de puntos */}
              <svg viewBox="0 0 100 100" className="w-36 h-36 text-stone-700">
                {/* Esquinas del QR */}
                <rect x="5" y="5" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="6"/>
                <rect x="12" y="12" width="16" height="16" rx="1" fill="currentColor"/>
                <rect x="65" y="5" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="6"/>
                <rect x="72" y="12" width="16" height="16" rx="1" fill="currentColor"/>
                <rect x="5" y="65" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="6"/>
                <rect x="12" y="72" width="16" height="16" rx="1" fill="currentColor"/>
                {/* Puntos internos simulados */}
                <rect x="40" y="10" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="50" y="10" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="40" y="20" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="10" y="40" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="20" y="50" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="40" y="40" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="50" y="40" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="60" y="40" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="40" y="50" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="60" y="50" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="40" y="60" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="50" y="60" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="75" y="40" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="85" y="50" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="75" y="60" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="40" y="75" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="50" y="85" width="6" height="6" rx="1" fill="currentColor"/>
                <rect x="60" y="75" width="6" height="6" rx="1" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-xs text-stone-400 text-center">
              Escanea para transferir<br />
              <span className="text-amber-600 font-medium">(QR de demostración — se actualizará con el real)</span>
            </p>
          </div>

          {/* Datos bancarios */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Datos para transferencia</p>
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
            onClick={copiarDatos}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              copiado
                ? 'bg-green-600 text-white'
                : 'bg-amber-700 hover:bg-amber-800 text-white'
            }`}
          >
            {copiado ? '✅ ¡Datos copiados!' : '📋 Copiar datos bancarios'}
          </button>

          <p className="text-center text-xs text-stone-400">
            ¡Gracias por tu generosidad! Cada aporte fortalece nuestra comunidad. 🙏
          </p>
        </div>
      </div>
    </div>
  )
}
