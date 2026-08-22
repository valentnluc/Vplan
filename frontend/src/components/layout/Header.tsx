import { useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import type { TabId } from '../../types'

const TABS: { id: TabId; label: string; key: string }[] = [
  { id: 'estrategica', label: '1. ESTRATÉGICA', key: '1' },
  { id: 'tactica', label: '2. TÁCTICA', key: '2' },
  { id: 'trinchera', label: '3. TRINCHERA', key: '3' },
]

export default function Header() {
  const { activeTab, setActiveTab, openCreateTaskModal } = useAppStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '1') setActiveTab('estrategica')
      else if (e.key === '2') setActiveTab('tactica')
      else if (e.key === '3') setActiveTab('trinchera')
      else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || e.key.toLowerCase() === 'c') {
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
    <header className="bg-black border-b border-[#151515] px-4 py-2 flex items-center justify-between flex-shrink-0 font-mono">
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

      {/* Right: Minimal helper text */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-neutral-600 font-mono hidden md:inline">
          [1-3: PESTAÑAS · C: CAPTURA]
        </span>
      </div>
    </header>
  )
}
