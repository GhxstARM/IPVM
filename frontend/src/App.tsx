import { useEffect, useState } from 'react'
import DonarModal from './components/DonarModal.tsx'
import Eventos from './components/Eventos.tsx'
import Footer from './components/Footer.tsx'
import Home from './components/Home.tsx'
import LoginModal from './components/LoginModal.tsx'
import Navbar, { type Tab } from './components/Navbar.tsx'
import SubidaBoletas from './components/SubidaBoletas.tsx'
import Transparencia from './components/Transparencia.tsx'

interface ResultadoDonacion {
  estado: 'aprobada' | 'rechazada' | 'anulada' | 'error'
  monto?: string
  orden?: string
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const [modalDonar, setModalDonar] = useState(false)
  const [modalLogin, setModalLogin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [secretariaToken, setSecretariaToken] = useState('')
  const [resultadoDonacion, setResultadoDonacion] = useState<ResultadoDonacion | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // 1. Si entró escaneando el QR (?donar=1), abrir modal de donación
    if (params.get('donar') === '1') {
      setModalDonar(true)
      window.history.replaceState({}, '', '/')
      return
    }

    // 2. Si viene de vuelta desde Transbank (?estado=...)
    const estado = params.get('estado') as ResultadoDonacion['estado'] | null
    if (estado && ['aprobada', 'rechazada', 'anulada', 'error'].includes(estado)) {
      setResultadoDonacion({
        estado,
        monto: params.get('monto') || undefined,
        orden: params.get('orden') || undefined,
      })
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // Abre el modal de login (o va directo si ya está autenticada)
  const handleAdminClick = () => {
    if (isAuthenticated) {
      setActiveTab('secretaria')
    } else {
      setModalLogin(true)
    }
  }

  // Cuando la contraseña es correcta
  const handleLoginSuccess = (token: string) => {
    setSecretariaToken(token)
    setIsAuthenticated(true)
    setModalLogin(false)
    setActiveTab('secretaria')
  }

  // Cerrar sesión
  const handleLogout = () => {
    if (secretariaToken) void fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/secretaria/logout`, {
      method: 'POST', headers: { Authorization: `Bearer ${secretariaToken}` },
    }).catch(() => undefined)
    setIsAuthenticated(false)
    setSecretariaToken('')
    setActiveTab('inicio')
  }

  const renderView = () => {
    switch (activeTab) {
      case 'inicio':
        return <Home onDonar={() => setModalDonar(true)} />
      case 'eventos':
        return <Eventos />
      case 'transparencia':
        return <Transparencia />
      case 'secretaria':
        if (!isAuthenticated) {
          setModalLogin(true)
          return null
        }
        return <SubidaBoletas onLogout={handleLogout} token={secretariaToken} />
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDonar={() => setModalDonar(true)}
      />

      {/* Aviso de resultado tras volver de Webpay */}
      {resultadoDonacion && (
        <div
          className={`px-4 py-3 text-sm font-medium flex items-center justify-between gap-4 ${
            resultadoDonacion.estado === 'aprobada'
              ? 'bg-green-700 text-white'
              : resultadoDonacion.estado === 'anulada'
              ? 'bg-amber-600 text-white'
              : 'bg-red-700 text-white'
          }`}
        >
          <div className="max-w-4xl mx-auto flex-1 text-center">
            {resultadoDonacion.estado === 'aprobada' && (
              <>
                ¡Gracias por tu donación! Aporte de{' '}
                <strong>${Number(resultadoDonacion.monto || 0).toLocaleString('es-CL')}</strong> aprobado
                {resultadoDonacion.orden ? ` (Orden: ${resultadoDonacion.orden})` : ''}.
              </>
            )}
            {resultadoDonacion.estado === 'anulada' && 'La donación en Webpay fue anulada.'}
            {resultadoDonacion.estado === 'rechazada' && 'El pago fue rechazado por el banco o la tarjeta.'}
            {resultadoDonacion.estado === 'error' && 'Ocurrió un problema al verificar el pago con Webpay.'}
          </div>
          <button
            onClick={() => setResultadoDonacion(null)}
            className="text-white/80 hover:text-white font-bold px-2"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-1 pb-16">
        {renderView()}
      </main>

      <Footer onAdminClick={handleAdminClick} />

      {/* Modal donación */}
      {modalDonar && <DonarModal onClose={() => setModalDonar(false)} />}

      {/* Modal login secretaría */}
      {modalLogin && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setModalLogin(false)}
        />
      )}
    </div>
  )
}