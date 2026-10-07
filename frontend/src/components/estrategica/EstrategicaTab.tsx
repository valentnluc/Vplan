import { useState, useMemo, useCallback } from 'react'
import { Plus, X, Edit3, Trash2 } from 'lucide-react'
import { useEstrategica, useTactica } from '../../api/queries'
import { useCreateHitoEstrategico, useUpdateHitoEstrategico, useDeleteHitoEstrategico, useCreateHitoTactico } from '../../api/mutations'
import { CAMPOS_CONFIG, getCampoConfig, formatDateISO, formatDateDisplay } from '../../types'
import type { HitoEstrategico, HitoTactico } from '../../types'

// ── 6 Semestres (3 Años: 2026 - 2028) ──────────────────────────────────────────
const SEMESTERS = [
  { label: 'H1 2026', start: '2026-01-01', end: '2026-06-30' },
  { label: 'H2 2026', start: '2026-07-01', end: '2026-12-31' },
  { label: 'H1 2027', start: '2027-01-01', end: '2027-06-30' },
  { label: 'H2 2027', start: '2027-07-01', end: '2027-12-31' },
  { label: 'H1 2028', start: '2028-01-01', end: '2028-06-30' },
  { label: 'H2 2028', start: '2028-07-01', end: '2028-12-31' },
]

function getSemesterIndex(dateStr: string): number {
  for (let i = 0; i < SEMESTERS.length; i++) {
    if (dateStr <= SEMESTERS[i].end) return i
  }
  return SEMESTERS.length - 1
}

// ── 7 Campo Macro Summary Card ────────────────────────────────────────────────
interface CampoBlockProps {
  campo: { id: string; nombre: string; color: string }
  hitoCount: number
  entregablesCount: number
  onAddHito: (campoId: string) => void
}

