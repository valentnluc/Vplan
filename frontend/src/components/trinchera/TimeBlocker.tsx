import { useMemo, useCallback, useState, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronLeft, ChevronRight, Check, Edit3, Trash2, Undo2, Layers, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useTareasSemana, useTactica } from '../../api/queries'
import { useDesagendarTarea, useToggleTarea, useAgendarTarea, useDeleteTarea } from '../../api/mutations'
import {
  getCampoConfig,
  formatDateISO,
  addDays,
  parseTimeToMinutes,
  minutesToTimeString,
  VENTANAS_CIRCADIANAS_CONFIG,
  IMPORTANCIA_CONFIG,
  type Tarea,
  type HitoTactico,
} from '../../types'

// ── Daily Operating Hours (07:00 a 23:00) ─────────────────────────────────────
const START_HOUR = 7
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i) // 7 to 23
const ROW_HEIGHT_PX = 60 // 30px per 30-min block
const HALF_HOUR_PX = 30

export type ZoomMode = 3 | 7

function getWindowForHour(hour: number) {
  const midMin = hour * 60 + 30
  return VENTANAS_CIRCADIANAS_CONFIG.find(w => midMin >= w.startMin && midMin < w.endMin)
}

function getTaskHeightPx(duracionMin: number) {
  const blocks = Math.max(1, Math.round(duracionMin / 30))
  return Math.max(26, blocks * HALF_HOUR_PX - 2)
}

// ── Half-Hour Subslot Drop Zone ───────────────────────────────────────────────
interface HalfHourSubslotProps {
  id: string
  dayISO: string
  timeString: string
  tasks: Tarea[]
  hitos: HitoTactico[]
  onDesagendar: (tareaId: string) => void
  onEmptySlotClick: (dayISO: string, timeString: string) => void
}

function HalfHourSubslot({
  id,
  dayISO,
  timeString,
  tasks,
  hitos,
  onDesagendar,
  onEmptySlotClick,
}: HalfHourSubslotProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && tasks.length === 0 && hitos.length === 0) {
        onEmptySlotClick(dayISO, timeString)
      }
    },
    [dayISO, timeString, tasks.length, hitos.length, onEmptySlotClick],
  )

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={[
        'h-[30px] p-0.5 transition-colors flex flex-col justify-start gap-1 min-w-0 relative cursor-pointer hover:bg-white/[0.04]',
        isOver ? 'bg-[#222222] ring-1 ring-white z-30' : 'bg-transparent',
      ].join(' ')}
    >
      {/* Tactical Milestones: Solid block with ◆ */}
      {hitos.map(h => {
        const campo = getCampoConfig(h.campo_id)
        return (
          <div
            key={h.id}
            onClick={e => e.stopPropagation()}
            className="w-full px-1.5 py-0.5 text-black font-mono font-bold text-[9px] flex items-center justify-between gap-1 shadow-sm uppercase border border-black/30 truncate z-10"
            style={{ backgroundColor: campo.color }}
            title={`HITO: ${h.titulo}`}
          >
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-[9px] flex-shrink-0">◆</span>
              <span className="truncate">{h.titulo}</span>
            </div>
            {h.hora_limite && (
              <span className="text-[8px] opacity-90 flex-shrink-0 font-normal">
                {h.hora_limite}
              </span>
            )}
          </div>
        )
      })}

      {/* Scheduled Tasks */}
      {tasks.map(t => (
        <CalendarTaskItem
          key={t.id}
          tarea={t}
          onDesagendar={onDesagendar}
        />
      ))}
    </div>
  )
}

// ── Hour Slot Container (Subtle lines #121212) ─────────────────────────────────
interface HourDropSlotProps {
  dayISO: string
  hour: number
  tasksFirstHalf: Tarea[]
  tasksSecondHalf: Tarea[]
  hitosFirstHalf: HitoTactico[]
  hitosSecondHalf: HitoTactico[]
  onDesagendar: (tareaId: string) => void
  onEmptySlotClick: (dayISO: string, timeString: string) => void
  showCircadianLayers: boolean
  isToday: boolean
}

