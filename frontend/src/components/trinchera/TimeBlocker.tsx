import { useMemo, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, CalendarCheck, X, Clock } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useTareasSemana } from '../../api/queries'
import { useDesagendarTarea } from '../../api/mutations'
import { FRANJAS_CONFIG, getCampoConfig, formatDateISO, addDays } from '../../types'
import type { Tarea, FranjaId } from '../../types'

// ── Drop Zone ─────────────────────────────────────────────────────────────────
interface DropZoneProps {
  id: string // format: "2026-08-19__f1_manana"
  franjaLabel: string
  tasks: Tarea[]
  onDesagendar: (tareaId: string) => void
  isFirstCol: boolean
}

function DropZone({ id, franjaLabel, tasks, onDesagendar, isFirstCol }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-lg p-2 min-h-[80px] space-y-1.5 transition-colors',
        isOver
          ? 'border border-dashed border-slate-500 bg-slate-900'
          : 'border border-dashed border-slate-800 bg-slate-950',
      ].join(' ')}
    >
      {isFirstCol && (
        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">{franjaLabel}</p>
      )}
      {tasks.map(t => (
        <ScheduledTaskCard key={t.id} tarea={t} onDesagendar={onDesagendar} />
      ))}
    </div>
  )
}

// ── Scheduled Task (inside time block) ───────────────────────────────────────
interface ScheduledTaskCardProps {
  tarea: Tarea
  onDesagendar: (id: string) => void
}

function ScheduledTaskCard({ tarea, onDesagendar }: ScheduledTaskCardProps) {
  const campo = getCampoConfig(tarea.campo_id)
  return (
    <div
      className="p-2 bg-slate-900 border border-slate-800 rounded flex items-center gap-1.5 group"
      style={{ borderLeft: `3px solid ${campo.color}` }}
    >
      <span className="flex-1 text-[10px] text-slate-100 truncate" title={tarea.titulo}>
        {tarea.titulo}
      </span>
      <span className="flex items-center gap-0.5 text-[9px] text-slate-500 flex-shrink-0">
        <Clock size={8} />
        {tarea.duracion_min}m
      </span>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={() => onDesagendar(tarea.id)}
        className="opacity-0 group-hover:opacity-100 transition text-slate-500 hover:text-red-400 flex-shrink-0"
        aria-label="Desagendar tarea"
      >
        <X size={10} />
      </button>
    </div>
  )
}

// ── Day Header ────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface DayHeaderProps {
  date: Date
  isToday: boolean
}

function DayHeader({ date, isToday }: DayHeaderProps) {
  return (
    <div
      className={[
        'text-center pb-2 border-b',
        isToday ? 'border-slate-600' : 'border-slate-800',
      ].join(' ')}
    >
      <p className={`text-[10px] font-medium ${isToday ? 'text-slate-300' : 'text-slate-500'}`}>
        {DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1]}
      </p>
      <p
        className={[
          'text-sm font-bold mt-0.5',
          isToday
            ? 'text-white bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center mx-auto'
            : 'text-slate-400',
        ].join(' ')}
      >
        {date.getDate()}
      </p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TimeBlocker() {
  const { currentWeekStart, goToPrevWeek, goToNextWeek, goToCurrentWeek } = useAppStore()
  const { mutate: desagendar } = useDesagendarTarea()

  const startDateISO = formatDateISO(currentWeekStart)
  const { data: tareasSemana, isLoading } = useTareasSemana(startDateISO)

  // Build array of 7 day dates
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart],
  )

  const todayISO = formatDateISO(new Date())

  // Group tasks by dropzone id: "YYYY-MM-DD__franja_id"
  const tasksByZone = useMemo(() => {
    const map: Record<string, Tarea[]> = {}
    tareasSemana?.forEach(t => {
      if (t.fecha_agendada && t.franja_agendada) {
        const key = `${t.fecha_agendada}__${t.franja_agendada}`
        if (!map[key]) map[key] = []
        map[key].push(t)
      }
    })
    return map
  }, [tareasSemana])

  const handleDesagendar = useCallback(
    (tareaId: string) => desagendar({ tarea_id: tareaId }),
    [desagendar],
  )

  // Week range label
  const weekLabel = useMemo(() => {
    const end = addDays(currentWeekStart, 6)
    const fmt = (d: Date) =>
      d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    return `${fmt(currentWeekStart)} – ${fmt(end)} ${end.getFullYear()}`
  }, [currentWeekStart])

  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 overflow-hidden min-w-0">
      {/* Week navigation */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevWeek}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            aria-label="Semana anterior"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] transition flex items-center gap-1"
          >
            <CalendarCheck size={10} />
            Hoy
          </button>
          <button
            onClick={goToNextWeek}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            aria-label="Semana siguiente"
          >
            <ChevronRight size={13} />
          </button>
        </div>
        <span className="text-xs text-slate-400 capitalize">{weekLabel}</span>

        {/* Franja legend */}
        <div className="flex items-center gap-3">
          {FRANJAS_CONFIG.map(f => (
            <div key={f.id} className="text-right">
              <p className="text-[9px] text-slate-500">{f.label}</p>
              <p className="text-[9px] text-slate-600">{f.hours}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="animate-pulse grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-10 bg-slate-800 rounded" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-20 bg-slate-800 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, colIdx) => {
              const dayISO = formatDateISO(day)
              const isToday = dayISO === todayISO
              return (
                <div
                  key={dayISO}
                  className={[
                    'space-y-2 rounded-lg p-1',
                    isToday ? 'bg-slate-800/30 ring-1 ring-slate-700' : '',
                  ].join(' ')}
                >
                  <DayHeader date={day} isToday={isToday} />
                  {FRANJAS_CONFIG.map(franja => {
                    const zoneId = `${dayISO}__${franja.id}`
                    const zoneTasks = tasksByZone[zoneId] ?? []
                    return (
                      <DropZone
                        key={zoneId}
                        id={zoneId}
                        franjaLabel={franja.focus}
                        tasks={zoneTasks}
                        onDesagendar={handleDesagendar}
                        isFirstCol={colIdx === 0}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
