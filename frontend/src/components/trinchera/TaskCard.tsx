import { memo, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Edit3, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useDeleteTarea, useToggleTarea } from '../../api/mutations'
import { getCampoConfig, IMPORTANCIA_CONFIG } from '../../types'
import type { Tarea } from '../../types'

interface TaskCardProps {
  tarea: Tarea
  isDragging?: boolean
  onToggle?: (id: string, completada: boolean) => void
  isOverlay?: boolean
}

// Visual proportional heights with strong distinction in Inbox (Task Stream)
function getMinHeightForDuration(duracionMin: number): number {
  if (duracionMin <= 15) return 42  // 15m
  if (duracionMin <= 30) return 60  // 30m
  if (duracionMin <= 45) return 78  // 45m
  if (duracionMin <= 60) return 98  // 60m (1 hora)
  if (duracionMin <= 90) return 126 // 90m (1.5 horas)
  return 156                        // 120m (2 horas)
}

const TaskCard = memo(function TaskCard({
  tarea,
  isDragging,
  isOverlay,
}: TaskCardProps) {
  const campo = getCampoConfig(tarea.campo_id)
  const openEditTaskModal = useAppStore(s => s.openEditTaskModal)
  const { mutate: deleteTarea } = useDeleteTarea()
  const { mutate: toggleTarea } = useToggleTarea()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: tarea.id,
    disabled: isOverlay,
    data: tarea,
  })

  const minHeight = getMinHeightForDuration(tarea.duracion_min || 60)
  const impConf = tarea.importancia ? IMPORTANCIA_CONFIG[tarea.importancia] : null

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: 'transform',
    opacity: (isDragging || isSortableDragging) && !isOverlay ? 0.3 : 1,
    borderLeftColor: campo.color,
    minHeight: `${minHeight}px`,
  }

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleTarea({ id: tarea.id, completada: !tarea.completada })
    },
    [tarea.id, tarea.completada, toggleTarea],
  )

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      openEditTaskModal(tarea)
    },
    [tarea, openEditTaskModal],
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      deleteTarea(tarea.id)
    },
    [tarea.id, deleteTarea],
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'p-2 bg-[#141414] border border-[#222222] border-l-2',
        'flex flex-col justify-between',
        'cursor-grab active:cursor-grabbing group select-none transition-all',
        'hover:bg-[#1c1c1c] hover:border-[#333333]',
        isOverlay ? 'shadow-2xl border-white bg-black ring-1 ring-white' : '',
        tarea.completada ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top row: Checkbox & Badges (Left) | Action Buttons & Duration Pill (Right) */}
      <div className="flex items-center justify-between gap-1.5 w-full">
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
            {tarea.completada && <Check size={10} strokeWidth={3} />}
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

        {/* Right: Action Buttons at the LEFT of the duration pill */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Action buttons (Edit & Delete) on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={handleEdit}
              className="p-0.5 text-neutral-400 hover:text-white transition"
              aria-label="Editar"
              title="Editar tarea"
            >
              <Edit3 size={11} />
            </button>

            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={handleDelete}
              className="p-0.5 text-neutral-400 hover:text-red-400 transition"
              aria-label="Eliminar"
              title="Eliminar tarea"
            >
              <Trash2 size={11} />
            </button>
          </div>

          {/* Duration Pill at the far right */}
          <span className="text-neutral-400 font-mono text-[9px] bg-[#141414] px-1.5 py-0.5 font-semibold">
            {tarea.duracion_min}m
          </span>
        </div>
      </div>

      {/* Task Content: Title + Subtitle Description */}
      <div className="flex-1 flex flex-col justify-center py-1 gap-0.5">
        <p
          className={[
            'text-[11px] font-sans font-medium text-white line-clamp-2 leading-tight',
            tarea.completada ? 'line-through text-neutral-600' : 'text-neutral-100',
          ].join(' ')}
          title={tarea.titulo}
        >
          {tarea.titulo}
        </p>

        {tarea.descripcion && (
          <p
            className={[
              'text-[9px] font-sans text-neutral-500 line-clamp-2 leading-tight font-normal',
              tarea.completada ? 'line-through opacity-50' : '',
            ].join(' ')}
            title={tarea.descripcion}
          >
            {tarea.descripcion}
          </p>
        )}
      </div>
    </div>
  )
})

export default TaskCard
