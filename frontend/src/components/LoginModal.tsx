import { useState } from 'react'

// Contraseña genérica — en producción usar autenticación real
const PASS_CORRECTA = 'admin123'

interface LoginModalProps {
  onSuccess: () => void
  onClose: () => void
}

export default function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [password, setPassword] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(false)

    // Pequeña pausa para simular verificación y evitar fuerza bruta inmediata
    await new Promise((r) => setTimeout(r, 600))

    if (password === PASS_CORRECTA) {
      setCargando(false)
      onSuccess()
    } else {
      setCargando(false)
      setError(true)
      setPassword('')
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-stone-800 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Ícono candado */}
            <div className="w-9 h-9 rounded-xl bg-stone-700 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest leading-none mb-0.5">Panel Admin</p>
              <h2 className="text-white font-bold text-base leading-none">Acceso Secretaría</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-2 -mr-1 rounded-lg hover:bg-stone-700"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <p className="text-sm text-stone-500">
            Ingresa la contraseña para acceder al panel de secretaría del ministerio.
          </p>

          {/* Campo contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={mostrar ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false) }}
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
                className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm text-stone-800 focus:outline-none focus:ring-2 transition ${
                  error
                    ? 'border-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-stone-300 bg-stone-50 focus:ring-amber-500 focus:border-transparent'
                }`}
                required
              />
              {/* Mostrar / ocultar */}
              <button
                type="button"
                onClick={() => setMostrar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrar ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mensaje de error */}
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 font-medium mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Contraseña incorrecta. Intente nuevamente.
              </p>
            )}
          </div>

          {/* Botón ingresar */}
          <button
            type="submit"
            disabled={cargando || password.length === 0}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {cargando ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verificando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Ingresar
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-400">
            Acceso exclusivo para personal autorizado del ministerio.
          </p>
        </form>
      </div>
    </div>
  )
}
