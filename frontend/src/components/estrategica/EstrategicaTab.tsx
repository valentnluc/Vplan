import { useState, useMemo, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { useEstrategica } from '../../api/queries'
import { useCreateHitoEstrategico } from '../../api/mutations'
import { CAMPOS_CONFIG, getCampoConfig } from '../../types'
import type { HitoEstrategico } from '../../types'

// ── Semester helpers ──────────────────────────────────────────────────────────
const SEMESTERS = [
  { label: 'S1 2025', start: '2025-01-01', end: '2025-06-30' },
  { label: 'S2 2025', start: '2025-07-01', end: '2025-12-31' },
  { label: 'S1 2026', start: '2026-01-01', end: '2026-06-30' },
  { label: 'S2 2026', start: '2026-07-01', end: '2026-12-31' },
  { label: 'S1 2027', start: '2027-01-01', end: '2027-06-30' },
  { label: 'S2 2027', start: '2027-07-01', end: '2027-12-31' },
]

function semesterIndex(dateStr: string): number {
  const d = new Date(dateStr)
  return SEMESTERS.findIndex(s => new Date(s.start) <= d && d <= new Date(s.end))
}

function hitoCols(hito: HitoEstrategico): { colStart: number; colEnd: number } {
  const start = Math.max(0, semesterIndex(hito.fecha_inicio))
  const endIdx = semesterIndex(hito.fecha_target)
  const end = endIdx < 0 ? SEMESTERS.length - 1 : endIdx
  return { colStart: start + 1, colEnd: end + 2 }
}

// ── Add Hito Form (modal) ─────────────────────────────────────────────────────
interface AddHitoFormProps {
  campoId: string
  onClose: () => void
}

function AddHitoForm({ campoId, onClose }: AddHitoFormProps) {
  const { mutate, isPending } = useCreateHitoEstrategico()
  const [titulo, setTitulo] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaTarget, setFechaTarget] = useState('')
  const [estado, setEstado] = useState<HitoEstrategico['estado']>('en_progreso')

  const handleSubmit = useCallback(() => {
    if (!titulo.trim() || !fechaTarget) return
    mutate(
      { campo_id: campoId, titulo: titulo.trim(), fecha_inicio: fechaInicio, fecha_target: fechaTarget, estado },
      { onSuccess: onClose },
    )
  }, [titulo, fechaInicio, fechaTarget, estado, campoId, mutate, onClose])

  const campo = getCampoConfig(campoId)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-96 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Nuevo Hito Estratégico</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
            <X size={14} />
          </button>
        </div>
        <div
          className="text-[10px] font-medium px-2 py-0.5 rounded w-fit"
          style={{ backgroundColor: campo.color + '22', color: campo.color, border: `1px solid ${campo.color}44` }}
        >
          {campo.nombre}
        </div>
        <input
          autoFocus
          placeholder="Título del hito..."
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Target</label>
            <input
              type="date"
              value={fechaTarget}
              onChange={e => setFechaTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>
        <select
          value={estado}
          onChange={e => setEstado(e.target.value as HitoEstrategico['estado'])}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
        >
          <option value="en_progreso">En progreso</option>
          <option value="completado">Completado</option>
          <option value="pausado">Pausado</option>
        </select>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !titulo.trim() || !fechaTarget}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium transition disabled:opacity-40"
          >
            {isPending ? 'Guardando...' : 'Crear Hito'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Campo Card ────────────────────────────────────────────────────────────────
interface CampoCardProps {
  campo: typeof CAMPOS_CONFIG[number]
  hitoCount: number
  onAddHito: (campoId: string) => void
}

function CampoCard({ campo, hitoCount, onAddHito }: CampoCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 relative flex flex-col gap-2">
      <div className="h-0.5 w-full rounded-full mb-1" style={{ backgroundColor: campo.color }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-slate-500 font-mono">#{campo.id}</div>
          <div className="text-xs font-semibold text-slate-200 leading-tight mt-0.5">{campo.nombre}</div>
        </div>
        <button
          onClick={() => onAddHito(campo.id)}
          className="text-slate-500 hover:text-slate-200 transition p-0.5 rounded hover:bg-slate-800"
        >
          <Plus size={12} />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
          {campo.tipo === 'hitos' ? 'Hitos' : 'Continuo'}
        </span>
        <span className="text-[10px] text-slate-500">{hitoCount} hito{hitoCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// ── Gantt Bar ─────────────────────────────────────────────────────────────────
interface GanttBarProps {
  hito: HitoEstrategico
}

function GanttBar({ hito }: GanttBarProps) {
  const campo = getCampoConfig(hito.campo_id)
  const { colStart, colEnd } = hitoCols(hito)
  return (
    <div
      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 truncate"
      style={{
        gridColumn: `${colStart} / ${colEnd}`,
        borderLeft: `3px solid ${campo.color}`,
      }}
      title={hito.titulo}
    >
      {hito.titulo}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-lg" />
        ))}
      </div>
      <div className="h-48 bg-slate-800 rounded-xl" />
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function EstrategicaTab() {
  const { data: hitos, isLoading, isError } = useEstrategica()
  const [addingForCampo, setAddingForCampo] = useState<string | null>(null)

  const hitosByCampo = useMemo(() => {
    const map: Record<string, HitoEstrategico[]> = {}
    hitos?.forEach(h => {
      if (!map[h.campo_id]) map[h.campo_id] = []
      map[h.campo_id].push(h)
    })
    return map
  }, [hitos])

  const handleAddHito = useCallback((campoId: string) => {
    setAddingForCampo(campoId)
  }, [])

  if (isLoading) return <Skeleton />
  if (isError)
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Error al cargar datos estratégicos.
      </div>
    )

  const camposWithHitos = CAMPOS_CONFIG.filter(c => (hitosByCampo[c.id]?.length ?? 0) > 0)

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Campo Cards Grid */}
      <div className="grid grid-cols-7 gap-3">
        {CAMPOS_CONFIG.map(campo => (
          <CampoCard
            key={campo.id}
            campo={campo}
            hitoCount={hitosByCampo[campo.id]?.length ?? 0}
            onAddHito={handleAddHito}
          />
        ))}
      </div>

      {/* Gantt Macro Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold text-slate-300 tracking-wide">
          Hoja de Ruta — 3 Años
        </h2>

        {/* Semester header */}
        <div className="grid gap-1" style={{ gridTemplateColumns: '130px repeat(6, 1fr)' }}>
          <div />
          {SEMESTERS.map(s => (
            <div key={s.label} className="text-[10px] text-slate-500 text-center font-mono border-l border-slate-800 pl-1">
              {s.label}
            </div>
          ))}
        </div>

        {/* Grid separator */}
        <div className="border-t border-slate-800" />

        {/* Rows per campo */}
        {camposWithHitos.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No hay hitos estratégicos. Añade uno con el botón + en cada campo.
          </p>
        ) : (
          <div className="space-y-2">
            {camposWithHitos.map(campo => {
              const campoHitos = hitosByCampo[campo.id] ?? []
              return (
                <div
                  key={campo.id}
                  className="grid gap-1 items-start"
                  style={{ gridTemplateColumns: '130px 1fr' }}
                >
                  {/* Campo label */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: campo.color }}
                    />
                    <span className="text-[10px] text-slate-400 truncate">{campo.nombre}</span>
                  </div>
                  {/* Gantt grid */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                    {campoHitos.map(hito => (
                      <GanttBar key={hito.id} hito={hito} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Hito Modal */}
      {addingForCampo && (
        <AddHitoForm campoId={addingForCampo} onClose={() => setAddingForCampo(null)} />
      )}
    </div>
  )
}