function HourDropSlot({
  dayISO,
  hour,
  tasksFirstHalf,
  tasksSecondHalf,
  hitosFirstHalf,
  hitosSecondHalf,
  onDesagendar,
  onEmptySlotClick,
  showCircadianLayers,
  isToday,
}: HourDropSlotProps) {
  const currentWindow = useMemo(() => getWindowForHour(hour), [hour])

  const circadianBg = useMemo(() => {
    if (!showCircadianLayers || !currentWindow) {
      return isToday ? '#0d0d0d' : undefined
    }
    return isToday ? `${currentWindow.color}30` : `${currentWindow.color}20`
  }, [showCircadianLayers, currentWindow, isToday])

  const hourFormatted = String(hour).padStart(2, '0')
  const slot00Id = `${dayISO}__${hourFormatted}:00`
  const slot30Id = `${dayISO}__${hourFormatted}:30`

  return (
    <div
      className={[
        'h-[60px] border-b border-r border-[#121212] transition-all relative flex flex-col justify-start min-w-0',
        isToday ? 'bg-[#0a0a0a]' : 'bg-black',
      ].join(' ')}
      style={{
        backgroundColor: circadianBg,
      }}
    >
      <HalfHourSubslot
        id={slot00Id}
        dayISO={dayISO}
        timeString={`${hourFormatted}:00`}
        tasks={tasksFirstHalf}
        hitos={hitosFirstHalf}
        onDesagendar={onDesagendar}
        onEmptySlotClick={onEmptySlotClick}
      />
      <HalfHourSubslot
        id={slot30Id}
        dayISO={dayISO}
        timeString={`${hourFormatted}:30`}
        tasks={tasksSecondHalf}
        hitos={hitosSecondHalf}
        onDesagendar={onDesagendar}
        onEmptySlotClick={onEmptySlotClick}
      />
    </div>
  )
}

// ── Calendar Task Item (Minimal card styling) ─────────────────────────────────
interface CalendarTaskItemProps {
  tarea: Tarea
  onDesagendar: (id: string) => void
}