function CampoBlock({ campo, hitoCount, entregablesCount, onAddHito }: CampoBlockProps) {
  return (
    <div
      className="p-3 bg-[#111111] border border-[#222222] flex flex-col justify-between group transition hover:bg-[#181818] shadow-sm"
      style={{ borderLeft: `3px solid ${campo.color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold" style={{ color: campo.color }}>
          [{campo.id}]
        </span>
        <button
          onClick={() => onAddHito(campo.id)}
          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white p-0.5 transition"
          title="Agregar hito estratégico"
        >
          <Plus size={10} />
        </button>
      </div>

      <div className="my-1.5">
        <h3 className="text-[11px] font-sans font-bold text-white truncate leading-snug">
          {campo.nombre}
        </h3>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-neutral-300 pt-1 border-t border-[#1c1c1c]">
        <span>{hitoCount} {hitoCount === 1 ? 'HITO' : 'HITOS'}</span>
        <span className="text-neutral-400">↳ {entregablesCount} ENTREG.</span>
      </div>
    </div>
  )
}

// ── Modal de Crear / Editar Hito Estratégico ──────────────────────────────────
interface HitoFormModalProps {
  campoId: string
  hitoToEdit?: HitoEstrategico | null
  onClose: () => void
}

function HitoFormModal({ campoId, hitoToEdit, onClose }: HitoFormModalProps) {
  const { mutate: createHito, isPending: isCreating } = useCreateHitoEstrategico()
  const { mutate: updateHito, isPending: isUpdating } = useUpdateHitoEstrategico()
  const { mutate: deleteHito, isPending: isDeleting } = useDeleteHitoEstrategico()

  const [titulo, setTitulo] = useState(hitoToEdit?.titulo || '')
  const [selectedCampoId, setSelectedCampoId] = useState(hitoToEdit?.campo_id || campoId)
  const [fechaInicio, setFechaInicio] = useState(hitoToEdit?.fecha_inicio || formatDateISO(new Date()))
  const [fechaTarget, setFechaTarget] = useState(hitoToEdit?.fecha_target || '2026-12-31')
  const campo = getCampoConfig(selectedCampoId)
  const isEditing = Boolean(hitoToEdit && hitoToEdit.id)

  const handleSubmit = useCallback(() => {
    if (!titulo.trim() || !fechaTarget) return

    if (isEditing && hitoToEdit) {
      updateHito(
        {
          id: hitoToEdit.id,
          campo_id: selectedCampoId,
          titulo: titulo.trim(),
          fecha_inicio: fechaInicio,
          fecha_target: fechaTarget,
        },
        { onSuccess: onClose },
      )
    } else {
      createHito(
        {
          campo_id: selectedCampoId,
          titulo: titulo.trim(),
          fecha_inicio: fechaInicio,
          fecha_target: fechaTarget,
          estado: 'en_progreso',
        },
        { onSuccess: onClose },
      )
    }
  }, [titulo, selectedCampoId, fechaInicio, fechaTarget, isEditing, hitoToEdit, updateHito, createHito, onClose])

  const handleDelete = useCallback(() => {
    if (hitoToEdit?.id) {
      if (window.confirm(`¿Estás seguro de eliminar el hito estratégico "${hitoToEdit.titulo}"?`)) {
        deleteHito(hitoToEdit.id, { onSuccess: onClose })
      }
    }
  }, [hitoToEdit, deleteHito, onClose])

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111111] border border-[#2a2a2a] p-5 w-full max-w-md space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5" style={{ backgroundColor: campo.color }} />
            <h3 className="text-xs font-mono font-bold text-white uppercase">
              {isEditing ? 'EDITAR HITO ESTRATÉGICO' : `NUEVO HITO ESTRATÉGICO · [${campo.id}] ${campo.nombre}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 font-mono">
          <div>
            <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Título del Hito Estratégico</label>
            <input
              autoFocus
              placeholder="Ej. Lanzamiento MVP Plataforma VPlan"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-[#080808] border border-[#262626] px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition font-sans"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Campo Vital</label>
            <select
              value={selectedCampoId}
              onChange={e => setSelectedCampoId(e.target.value)}
              className="w-full bg-[#080808] border border-[#262626] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white"
            >
              {CAMPOS_CONFIG.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.id}] {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Target</label>
              <input
                type="date"
                value={fechaTarget}
                onChange={e => setFechaTarget(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 px-3 py-1.5 bg-transparent border border-red-900 text-red-400 hover:bg-red-950 text-xs font-mono font-bold transition"
            >
              <Trash2 size={12} />
              <span>{isDeleting ? 'ELIMINANDO...' : 'ELIMINAR'}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-neutral-300 text-xs font-mono border border-[#262626] transition"
            >
              CANCELAR
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating || isUpdating || !titulo.trim() || !fechaTarget}
              className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold transition disabled:opacity-40"
            >
              {isCreating || isUpdating ? 'GUARDANDO...' : isEditing ? 'GUARDAR CAMBIOS' : 'CREAR HITO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal de nuevo Entregable Táctico desde la Vista Estratégica ───────────────
interface AddEntregableModalProps {
  hitoEstrategico: HitoEstrategico
  onClose: () => void
}

function AddEntregableModal({ hitoEstrategico, onClose }: AddEntregableModalProps) {
  const { mutate, isPending } = useCreateHitoTactico()
  const [titulo, setTitulo] = useState('')
  const [fechaLimite, setFechaLimite] = useState(hitoEstrategico.fecha_target || formatDateISO(new Date()))
  const [horaLimite, setHoraLimite] = useState('10:00')

  const handleSubmit = useCallback(() => {
    if (!titulo.trim()) return
    mutate(
      {
        campo_id: hitoEstrategico.campo_id,
        hito_estrategico_id: hitoEstrategico.id,
        titulo: titulo.trim(),
        fecha_limite: fechaLimite,
        progreso_manual: 0,
        estado: 'pendiente',
        dependencia_hito_id: horaLimite ? `hora:${horaLimite}` : undefined,
      },
      { onSuccess: onClose },
    )
  }, [titulo, fechaLimite, horaLimite, hitoEstrategico, mutate, onClose])

  const campo = getCampoConfig(hitoEstrategico.campo_id)

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111111] border border-[#2a2a2a] p-5 w-full max-w-md space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5" style={{ backgroundColor: campo.color }} />
            <h3 className="text-xs font-mono font-bold text-white uppercase">
              VINCULAR ENTREGABLE A: {hitoEstrategico.titulo}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 font-mono">
          <div>
            <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Título del Entregable Táctico</label>
            <input
              autoFocus
              placeholder="Ej. Finalizar wireframes y prototipo Figma"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-[#080808] border border-[#262626] px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Fecha Límite</label>
              <input
                type="date"
                value={fechaLimite}
                onChange={e => setFechaLimite(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Hora</label>
              <input
                type="time"
                value={horaLimite}
                onChange={e => setHoraLimite(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#222222]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-neutral-300 text-xs font-mono border border-[#262626] transition"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !titulo.trim()}
            className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold transition disabled:opacity-40"
          >
            {isPending ? 'GUARDANDO...' : 'CREAR ENTREGABLE'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Gantt Milestone Bar with Tactical Deliverables & High Contrast ─────────────
interface GanttBarProps {
  hito: HitoEstrategico
  entregables: HitoTactico[]
  onEditHito: (hito: HitoEstrategico) => void
  onAddEntregable: (hito: HitoEstrategico) => void
}

function GanttBar({ hito, entregables, onEditHito, onAddEntregable }: GanttBarProps) {
  const campo = getCampoConfig(hito.campo_id)
  const startIdx = getSemesterIndex(hito.fecha_inicio)
  const targetIdx = getSemesterIndex(hito.fecha_target)
  const colSpan = Math.max(1, targetIdx - startIdx + 1)
  const gridColumnStart = startIdx + 1

  return (
    <div
      onClick={() => onEditHito(hito)}
      className="p-2.5 bg-[#161616] border border-[#282828] flex flex-col justify-between gap-1.5 group transition hover:bg-[#202020] cursor-pointer shadow-md rounded-none relative z-10"
      style={{
        gridColumn: `${gridColumnStart} / span ${colSpan}`,
        borderLeft: `4px solid ${campo.color}`,
        borderRight: `2px solid ${campo.color}`,
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[9px] font-bold" style={{ color: campo.color }}>
            ◆
          </span>
          <span className="text-[11px] font-sans font-bold text-white truncate">
            {hito.titulo}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => {
              e.stopPropagation()
              onEditHito(hito)
            }}
            className="p-1 bg-[#222222] hover:bg-white hover:text-black text-neutral-200 transition"
            title="Editar hito estratégico"
          >
            <Edit3 size={10} />
          </button>

          <button
            onClick={e => {
              e.stopPropagation()
              onAddEntregable(hito)
            }}
            className="flex items-center gap-0.5 text-[8px] font-mono bg-white text-black px-1.5 py-0.5 font-bold hover:bg-neutral-200 transition"
            title="Vincular nuevo entregable táctico a este hito"
          >
            <Plus size={8} /> ENTREGABLE
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-neutral-300">
        <span>{formatDateDisplay(new Date(hito.fecha_inicio))} ➔ {formatDateDisplay(new Date(hito.fecha_target))}</span>
        <span className="text-neutral-400 font-semibold">{entregables.length} {entregables.length === 1 ? 'entregable' : 'entregables'}</span>
      </div>

      {/* Embedded Tactical Deliverables list */}
      {entregables.length > 0 && (
        <div className="pt-1.5 border-t border-[#252525] space-y-1">
          {entregables.map(e => (
            <div
              key={e.id}
              className="flex items-center justify-between text-[9px] text-neutral-200 bg-[#0d0d0d] px-2 py-0.5 border border-[#1f1f1f]"
            >
              <span className="truncate max-w-[140px]">↳ {e.titulo}</span>
              <span className="text-neutral-400 font-mono flex-shrink-0">{e.fecha_limite}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Estrategica Tab ──────────────────────────────────────────────────────
export default function EstrategicaTab() {
  const { data: hitosEstrategicos, isLoading: isEstLoading } = useEstrategica()
  const { data: hitosTacticos } = useTactica()
  const [addingForCampo, setAddingForCampo] = useState<string | null>(null)
  const [editingHito, setEditingHito] = useState<HitoEstrategico | null>(null)
  const [addingEntregableForHito, setAddingEntregableForHito] = useState<HitoEstrategico | null>(null)

  const hitosByCampo = useMemo(() => {
    const map: Record<string, HitoEstrategico[]> = {}
    hitosEstrategicos?.forEach(h => {
      if (!map[h.campo_id]) map[h.campo_id] = []
      map[h.campo_id].push(h)
    })
    return map
  }, [hitosEstrategicos])

  const entregablesByHitoEstrategico = useMemo(() => {
    const map: Record<string, HitoTactico[]> = {}
    hitosTacticos?.forEach(t => {
      if (t.hito_estrategico_id) {
        if (!map[t.hito_estrategico_id]) map[t.hito_estrategico_id] = []
        map[t.hito_estrategico_id].push(t)
      }
    })
    return map
  }, [hitosTacticos])

  const entregablesByCampo = useMemo(() => {
    const map: Record<string, HitoTactico[]> = {}
    hitosTacticos?.forEach(t => {
      if (!map[t.campo_id]) map[t.campo_id] = []
      map[t.campo_id].push(t)
    })
    return map
  }, [hitosTacticos])

  const handleAddHito = useCallback((campoId: string) => {
    setAddingForCampo(campoId)
  }, [])

  if (isEstLoading) {
    return (
      <div className="space-y-3 p-4 animate-pulse bg-black">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#111111]" />
          ))}
        </div>
        <div className="h-64 bg-[#111111]" />
      </div>
    )
  }

  const camposWithHitos = CAMPOS_CONFIG.filter(c => (hitosByCampo[c.id]?.length ?? 0) > 0)

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-black select-none">
      {/* 7 Campos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {CAMPOS_CONFIG.map(campo => (
          <CampoBlock
            key={campo.id}
            campo={campo}
            hitoCount={hitosByCampo[campo.id]?.length ?? 0}
            entregablesCount={entregablesByCampo[campo.id]?.length ?? 0}
            onAddHito={handleAddHito}
          />
        ))}
      </div>

      {/* Gantt Macro Timeline (3 Años) with Solid Visual Columns */}
      <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            HOJA DE RUTA ESTRATÉGICA · 3 AÑOS (HITOS & ENTREGABLES)
          </h2>
        </div>

        {/* Semesters Header Grid */}
        <div className="grid font-mono text-[10px]" style={{ gridTemplateColumns: '150px repeat(6, 1fr)' }}>
          <div className="text-neutral-400 font-bold flex items-center">CAMPO</div>
          {SEMESTERS.map(s => (
            <div
              key={s.label}
              className="text-white text-center font-bold py-1 bg-[#181818] border-r border-[#262626] last:border-r-0"
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Rows by Campo with semester guides & clear vertical gap between milestones */}
        {camposWithHitos.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#222222]">
            <p className="text-xs font-mono text-neutral-500 uppercase">Sin hitos estratégicos registrados</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {camposWithHitos.map(campo => {
              const campoHitos = hitosByCampo[campo.id] ?? []
              return (
                <div
                  key={campo.id}
                  className="grid items-start font-mono border-b border-[#1c1c1c] pb-3"
                  style={{ gridTemplateColumns: '150px 1fr' }}
                >
                  {/* Left Campo Label */}
                  <div className="flex items-center gap-1.5 pt-1.5 pr-2">
                    <span className="text-[9px] font-bold" style={{ color: campo.color }}>
                      [{campo.id}]
                    </span>
                    <span className="text-[10px] text-neutral-200 font-bold truncate">
                      {campo.nombre}
                    </span>
                  </div>

                  {/* 6-Column Timeline Track with clear semester slots */}
                  <div
                    className="grid relative py-0.5 gap-2.5"
                    style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
                  >
                    {/* Background semester vertical divider guides */}
                    <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border-r border-[#161616] last:border-r-0 h-full" />
                      ))}
                    </div>

                    {/* Gantt Milestone Bars positioned accurately with distinct spacing */}
                    {campoHitos.map(hito => (
                      <GanttBar
                        key={hito.id}
                        hito={hito}
                        entregables={entregablesByHitoEstrategico[hito.id] ?? []}
                        onEditHito={h => setEditingHito(h)}
                        onAddEntregable={h => setAddingEntregableForHito(h)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal for Creating new Hito or Editing existing Hito */}
      {(addingForCampo || editingHito) && (
        <HitoFormModal
          campoId={addingForCampo || editingHito?.campo_id || '03'}
          hitoToEdit={editingHito}
          onClose={() => {
            setAddingForCampo(null)
            setEditingHito(null)
          }}
        />
      )}

      {addingEntregableForHito && (
        <AddEntregableModal
          hitoEstrategico={addingEntregableForHito}
          onClose={() => setAddingEntregableForHito(null)}
        />
      )}
    </div>
  )
}
