import { useState, useEffect, useCallback } from 'react'
import { Cloud, Settings } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useWorkspaceStatus } from '../../api/queries'
import type { TabId } from '../../types'
import GoogleWorkspaceModal from './GoogleWorkspaceModal'

const TABS: { id: TabId; label: string; key: string }[] = [
  { id: 'estrategica', label: '1. ESTRATÉGICA', key: '1' },
  { id: 'tactica', label: '2. TÁCTICA', key: '2' },
  { id: 'trinchera', label: '3. TRINCHERA', key: '3' },
]

export default function Header() {
  const { activeTab, setActiveTab, openCreateTaskModal } = useAppStore()
  const { data: workspaceStatus } = useWorkspaceStatus()
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '1') setActiveTab('estrategica')
      else if (e.key === '2') setActiveTab('tactica')
      else if (e.key === '3') setActiveTab('trinchera')
      else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        openCreateTaskModal()
      }
    },
    [setActiveTab, openCreateTaskModal],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <header className="bg-black border-b border-[#151515] px-4 py-2 flex items-center justify-between flex-shrink-0 font-mono select-none">
        {/* Left: Brand / System Title */}
        <div className="flex items-center gap-2">
          <span className="bg-white text-black px-1.5 py-0.5 text-xs font-bold">VPLAN</span>
          <span className="text-neutral-600 text-xs hidden sm:inline">FRAMEWORK OS</span>
        </div>

        {/* Center: Clean Seamless Tabs */}
        <nav className="flex bg-[#050505] p-0.5 rounded-none border border-[#141414]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-3 py-1 text-[11px] font-bold transition cursor-pointer',
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-500 hover:text-white hover:bg-[#111111]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Workspace Sync & Helper text */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setWorkspaceModalOpen(true)}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold transition border cursor-pointer',
              workspaceStatus?.is_configured
                ? 'bg-[#0a1a0f] border-emerald-800/80 text-emerald-400 hover:bg-emerald-950/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'bg-[#111111] border-[#262626] text-neutral-400 hover:text-white hover:border-white',
            ].join(' ')}
            title="Sincronización con Google Sheets (V - Estrategico), Calendar (V - Tactico) y Tasks (V - Tareas)"
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                workspaceStatus?.is_configured
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : 'bg-neutral-500'
              }`}
            />
            <span>
              {workspaceStatus?.is_configured ? 'GOOGLE SYNC' : 'CONECTAR GOOGLE'}
            </span>
          </button>

          <span className="text-[10px] text-neutral-600 font-mono hidden lg:inline">
            [1-3 · C: TAREA]
          </span>
        </div>
      </header>

      {/* Google Workspace Modal */}
      <GoogleWorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
      />
    </>
  )
}
