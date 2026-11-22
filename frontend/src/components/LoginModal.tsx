import { useState } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'
import { loginSecretaria } from '../services/secretariaService'
import { extraerMensaje } from '../utils/errors'
import { ExclamationIcon, EyeIcon, EyeOffIcon, LockIcon, LoginIcon, XIcon } from './icons'
import Spinner from './Spinner'

interface LoginModalProps {
  onSuccess: (token: string) => void
  onClose: () => void
}

export default function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [password, setPassword] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useModalDialog(onClose, cargando)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    try {
      onSuccess(await loginSecretaria(password))
    } catch (e) {
      setError(extraerMensaje(e, 'No se pudo contactar al servidor.'))
      setPassword('')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !cargando) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="modal rounded-t-3xl sm:max-w-sm sm:rounded-2xl"
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between bg-stone-900 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-amber-400">
              <LockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest leading-none text-stone-400">
                Panel Admin
              </p>
              <h2 id="login-modal-title" className="text-base font-bold leading-none text-white">
                Acceso Secretaría
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={cargando}
            className="-mr-1 rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white disabled:opacity-50"
            aria-label="Cerrar ventana de acceso"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <p className="text-sm leading-relaxed text-stone-600">
            Ingresa la contraseña para acceder al panel de secretaría del ministerio.
          </p>

          {/* Campo contraseña */}
          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={mostrar ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                className={`input pr-12 ${error ? 'input-error' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setMostrar((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
                aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrar ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p
                id="login-error"
                role="alert"
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-rose-700"
              >
                <ExclamationIcon className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando || password.length === 0}
            className="btn btn-dark w-full py-3"
          >
            {cargando ? (
              <>
                <Spinner />
                Verificando...
              </>
            ) : (
              <>
                <LoginIcon className="h-4 w-4" />
                Ingresar
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-500">
            Acceso exclusivo para personal autorizado del ministerio.
          </p>
        </form>
      </div>
    </div>
  )
}
