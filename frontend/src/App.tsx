import { useEffect, useState } from 'react'
import AvisoDonacion from './components/AvisoDonacion.tsx'
import DonarModal from './components/DonarModal.tsx'
import Eventos from './components/Eventos.tsx'
import Footer from './components/Footer.tsx'
import Home from './components/Home.tsx'
import LoginModal from './components/LoginModal.tsx'
import Navbar, { type Tab } from './components/Navbar.tsx'
import SubidaBoletas from './components/SubidaBoletas.tsx'
import Transparencia from './components/Transparencia.tsx'
import { logoutSecretaria } from './services/secretariaService.ts'
import { ESTADOS_DONACION, type ResultadoDonacion } from './types/donacion.ts'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const [modalDonar, setModalDonar] = useState(false)
  const [modalLogin, setModalLogin] = useState(false)
  const [secretariaToken, setSecretariaToken] = useState('')
  const [resultadoDonacion, setResultadoDonacion] = useState<ResultadoDonacion | null>(null)

  const isAuthenticated = secretariaToken !== ''

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
    if (estado && ESTADOS_DONACION.includes(estado)) {
      setResultadoDonacion({
        estado,
        monto: params.get('monto') || undefined,
        orden: params.get('orden') || undefined,
      })
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // La vista de secretaría exige sesión: si no la hay, se solicita el login.
  useEffect(() => {
    if (activeTab === 'secretaria' && !isAuthenticated) setModalLogin(true)
  }, [activeTab, isAuthenticated])

  const cambiarTab = (tab: Tab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Abre el modal de login (o va directo si ya está autenticada)
  const handleAdminClick = () => {
    if (isAuthenticated) {
      cambiarTab('secretaria')
    } else {
      setModalLogin(true)
    }
  }

  const handleLoginSuccess = (token: string) => {
    setSecretariaToken(token)
    setModalLogin(false)
    cambiarTab('secretaria')
  }

  const handleLogout = () => {
    if (secretariaToken) void logoutSecretaria(secretariaToken)
    setSecretariaToken('')
    cambiarTab('inicio')
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
        return isAuthenticated ? (
          <SubidaBoletas onLogout={handleLogout} token={secretariaToken} />
        ) : null
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-zinc-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      <Navbar
        activeTab={activeTab}
        onTabChange={cambiarTab}
        onDonar={() => setModalDonar(true)}
        sesionActiva={isAuthenticated}
      />

      {resultadoDonacion && (
        <AvisoDonacion resultado={resultadoDonacion} onClose={() => setResultadoDonacion(null)} />
      )}

      <main id="contenido-principal" className="flex-1 pb-16">
        {renderView()}
      </main>

      <Footer onAdminClick={handleAdminClick} />

      {modalDonar && <DonarModal onClose={() => setModalDonar(false)} />}

      {modalLogin && (
        <LoginModal onSuccess={handleLoginSuccess} onClose={() => setModalLogin(false)} />
      )}
    </div>
  )
}
