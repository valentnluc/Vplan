import { useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import type { TabId } from '../../types'

const TABS: { id: TabId; label: string; key: string }[] = [
  { id: 'estrategica', label: 'Estratégica', key: '1' },
  { id: 'tactica', label: 'Táctica', key: '2' },
  { id: 'trinchera', label: 'Trinchera', key: '3' },
]

export default function Header() {
  const activeTab = useAppStore(s => s.activeTab)
  const setActiveTab = useAppStore(s => s.setActiveTab)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '1') setActiveTab('estrategica')
      else if (e.key === '2') setActiveTab('tactica')
      else if (e.key === '3') setActiveTab('trinchera')
      else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || e.key.toLowerCase() === 'c') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('focus-capture'))
      }
    },
    [setActiveTab],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Left: App title */}
      <span className="text-slate-100 font-semibold text-sm tracking-tight">
        Centro de Mando
      </span>

      {/* Center: Tab selector */}
      <nav className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 space-x-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? 'bg-slate-800 text-slate-100 font-semibold px-3 py-1.5 rounded text-xs'
                : 'text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded text-xs transition cursor-pointer'
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right: keyboard hints */}
      <span className="text-slate-500 text-xs select-none">
        [1] [2] [3] &nbsp; Ctrl+K captura
      </span>
    </header>
  )
}
