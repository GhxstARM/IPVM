import { useState } from 'react'
import DonarModal from './components/DonarModal.tsx'
import Eventos from './components/Eventos.tsx'
import Footer from './components/Footer.tsx'
import Home from './components/Home.tsx'
import LoginModal from './components/LoginModal.tsx'
import Navbar, { type Tab } from './components/Navbar.tsx'
import SubidaBoletas from './components/SubidaBoletas.tsx'
import Transparencia from './components/Transparencia.tsx'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const [modalDonar, setModalDonar] = useState(false)
  const [modalLogin, setModalLogin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [secretariaToken, setSecretariaToken] = useState('')

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
        // Si intenta llegar a secretaria sin auth (ej. directamente), pedir login
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
