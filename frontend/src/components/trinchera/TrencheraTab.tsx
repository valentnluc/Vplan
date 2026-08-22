import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { useAppStore } from '../../store/appStore'
import { useTareasSemana } from '../../api/queries'
import { useAgendarTarea } from '../../api/mutations'
import { parseTimeToMinutes, formatDateISO, type Tarea } from '../../types'
import TaskStream from './TaskStream'
import TimeBlocker from './TimeBlocker'
import TaskCard from './TaskCard'

export default function TrencheraTab() {
  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null)
  const currentWeekStart = useAppStore(s => s.currentWeekStart)
  const startDateISO = formatDateISO(currentWeekStart)
  const { data: tareasSemana } = useTareasSemana(startDateISO)
  const { mutate: agendar } = useAgendarTarea()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const tarea = event.active.data.current as Tarea | undefined
    setActiveTarea(tarea ?? null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTarea(null)
      const { active, over } = event
      if (!over) return

      const overId = String(over.id)

      // Drop zone format: "YYYY-MM-DD__HH:00" or "YYYY-MM-DD__HH:30"
      if (!overId.includes('__')) return

      const [fecha, hora] = overId.split('__')
      const tareaId = String(active.id)
      const draggedTarea = active.data.current as Tarea | undefined
      const newDuracion = draggedTarea?.duracion_min || 60

      const newStartMin = parseTimeToMinutes(hora)
      const newEndMin = newStartMin + newDuracion

      // Non-overlapping validation: Check if another task occupies this time range on the target date
      if (tareasSemana && tareasSemana.length > 0) {
        const hasOverlap = tareasSemana.some(t => {
          if (t.id === tareaId) return false // same task being moved
          if (t.fecha_agendada !== fecha) return false // different day

          const tTime = t.hora_inicio || t.franja_agendada || '09:00'
          const tStartMin = parseTimeToMinutes(tTime)
          const tEndMin = tStartMin + (t.duracion_min || 60)

          // Two intervals [A_start, A_end) and [B_start, B_end) overlap if:
          // A_start < B_end AND A_end > B_start
          return newStartMin < tEndMin && newEndMin > tStartMin
        })

        if (hasOverlap) {
          // Cannot place two tasks at the exact same occupied time slot
          return
        }
      }

      agendar({ tarea_id: tareaId, fecha_agendada: fecha, franja_agendada: hora })
    },
    [tareasSemana, agendar],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-3 p-3 overflow-hidden bg-black select-none">
        <TaskStream />
        <TimeBlocker />
      </div>

      {/* Drag Overlay: positioned from top-left corner */}
      <DragOverlay
        dropAnimation={{ duration: 150, easing: 'ease' }}
        style={{
          transformOrigin: 'top left',
        }}
      >
        {activeTarea ? (
          <div className="w-72 shadow-2xl opacity-90 cursor-grabbing ring-1 ring-white">
            <TaskCard tarea={activeTarea} isDragging isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
