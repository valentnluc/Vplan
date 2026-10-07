import { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Database, Calendar, CheckSquare, DownloadCloud } from 'lucide-react'
import { useWorkspaceStatus } from '../../api/queries'
import { useConfigureWorkspace, useTestWorkspace, useSyncAllWorkspace, usePullWorkspace } from '../../api/mutations'
import type { WorkspaceTestResponse } from '../../types'

interface GoogleWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GoogleWorkspaceModal({ isOpen, onClose }: GoogleWorkspaceModalProps) {
  const { data: statusData, isLoading: isLoadingStatus } = useWorkspaceStatus()
  const { mutate: configureWorkspace, isPending: isSaving } = useConfigureWorkspace()
  const { mutate: testWorkspace, isPending: isTesting } = useTestWorkspace()
  const { mutate: syncAll, isPending: isSyncing } = useSyncAllWorkspace()
  const { mutate: pullChanges, isPending: isPulling } = usePullWorkspace()

  const [webAppUrl, setWebAppUrl] = useState('')
  const [apiKey, setApiKey] = useState('vplan_secret_key')
  const [testResult, setTestResult] = useState<WorkspaceTestResponse | null>(null)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (statusData) {
      setWebAppUrl(statusData.web_app_url || '')
      setApiKey(statusData.api_key || 'vplan_secret_key')
    }
  }, [statusData, isOpen])

  if (!isOpen) return null

  const handleTest = () => {
    const cleanUrl = webAppUrl.trim()
    if (!cleanUrl) {
      setTestResult({ success: false, error: 'Por favor ingresa la URL de la aplicación web.' })
      return
    }
    setTestResult(null)
    setSyncFeedback('Probando conexión con Google...')
    testWorkspace(
      { web_app_url: cleanUrl, api_key: apiKey.trim() },
      {
        onSuccess: (data) => {
          setTestResult(data)
          if (data.success) {
            setSyncFeedback('✅ Conexión con Google verificada.')
          } else {
            setSyncFeedback(null)
          }
        },
        onError: (err) => {
          setTestResult({ success: false, error: err.message })
          setSyncFeedback(null)
        },
      },
    )
  }

  const handleSave = () => {
    const cleanUrl = webAppUrl.trim()
    if (!cleanUrl) {
      setTestResult({ success: false, error: 'Por favor ingresa la URL de la aplicación web.' })
      return
    }
    setSyncFeedback('Guardando y validando conexión con Google...')
    setTestResult(null)
    configureWorkspace(
      { web_app_url: cleanUrl, api_key: apiKey.trim() },
      {
        onSuccess: () => {
          testWorkspace(
            { web_app_url: cleanUrl, api_key: apiKey.trim() },
            {
              onSuccess: (data) => {
                setTestResult(data)
                if (data.success) {
                  setSyncFeedback('✅ ¡Conexión exitosa! Configuración guardada.')
                } else {
                  setSyncFeedback(null)
                }
              },
              onError: (err) => {
                setTestResult({ success: false, error: err.message })
                setSyncFeedback(null)
              },
            },
          )
        },
        onError: (err) => {
          setSyncFeedback(null)
          setTestResult({ success: false, error: `Error al guardar: ${err.message}` })
        },
      },
    )
  }

  const handleSyncAll = () => {
    setSyncFeedback(null)
    syncAll(undefined, {
      onSuccess: (data) => {
        setSyncFeedback(`Exportación completada (${data.estrategicos_count} hitos estr., ${data.tacticos_count} tácticos, ${data.tareas_count} tareas).`)
        setTimeout(() => setSyncFeedback(null), 4000)
      },
      onError: (err) => {
        setSyncFeedback(`Error al sincronizar: ${err.message}`)
      },
    })
  }

  const handlePull = () => {
    setSyncFeedback(null)
    pullChanges(undefined, {
      onSuccess: (data) => {
        setSyncFeedback(data.message || `Sincronización completada (${data.updated_tasks} tareas actualizadas).`)
        setTimeout(() => setSyncFeedback(null), 4000)
      },
      onError: (err) => {
        setSyncFeedback(`Error al importar desde Google: ${err.message}`)
      },
    })
  }

  const isConnected = Boolean(statusData?.is_configured && (testResult?.success || testResult === null))

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0e0e0e] border border-[#262626] w-full max-w-lg p-5 space-y-4 shadow-2xl font-mono select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 ${statusData?.is_configured ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-neutral-600'}`} />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              GOOGLE WORKSPACE CLOUD GATEWAY
            </h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition p-1">
            <X size={14} />
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-2 text-[9px]">
          <div className="p-2 bg-[#141414] border border-[#222222] space-y-1">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <Database size={11} />
              <span>SHEETS</span>
            </div>
            <p className="text-neutral-400 font-sans">V - Estrategico</p>
            <span className="text-[8px] text-neutral-500 uppercase">Hitos 3 Años</span>
          </div>

          <div className="p-2 bg-[#141414] border border-[#222222] space-y-1">
            <div className="flex items-center gap-1 text-blue-400 font-bold">
              <Calendar size={11} />
              <span>CALENDAR</span>
            </div>
            <p className="text-neutral-400 font-sans">V - Tactico</p>
            <span className="text-[8px] text-neutral-500 uppercase">Entregables</span>
          </div>

          <div className="p-2 bg-[#141414] border border-[#222222] space-y-1">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <CheckSquare size={11} />
              <span>TASKS</span>
            </div>
            <p className="text-neutral-400 font-sans">V - Tareas</p>
            <span className="text-[8px] text-neutral-500 uppercase">Trinchera</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3 pt-1">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-neutral-300 uppercase block font-bold">
                URL de la Aplicación Web (Google Apps Script)
              </label>
            </div>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webAppUrl}
              onChange={e => setWebAppUrl(e.target.value)}
              className="w-full bg-[#080808] border border-[#2a2a2a] px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition font-sans"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-300 uppercase block mb-1 font-bold">
              API Key Secreta
            </label>
            <input
              type="password"
              placeholder="vplan_secret_key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-[#080808] border border-[#2a2a2a] px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition font-mono"
            />
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-2.5 text-[10px] border ${
              testResult.success
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-red-950/30 border-red-800/50 text-red-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {testResult.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{testResult.success ? 'CONEXIÓN VALIDADA' : 'ERROR DE CONEXIÓN'}</span>
            </div>
            <p className="text-[9px] font-sans opacity-90">
              {testResult.success
                ? testResult.message || `Recursos vinculados: ${testResult.data?.sheet_name}, ${testResult.data?.calendar_name}, ${testResult.data?.tasks_list_name}`
                : testResult.error || 'No se pudo contactar con la Web App. Revisa los permisos y la URL.'}
            </p>
          </div>
        )}

        {/* Sync All Feedback */}
        {syncFeedback && (
          <div className="p-2 text-[9.5px] bg-[#1a1a1a] border border-white text-white font-mono">
            {syncFeedback}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
          <div className="flex items-center gap-1.5">
            {statusData?.is_configured && (
              <>
                <button
                  type="button"
                  onClick={handlePull}
                  disabled={isPulling}
                  className="flex items-center gap-1 px-2 py-1.5 bg-[#181818] hover:bg-[#222222] border border-[#333333] hover:border-white text-white text-[10px] font-bold transition disabled:opacity-50"
                  title="Trae los cambios y tareas tildadas desde Google hacia VPlan"
                >
                  <DownloadCloud size={11} className={isPulling ? 'animate-bounce' : ''} />
                  <span>{isPulling ? 'IMPORTANDO...' : 'IMPORTAR DE GOOGLE'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2 py-1.5 bg-[#181818] hover:bg-[#222222] border border-[#333333] hover:border-white text-white text-[10px] font-bold transition disabled:opacity-50"
                  title="Envía todos los hitos y tareas actuales a Google Workspace"
                >
                  <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'EXPORTANDO...' : 'EXPORTAR TODO'}</span>
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !webAppUrl.trim()}
              className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-neutral-200 text-xs border border-[#2a2a2a] hover:border-white transition disabled:opacity-40"
            >
              {isTesting ? 'PROBANDO...' : 'PROBAR'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !webAppUrl.trim()}
              className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold transition disabled:opacity-40"
            >
              {isSaving ? 'GUARDANDO...' : 'GUARDAR Y VINCULAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

