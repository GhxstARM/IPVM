import { useState } from 'react'
import Eventos from './components/Eventos.tsx'
import Footer from './components/Footer.tsx'
import Home from './components/Home.tsx'
import Navbar, { type Tab } from './components/Navbar.tsx'
import SubidaBoletas from './components/SubidaBoletas.tsx'
import Transparencia from './components/Transparencia.tsx'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')

  const renderView = () => {
    switch (activeTab) {
      case 'inicio':
        return <Home />
      case 'eventos':
        return <Eventos />
      case 'transparencia':
        return <Transparencia />
      case 'secretaria':
        return <SubidaBoletas />
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 pb-16">
        {renderView()}
      </main>

      <Footer onAdminClick={() => setActiveTab('secretaria')} />
    </div>
  )
}
