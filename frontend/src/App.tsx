import { useAppStore } from './store/appStore'
import Header from './components/layout/Header'
import EstrategicaTab from './components/estrategica/EstrategicaTab'
import TacticaTab from './components/tactica/TacticaTab'
import TrencheraTab from './components/trinchera/TrencheraTab'

export default function App() {
  const activeTab = useAppStore(s => s.activeTab)

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'estrategica' && <EstrategicaTab />}
        {activeTab === 'tactica' && <TacticaTab />}
        {activeTab === 'trinchera' && <TrencheraTab />}
      </main>
    </div>
  )
}
