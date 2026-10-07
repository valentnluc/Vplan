import { useState, useMemo, useCallback, useRef } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, Check, Target, Edit3, Trash2, ListTree, Sparkles } from 'lucide-react'
import { useTactica, useEstrategica } from '../../api/queries'
import { useCreateHitoTactico, useUpdateHitoTactico, useDeleteHitoTactico, useDesglosarHito } from '../../api/mutations'
import { CAMPOS_CONFIG, getCampoConfig, formatDateISO, addDays, getMonday } from '../../types'
import type { HitoTactico } from '../../types'

// ── Modal de Crear / Editar Entregable Táctico ────────────────────────────────
interface HitoTacticoModalProps {
  fechaDef: string
  hitoToEdit?: HitoTactico | null
  onClose: () => void
}

function HitoTacticoModal({ fechaDef, hitoToEdit, onClose }: HitoTacticoModalProps) {
  const { mutate: createHito, isPending: isCreating } = useCreateHitoTactico()
  const { mutate: updateHito, isPending: isUpdating } = useUpdateHitoTactico()
  const { mutate: deleteHito, isPending: isDeleting } = useDeleteHitoTactico()
  const { mutate: desglosarHito, isPending: isDesglosando } = useDesglosarHito()
  const { data: hitosEstrategicos } = useEstrategica()

  const [titulo, setTitulo] = useState(hitoToEdit?.titulo || '')
  const [campoId, setCampoId] = useState(hitoToEdit?.campo_id || '03')
  const [hitoEstrategicoId, setHitoEstrategicoId] = useState<string>(hitoToEdit?.hito_estrategico_id || '')
  const [fechaLimite, setFechaLimite] = useState(hitoToEdit?.fecha_limite || fechaDef)
  const [desglosadoFeedback, setDesglosadoFeedback] = useState(false)
  const [horaLimite, setHoraLimite] = useState(
    hitoToEdit?.hora_limite ||
      (hitoToEdit?.dependencia_hito_id?.startsWith('hora:')
        ? hitoToEdit.dependencia_hito_id.replace('hora:', '')
        : '10:00'),
  )

  const isEditing = Boolean(hitoToEdit && hitoToEdit.id)

  const handleStrategicHitoChange = (selectedId: string) => {
    setHitoEstrategicoId(selectedId)
    if (selectedId) {
      const match = hitosEstrategicos?.find(h => h.id === selectedId)
      if (match) setCampoId(match.campo_id)
    }
  }

  const handleSubmit = useCallback(() => {
    if (!titulo.trim()) return

    if (isEditing && hitoToEdit) {
      updateHito(
        {
          id: hitoToEdit.id,
          campo_id: campoId,
          hito_estrategico_id: hitoEstrategicoId || undefined,
          titulo: titulo.trim(),
          fecha_limite: fechaLimite,
          hora_limite: horaLimite || undefined,
          dependencia_hito_id: horaLimite ? `hora:${horaLimite}` : undefined,
        },
        { onSuccess: onClose },
      )
    } else {
      createHito(
        {
          campo_id: campoId,
          hito_estrategico_id: hitoEstrategicoId || undefined,
          titulo: titulo.trim(),
          fecha_limite: fechaLimite,
          hora_limite: horaLimite || undefined,
          progreso_manual: 0,
          estado: 'pendiente',
          dependencia_hito_id: horaLimite ? `hora:${horaLimite}` : undefined,
        },
        { onSuccess: onClose },
      )
    }
  }, [titulo, campoId, hitoEstrategicoId, fechaLimite, horaLimite, isEditing, hitoToEdit, updateHito, createHito, onClose])

  const handleDelete = useCallback(() => {
    if (hitoToEdit?.id) {
      if (window.confirm(`¿Estás seguro de eliminar el entregable "${hitoToEdit.titulo}"?`)) {
        deleteHito(hitoToEdit.id, { onSuccess: onClose })
      }
    }
  }, [hitoToEdit, deleteHito, onClose])

  const handleDesglosar = useCallback(() => {
    if (hitoToEdit?.id) {
      desglosarHito(hitoToEdit.id, {
        onSuccess: () => {
          setDesglosadoFeedback(true)
          setTimeout(() => {
            setDesglosadoFeedback(false)
            onClose()
          }, 1200)
        },
      })
    }
  }, [hitoToEdit, desglosarHito, onClose])

  const selectedCampo = getCampoConfig(campoId)

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111111] border border-[#2a2a2a] p-5 w-full max-w-md space-y-3.5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5" style={{ backgroundColor: selectedCampo.color }} />
            <h3 className="text-xs font-mono font-bold text-white uppercase">
              {isEditing ? 'EDITAR ENTREGABLE TÁCTICO' : 'NUEVO ENTREGABLE / HITO TÁCTICO'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 font-mono">
          <div>
            <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Título del Entregable</label>
            <input
              autoFocus
              placeholder="Ej. Cierre de balance trimestral"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-[#080808] border border-[#262626] px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition font-sans"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-300 block mb-1 uppercase flex items-center gap-1">
              <Target size={11} className="text-neutral-400" />
              <span>Hito Estratégico Asociado (Opcional)</span>
            </label>
            <select
              value={hitoEstrategicoId}
              onChange={e => handleStrategicHitoChange(e.target.value)}
              className="w-full bg-[#080808] border border-[#262626] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white"
            >
              <option value="">-- Sin Hito Estratégico (Pertenece a Campo) --</option>
              {hitosEstrategicos?.map(he => {
                const c = getCampoConfig(he.campo_id)
                return (
                  <option key={he.id} value={he.id}>
                    [{c.id}] {he.titulo} ({he.fecha_target})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Campo</label>
              <select
                value={campoId}
                onChange={e => setCampoId(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white"
              >
                {CAMPOS_CONFIG.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.id}] {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Fecha</label>
              <input
                type="date"
                value={fechaLimite}
                onChange={e => setFechaLimite(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>

            <div className="col-span-1">
              <label className="text-[10px] text-neutral-300 block mb-1 uppercase">Hora</label>
              <input
                type="time"
                value={horaLimite}
                onChange={e => setHoraLimite(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Desglosar Button in Edit Mode */}
          {isEditing && (
            <div className="pt-2 border-t border-[#1f1f1f]">
              <button
                type="button"
                onClick={handleDesglosar}
                disabled={isDesglosando || desglosadoFeedback}
                className="w-full py-1.5 px-3 bg-[#181818] hover:bg-[#222222] border border-[#333333] hover:border-white text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Genera automáticamente 3 tareas accionables en el Inbox a partir de este hito táctico"
              >
                {desglosadoFeedback ? (
                  <>
                    <Sparkles size={12} className="text-yellow-400" />
                    <span>¡3 TAREAS CREADAS EN INBOX!</span>
                  </>
                ) : (
                  <>
                    <ListTree size={12} />
                    <span>{isDesglosando ? 'DESGLOSANDO...' : 'DESGLOSAR EN 3 TAREAS HIJAS'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-[#222222]">
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
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-neutral-300 text-xs font-mono border border-[#262626] transition"
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating || !titulo.trim()}
              className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold transition disabled:opacity-40"
            >
              {isCreating || isUpdating ? 'GUARDANDO...' : isEditing ? 'GUARDAR CAMBIOS' : 'CREAR ENTREGABLE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const WEEK_DAY_LABELS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']

interface DayCellProps {
  date: Date
  isToday: boolean
  isCurrentMonth: boolean
  hitos: HitoTactico[]
  onAddHito: (fecha: string) => void
  onEditHito: (hito: HitoTactico) => void
}

function CompactDayCell({
  date,
  isToday,
  isCurrentMonth,
  hitos,
  onAddHito,
  onEditHito,
}: DayCellProps) {
  const { mutate: updateHito } = useUpdateHitoTactico()
  const fechaISO = formatDateISO(date)

  const handleToggle = useCallback(
    (e: React.MouseEvent, h: HitoTactico) => {
      e.stopPropagation()
      const nuevoEstado = h.estado === 'completado' ? 'pendiente' : 'completado'
      updateHito({ id: h.id, estado: nuevoEstado, progreso_manual: nuevoEstado === 'completado' ? 1.0 : 0.0 })
    },
    [updateHito],
  )

  return (
    <div
      onClick={() => onAddHito(fechaISO)}
      className={[
        'p-2 flex flex-col justify-between transition group cursor-pointer relative overflow-hidden border',
        isToday
          ? 'bg-[#222222] border-white ring-1 ring-white/40 shadow-lg'
          : isCurrentMonth
          ? 'bg-[#121212] border-[#242424] hover:bg-[#1a1a1a] hover:border-[#383838]'
          : 'bg-[#050505] border-[#141414] opacity-40 hover:opacity-75',
      ].join(' ')}
    >
      {/* Day header: Clear Date number with solid high-contrast styling */}
      <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
        <span
          className={[
            'font-bold px-1 py-0.2',
            isToday
              ? 'text-black bg-white font-extrabold'
              : isCurrentMonth
              ? 'text-white bg-[#1c1c1c]'
              : 'text-neutral-500',
          ].join(' ')}
        >
          {date.getDate()}
        </span>
        <button
          onClick={e => {
            e.stopPropagation()
            onAddHito(fechaISO)
          }}
          className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-white p-0.5 transition"
          title="Agregar entregable"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Deliverable cards with solid high contrast */}
      <div className="flex-1 space-y-1 overflow-y-auto min-h-[30px]">
        {hitos.map(h => {
          const campo = getCampoConfig(h.campo_id)
          const isDone = h.estado === 'completado'
          return (
            <div
              key={h.id}
              onClick={e => {
                e.stopPropagation()
                onEditHito(h)
              }}
              className={[
                'p-1.5 text-black font-mono font-bold text-[9px] flex items-center justify-between gap-1 shadow-md uppercase group/item truncate hover:brightness-115 cursor-pointer border border-black/40',
                isDone ? 'opacity-40 line-through' : '',
              ].join(' ')}
              style={{ backgroundColor: campo.color }}
              title={`Clic para editar entregable: ${h.titulo}`}
            >
              <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                <button
                  onClick={e => handleToggle(e, h)}
                  className="w-2.5 h-2.5 bg-black/20 hover:bg-black/50 flex items-center justify-center flex-shrink-0"
                >
                  {isDone && <Check size={7} strokeWidth={3} />}
                </button>
                <span className="truncate">{h.titulo}</span>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                {h.hora_limite && (
                  <span className="text-[7.5px] opacity-90 font-normal">
                    {h.hora_limite}
                  </span>
                )}
                <Edit3 size={8} className="opacity-0 group-hover/item:opacity-100 ml-0.5" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TacticaTab() {
  const { data: hitos, isLoading, isError } = useTactica()
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date())
  const [addingDate, setAddingDate] = useState<string | null>(null)
  const [editingHito, setEditingHito] = useState<HitoTactico | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollTime = useRef<number>(0)

  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = getMonday(firstDay)

    return Array.from({ length: 35 }, (_, i) => addDays(startDate, i))
  }, [currentMonthDate])

  const todayISO = formatDateISO(new Date())
  const currentMonthIdx = currentMonthDate.getMonth()

  const hitosByDate = useMemo(() => {
    const map: Record<string, HitoTactico[]> = {}
    hitos?.forEach(h => {
      const d = h.fecha_limite
      if (!map[d]) map[d] = []
      map[d].push(h)
    })
    return map
  }, [hitos])

  const monthLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()
  }, [currentMonthDate])

  const handlePrevMonth = useCallback(() => {
    setCurrentMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }, [])

  const handleCurrentMonth = useCallback(() => {
    setCurrentMonthDate(new Date())
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = Date.now()
      if (now - lastScrollTime.current < 250) return
      if (Math.abs(e.deltaY) < 20) return

      lastScrollTime.current = now
      if (e.deltaY > 0) {
        handleNextMonth()
      } else {
        handlePrevMonth()
      }
    },
    [handleNextMonth, handlePrevMonth],
  )

  if (isLoading) {
    return (
      <div className="h-full p-3 grid grid-cols-7 gap-2 animate-pulse bg-black">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="bg-[#111111]" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-600 font-mono text-xs">
        ERR_TACTICA_LOAD
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="h-full flex flex-col p-4 space-y-3 bg-black overflow-hidden select-none"
    >
      {/* Top Bar - Month Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#222222] flex-shrink-0 font-mono">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1 bg-[#111111] hover:bg-[#1c1c1c] text-neutral-300 hover:text-white border border-[#242424] transition"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={handleCurrentMonth}
            className="px-2.5 py-1 bg-[#111111] hover:bg-[#1c1c1c] text-white text-[10px] border border-[#242424] transition uppercase font-bold"
          >
            HOY
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 bg-[#111111] hover:bg-[#1c1c1c] text-neutral-300 hover:text-white border border-[#242424] transition"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={13} />
          </button>
          <span className="text-xs font-bold text-white uppercase ml-2">
            PLANIFICACIÓN TÁCTICA · {monthLabel}
          </span>
          <span className="text-[9px] text-neutral-500 ml-2 hidden sm:inline">
            [SCROLL PARA CAMBIAR DE MES]
          </span>
        </div>

        <button
          onClick={() => {
            setEditingHito(null)
            setAddingDate(formatDateISO(new Date()))
          }}
          className="flex items-center gap-1 px-3 py-1 bg-white text-black text-xs font-bold hover:bg-neutral-200 transition"
        >
          <Plus size={12} /> NUEVO ENTREGABLE
        </button>
      </div>

      {/* Week Day Header */}
      <div className="grid grid-cols-7 gap-2 font-mono text-[10px] text-center">
        {WEEK_DAY_LABELS.map(day => (
          <div key={day} className="text-white font-bold py-1 bg-[#181818] border border-[#242424]">
            {day}
          </div>
        ))}
      </div>

      {/* Full Month Grid (High contrast blocks with distinct borders) */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-2 min-h-0">
        {calendarDays.map(day => {
          const dayISO = formatDateISO(day)
          const isToday = dayISO === todayISO
          const isCurrentMonth = day.getMonth() === currentMonthIdx
          const dayHitos = hitosByDate[dayISO] ?? []

          return (
            <CompactDayCell
              key={dayISO}
              date={day}
              isToday={isToday}
              isCurrentMonth={isCurrentMonth}
              hitos={dayHitos}
              onAddHito={fecha => {
                setEditingHito(null)
                setAddingDate(fecha)
              }}
              onEditHito={hito => {
                setAddingDate(null)
                setEditingHito(hito)
              }}
            />
          )
        })}
      </div>

      {/* Modal for Creating or Editing Tactical Milestone */}
      {(addingDate || editingHito) && (
        <HitoTacticoModal
          fechaDef={addingDate || editingHito?.fecha_limite || formatDateISO(new Date())}
          hitoToEdit={editingHito}
          onClose={() => {
            setAddingDate(null)
            setEditingHito(null)
          }}
        />
      )}
    </div>
  )
}
