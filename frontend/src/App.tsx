import { useAppStore } from './store/appStore'
import Header from './components/layout/Header'
import EstrategicaTab from './components/estrategica/EstrategicaTab'
import TacticaTab from './components/tactica/TacticaTab'
import TrencheraTab from './components/trinchera/TrencheraTab'
import TaskFormModal from './components/trinchera/TaskFormModal'

export default function App() {
  const activeTab = useAppStore(s => s.activeTab)

  return (
    <div className="h-screen bg-black text-neutral-100 flex flex-col overflow-hidden select-none">
      <Header />
      <main className="flex-1 overflow-hidden min-h-0 bg-black">
        {activeTab === 'estrategica' && <EstrategicaTab />}
        {activeTab === 'tactica' && <TacticaTab />}
        {activeTab === 'trinchera' && <TrencheraTab />}
      </main>
      {/* Global task creation and editing modal */}
      <TaskFormModal />
    </div>
  )
}