function CalendarTaskItem({ tarea, onDesagendar }: CalendarTaskItemProps) {
  const campo = getCampoConfig(tarea.campo_id)
  const openEditTaskModal = useAppStore(s => s.openEditTaskModal)
  const { mutate: toggleTarea } = useToggleTarea()
  const { mutate: deleteTarea } = useDeleteTarea()

  const [isSelected, setIsSelected] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tarea.id,
    data: tarea,
  })

  const heightPx = useMemo(() => getTaskHeightPx(tarea.duracion_min || 60), [tarea.duracion_min])

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeft: `3px solid ${campo.color}`,
    height: `${heightPx}px`,
    opacity: isDragging ? 0.3 : 1,
  }

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleTarea({ id: tarea.id, completada: !tarea.completada })
    },
    [tarea.id, tarea.completada, toggleTarea],
  )

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSelected(prev => !prev)
  }, [])

  const impConf = tarea.importancia ? IMPORTANCIA_CONFIG[tarea.importancia] : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={[
        'w-full p-1.5 bg-[#1a1a1a] border border-[#2a2a2a] flex flex-col justify-between group cursor-grab active:cursor-grabbing hover:bg-[#222222] hover:border-[#383838] transition select-none shadow-md z-20 absolute top-0 left-0 right-0',
        isSelected ? 'ring-1 ring-white bg-[#262626]' : '',
        tarea.completada ? 'opacity-30' : '',
      ].join(' ')}
    >
      {/* Top Row: Checkbox + Priority Badge (Left) | Action Icons & Duration Pill (Right) */}
      <div className="flex items-center justify-between gap-1.5 w-full flex-shrink-0">
        {/* Left: Checkbox and Priority Badge */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={handleToggle}
            className={[
              'w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 transition',
              tarea.completada
                ? 'bg-white border-white text-black'
                : 'border-[#333333] hover:border-white bg-transparent',
            ].join(' ')}
            aria-label="Toggle"
          >
            {tarea.completada && <Check size={9} strokeWidth={3} />}
          </button>

          {impConf && (
            <span
              className="text-[8px] font-mono font-bold px-1 py-0.2"
              style={{
                color: impConf.color,
                backgroundColor: `${impConf.color}18`,
              }}
            >
              {impConf.tag}
            </span>
          )}
        </div>

        {/* Right: Actions on hover + Duration Pill */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* In short tasks (<= 45m), action icons appear here seamlessly next to duration without taking vertical space */}
          {heightPx < 65 && (
            <div
              className={[
                'items-center gap-0.5 transition-all',
                isSelected ? 'flex' : 'hidden group-hover:flex',
              ].join(' ')}
            >
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => {
                  e.stopPropagation()
                  openEditTaskModal(tarea)
                }}
                className="p-0.5 text-neutral-300 hover:text-white transition"
                title="Editar tarea"
              >
                <Edit3 size={10} />
              </button>

              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => {
                  e.stopPropagation()
                  onDesagendar(tarea.id)
                }}
                className="p-0.5 text-neutral-300 hover:text-yellow-400 transition"
                title="Volver al Inbox (⤺)"
              >
                <Undo2 size={10} />
              </button>

              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => {
                  e.stopPropagation()
                  deleteTarea(tarea.id)
                }}
                className="p-0.5 text-neutral-400 hover:text-red-400 transition"
                title="Eliminar tarea definitivamente"
              >
                <Trash2 size={10} />
              </button>
            </div>
          )}

          {/* Duration Pill at top right */}
          <span className="text-[8px] font-mono text-neutral-400 bg-[#141414] px-1.5 py-0.2 font-semibold flex-shrink-0">
            {tarea.duracion_min}m
          </span>
        </div>
      </div>

      {/* Task Content: Title + Subtitle Description (Below) */}
      <div className="flex-1 flex flex-col justify-center py-0.5 gap-0.5 min-w-0 overflow-hidden">
        <p
          className={[
            'text-[11px] font-sans font-medium text-white truncate leading-tight',
            tarea.completada ? 'line-through text-neutral-600' : 'text-neutral-100',
          ].join(' ')}
          title={tarea.titulo}
        >
          {tarea.titulo}
        </p>

        {tarea.descripcion && heightPx >= 75 && (
          <p
            className={[
              'text-[9px] font-sans text-neutral-500 line-clamp-1 leading-tight font-normal',
              tarea.completada ? 'line-through opacity-50' : '',
            ].join(' ')}
            title={tarea.descripcion}
          >
            {tarea.descripcion}
          </p>
        )}
      </div>

      {/* Action Bar for taller tasks (>= 65m) */}
      {heightPx >= 65 && (
        <div
          className={[
            'pt-1 border-t border-[#262626] flex items-center justify-between transition-all flex-shrink-0',
            isSelected ? 'flex' : 'hidden group-hover:flex',
          ].join(' ')}
        >
          <div className="flex items-center gap-1">
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                openEditTaskModal(tarea)
              }}
              className="p-1 bg-[#141414] hover:bg-white hover:text-black text-neutral-300 transition"
              title="Editar tarea"
            >
              <Edit3 size={11} />
            </button>

            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                onDesagendar(tarea.id)
              }}
              className="p-1 bg-[#141414] hover:bg-yellow-400 hover:text-black text-neutral-300 transition"
              title="Volver al Inbox (⤺)"
            >
              <Undo2 size={11} />
            </button>
          </div>

          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              deleteTarea(tarea.id)
            }}
            className="p-1 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition"
            title="Eliminar tarea definitivamente"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Day Header Component ──────────────────────────────────────────────────────
const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']

interface DayHeaderProps {
  date: Date
  isToday: boolean
}

function DayHeader({ date, isToday }: DayHeaderProps) {
  const dayIdx = date.getDay()

  return (
    <div
      className={[
        'p-1.5 text-center font-mono transition-all',
        isToday
          ? 'bg-neutral-200 text-black font-extrabold shadow-sm'
          : 'bg-black text-neutral-400',
      ].join(' ')}
    >
      <div className="flex items-center justify-between text-[11px] px-1.5">
        <span>{DAY_NAMES[dayIdx]}</span>
        <span className="text-xs font-bold">{date.getDate()}</span>
      </div>
    </div>
  )
}

// ── Current Time Indicator (Red Line) ─────────────────────────────────────────
function CurrentTimeIndicator({
  currentTime,
  isTodayInView,
}: {
  currentTime: Date
  isTodayInView: boolean
}) {
  if (!isTodayInView) return null

  const hours = currentTime.getHours()
  const minutes = currentTime.getMinutes()

  if (hours < START_HOUR || hours > END_HOUR) return null

  const hoursFromStart = hours - START_HOUR + minutes / 60
  const topPx = hoursFromStart * ROW_HEIGHT_PX

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
      style={{ top: `${topPx}px` }}
    >
      <div className="w-[60px] flex items-center justify-end pr-1">
        <span className="bg-[#ef4444] text-white text-[8px] font-mono font-bold px-0.5 py-0.2 rounded-none">
          {formattedTime}
        </span>
      </div>
      <div className="w-2 h-2 bg-[#ef4444] rounded-full -ml-1 shadow-sm" />
      <div className="flex-1 h-[2px] bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
    </div>
  )
}

