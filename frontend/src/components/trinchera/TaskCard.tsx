import { memo, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Zap, Clock, CheckCircle2, Circle } from 'lucide-react'
import { getCampoConfig } from '../../types'
import type { Tarea } from '../../types'

interface TaskCardProps {
  tarea: Tarea
  isDragging?: boolean
  onToggle?: (id: string, completada: boolean) => void
  /** When true, shows the card in overlay (clone) mode */
  isOverlay?: boolean
}

const TaskCard = memo(function TaskCard({ tarea, isDragging, onToggle, isOverlay }: TaskCardProps) {
  const campo = getCampoConfig(tarea.campo_id)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({
      id: tarea.id,
      disabled: isOverlay,
      data: tarea,
    })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: 'transform',
    opacity: (isDragging || isSortableDragging) && !isOverlay ? 0.4 : 1,
    borderLeftColor: campo.color,
  }

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle?.(tarea.id, !tarea.completada)
    },
    [tarea.id, tarea.completada, onToggle],
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'p-2.5 bg-slate-950 border-l-4 border-y border-r border-slate-800 rounded-r-lg',
        'flex items-center justify-between gap-2',
        'cursor-grab active:cursor-grabbing',
        'hover:border-slate-700 transition select-none',
        isOverlay ? 'shadow-2xl ring-1 ring-slate-600' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Checkbox */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={handleToggle}
        className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition"
        aria-label={tarea.completada ? 'Marcar pendiente' : 'Completar tarea'}
      >
        {tarea.completada ? (
          <CheckCircle2 size={14} className="text-green-500" />
        ) : (
          <Circle size={14} />
        )}
      </button>

      {/* Title */}
      <span
        className={[
          'flex-1 text-xs min-w-0 truncate',
          tarea.completada ? 'line-through text-slate-500' : 'text-slate-100',
        ].join(' ')}
        title={tarea.titulo}
      >
        {tarea.titulo}
      </span>

      {/* Right side: duration + deep work */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {tarea.es_deep_work && (
          <Zap size={11} className="text-yellow-400" aria-label="Deep Work" />
        )}
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">
          <Clock size={9} />
          {tarea.duracion_min}m
        </span>
      </div>
    </div>
  )
})

export default TaskCard