// ── Main TimeBlocker ──────────────────────────────────────────────────────────
export default function TimeBlocker() {
  const {
    currentWeekStart,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    showCircadianLayers,
    toggleCircadianLayers,
    openCreateTaskModal,
  } = useAppStore()

  const [zoomMode, setZoomMode] = useState<ZoomMode>(7)
  const [autoPlanDone, setAutoPlanDone] = useState(false)

  const { mutate: desagendar } = useDesagendarTarea()
  const { mutate: agendar } = useAgendarTarea()

  const startDateISO = formatDateISO(currentWeekStart)
  const { data: tareasSemana } = useTareasSemana(startDateISO)
  const { data: hitosTacticos } = useTactica()

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const visibleDays = useMemo(
    () => Array.from({ length: zoomMode }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart, zoomMode],
  )

  const todayISO = formatDateISO(new Date())
  const isTodayInView = visibleDays.some(d => formatDateISO(d) === todayISO)

  const tasksByExactSlot = useMemo(() => {
    const map: Record<string, Tarea[]> = {}
    tareasSemana?.forEach(t => {
      if (t.fecha_agendada) {
        let timeKey = '09:00'
        const timeVal = t.hora_inicio || t.franja_agendada

        if (timeVal && timeVal.includes(':')) {
          const [hStr, mStr] = timeVal.split(':')
          const h = parseInt(hStr, 10)
          const m = parseInt(mStr, 10)
          const safeH = isNaN(h) ? 9 : h
          const safeM = isNaN(m) ? 0 : m
          const roundedM = safeM >= 30 ? '30' : '00'
          timeKey = `${String(safeH).padStart(2, '0')}:${roundedM}`
        } else {
          timeKey = '09:00'
        }

        const key = `${t.fecha_agendada}__${timeKey}`
        if (!map[key]) map[key] = []
        map[key].push(t)
      }
    })
    return map
  }, [tareasSemana])

  const hitosByExactSlot = useMemo(() => {
    const map: Record<string, HitoTactico[]> = {}
    hitosTacticos?.forEach(h => {
      let timeKey = '09:00'
      const timeVal = h.hora_limite || (h.dependencia_hito_id?.startsWith('hora:') ? h.dependencia_hito_id.replace('hora:', '') : '09:00')

      if (timeVal && timeVal.includes(':')) {
        const [hStr, mStr] = timeVal.split(':')
        const h = parseInt(hStr, 10)
        const m = parseInt(mStr, 10)
        const safeH = isNaN(h) ? 9 : h
        const safeM = isNaN(m) ? 0 : m
        const roundedM = safeM >= 30 ? '30' : '00'
        timeKey = `${String(safeH).padStart(2, '0')}:${roundedM}`
      }

      const key = `${h.fecha_limite}__${timeKey}`
      if (!map[key]) map[key] = []
      map[key].push(h)
    })
    return map
  }, [hitosTacticos])

  const handleDesagendar = useCallback(
    (tareaId: string) => desagendar({ tarea_id: tareaId }),
    [desagendar],
  )

  const handleEmptySlotClick = useCallback(
    (dayISO: string, timeString: string) => {
      openCreateTaskModal({
        fecha_agendada: dayISO,
        hora_inicio: timeString,
        franja_agendada: timeString,
      })
    },
    [openCreateTaskModal],
  )

  // Auto-Plan HOY with STRICT Non-Overlapping Slot Allocation
  const handleAutoPlanHoy = useCallback(() => {
    if (!tareasSemana || tareasSemana.length === 0) return
    const tareasDeHoy = tareasSemana.filter(t => t.fecha_agendada === todayISO && !t.completada)

    if (tareasDeHoy.length === 0) return

    const preferredSlotsByType: Record<string, string[]> = {
      trabajo_pesado: ['09:00', '10:00', '11:00', '16:00', '16:30', '08:30', '11:30'],
      trabajo_liviano: ['13:00', '13:30', '19:00', '19:30', '20:00'],
      trabajo_creativo: ['14:00', '15:00', '21:00', '22:00', '14:30', '15:30', '21:30'],
      ejercicio: ['17:30', '18:00'],
      recuperacion: ['23:00'],
    }

    const allCandidateSlots: string[] = []
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const hStr = String(h).padStart(2, '0')
      allCandidateSlots.push(`${hStr}:00`)
      allCandidateSlots.push(`${hStr}:30`)
    }

    const occupiedIntervals: { start: number; end: number }[] = []

    tareasDeHoy.forEach(tarea => {
      const duracion = tarea.duracion_min || 60
      let tipo = tarea.tipo_circadiano || (tarea.es_deep_work ? 'trabajo_pesado' : 'trabajo_pesado')

      const candidateList = [
        ...(preferredSlotsByType[tipo] || []),
        ...allCandidateSlots,
      ]

      let assignedStartMin: number | null = null
      for (const slot of candidateList) {
        const sMin = parseTimeToMinutes(slot)
        const eMin = sMin + duracion

        if (eMin > (END_HOUR + 1) * 60) continue

        const overlaps = occupiedIntervals.some(
          occ => sMin < occ.end && eMin > occ.start,
        )

        if (!overlaps) {
          assignedStartMin = sMin
          occupiedIntervals.push({ start: sMin, end: eMin })
          break
        }
      }

      if (assignedStartMin !== null) {
        const assignedTime = minutesToTimeString(assignedStartMin)
        agendar({
          tarea_id: tarea.id,
          fecha_agendada: todayISO,
          franja_agendada: assignedTime,
        })
      }
    })

    setAutoPlanDone(true)
    setTimeout(() => setAutoPlanDone(false), 2000)
  }, [tareasSemana, todayISO, agendar])

  const weekLabel = useMemo(() => {
    const end = addDays(currentWeekStart, zoomMode - 1)
    const fmt = (d: Date) =>
      d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    return `${fmt(currentWeekStart)} – ${fmt(end)} ${end.getFullYear()}`
  }, [currentWeekStart, zoomMode])

  const gridTemplateCols = useMemo(() => {
    const colFrs = visibleDays.map(day => {
      const isToday = formatDateISO(day) === todayISO
      return isToday ? '1.35fr' : '1fr'
    })
    return `60px ${colFrs.join(' ')}`
  }, [visibleDays, todayISO])

  return (
    <div className="flex-1 bg-black border border-[#141414] p-2.5 flex flex-col gap-2 overflow-hidden min-w-0 select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 flex-shrink-0 pb-2 border-b border-[#141414]">
        {/* Left: View selector [3 DÍAS / 7 DÍAS] alongside Nav controls [◀ HOY ▶] */}
        <div className="flex items-center gap-1.5 font-mono">
          <div className="flex items-center gap-0.5 bg-[#050505] p-0.5 text-[9px] border border-[#141414]">
            {([3, 7] as ZoomMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setZoomMode(mode)}
                className={[
                  'px-2 py-0.5 font-bold transition',
                  zoomMode === mode
                    ? 'bg-white text-black'
                    : 'text-neutral-500 hover:text-white hover:bg-[#111111]',
                ].join(' ')}
              >
                {mode} DÍAS
              </button>
            ))}
          </div>

          <button
            onClick={goToPrevWeek}
            className="p-1 bg-black hover:bg-[#111111] text-neutral-400 hover:text-white transition"
            aria-label="Anterior"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-2.5 py-1 bg-black hover:bg-[#111111] text-neutral-300 hover:text-white text-[10px] font-mono transition uppercase"
          >
            HOY
          </button>
          <button
            onClick={goToNextWeek}
            className="p-1 bg-black hover:bg-[#111111] text-neutral-400 hover:text-white transition"
            aria-label="Siguiente"
          >
            <ChevronRight size={13} />
          </button>
          <span className="text-[11px] font-mono font-bold text-white uppercase ml-1">
            {weekLabel}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={handleAutoPlanHoy}
            className={[
              'flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition',
              autoPlanDone
                ? 'bg-[#22c55e] text-black'
                : 'bg-white text-black hover:bg-neutral-200',
            ].join(' ')}
            title="Auto-organiza las tareas asignadas a HOY en sus franjas biológicas ideales garantizando 0 solapamientos"
          >
            {autoPlanDone ? <CheckCircle2 size={11} /> : <Sparkles size={11} />}
            <span>{autoPlanDone ? '¡PLANIFICADO!' : 'AUTO-PLAN HOY'}</span>
          </button>

          <button
            onClick={toggleCircadianLayers}
            className={[
              'flex items-center gap-1 px-2.5 py-1 text-[10px] transition',
              showCircadianLayers
                ? 'bg-white text-black font-bold'
                : 'bg-black text-neutral-500 hover:text-white hover:bg-[#111111]',
            ].join(' ')}
          >
            <Layers size={11} />
            <span>ZONAS [{showCircadianLayers ? 'ON' : 'OFF'}]</span>
          </button>
        </div>
      </div>

      {/* Unified Calendar Grid with Clean Minimal Lines */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0 border border-[#141414] relative">
        {/* Sticky Day Headers */}
        <div
          className="grid bg-black sticky top-0 z-20 border-b border-[#141414]"
          style={{ gridTemplateColumns: gridTemplateCols }}
        >
          <div className="p-1 font-mono text-[9px] text-neutral-600 flex items-center justify-center border-r border-[#141414]">
            HORA
          </div>
          {visibleDays.map(day => {
            const dayISO = formatDateISO(day)
            const isToday = dayISO === todayISO
            return (
              <div
                key={dayISO}
                className={[
                  'border-r last:border-r-0 border-[#141414] min-w-0 transition-all',
                  isToday ? 'bg-[#141414]' : '',
                ].join(' ')}
              >
                <DayHeader date={day} isToday={isToday} />
              </div>
            )
          })}
        </div>

        {/* Scrollable Hourly Body */}
        <div className="flex-1 relative">
          <CurrentTimeIndicator currentTime={now} isTodayInView={isTodayInView} />

          {HOURS.map(hour => {
            const hourFormatted = String(hour).padStart(2, '0')
            const hourDisplay = `${hourFormatted}:00`
            const currentWindow = getWindowForHour(hour)
            const prevWindow = getWindowForHour(hour - 1)
            const isStartOfWindow = Boolean(currentWindow && (!prevWindow || prevWindow.id !== currentWindow.id))

            return (
              <div
                key={hour}
                className="grid border-b border-[#121212]"
                style={{
                  gridTemplateColumns: gridTemplateCols,
                  height: `${ROW_HEIGHT_PX}px`,
                }}
              >
                {/* 1-Hour Label indicator with Vertical Zone Tag */}
                <div className="p-1 font-mono text-[9px] text-neutral-500 border-r border-[#141414] flex flex-col items-center justify-start bg-black relative">
                  {showCircadianLayers && isStartOfWindow && currentWindow && (
                    <div
                      className="w-full text-center text-[7px] font-bold px-0.5 py-0.2 uppercase truncate mb-1"
                      style={{
                        backgroundColor: currentWindow.color,
                        color: '#000000',
                      }}
                      title={currentWindow.label}
                    >
                      {currentWindow.tipo === 'trabajo_pesado'
                        ? 'PROFUNDO'
                        : currentWindow.tipo === 'trabajo_liviano'
                        ? 'LIVIANO'
                        : currentWindow.tipo === 'trabajo_creativo'
                        ? 'CREATIVO'
                        : 'EJERCICIO'}
                    </div>
                  )}

                  <span className="font-semibold text-neutral-500">{hourDisplay}</span>
                </div>

                {/* Visible Day Slots */}
                {visibleDays.map(day => {
                  const dayISO = formatDateISO(day)
                  const isToday = dayISO === todayISO

                  const slot00Key = `${dayISO}__${hourFormatted}:00`
                  const slot30Key = `${dayISO}__${hourFormatted}:30`

                  const tasksFirstHalf = tasksByExactSlot[slot00Key] ?? []
                  const tasksSecondHalf = tasksByExactSlot[slot30Key] ?? []

                  const hitosFirstHalf = hitosByExactSlot[slot00Key] ?? []
                  const hitosSecondHalf = hitosByExactSlot[slot30Key] ?? []

                  return (
                    <HourDropSlot
                      key={`${dayISO}__${hour}`}
                      dayISO={dayISO}
                      hour={hour}
                      tasksFirstHalf={tasksFirstHalf}
                      tasksSecondHalf={tasksSecondHalf}
                      hitosFirstHalf={hitosFirstHalf}
                      hitosSecondHalf={hitosSecondHalf}
                      onDesagendar={handleDesagendar}
                      onEmptySlotClick={handleEmptySlotClick}
                      showCircadianLayers={showCircadianLayers}
                      isToday={isToday}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
