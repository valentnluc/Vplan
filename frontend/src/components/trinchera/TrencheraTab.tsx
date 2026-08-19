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
import { useAgendarTarea } from '../../api/mutations'
import type { Tarea, FranjaId } from '../../types'
import TaskStream from './TaskStream'
import TimeBlocker from './TimeBlocker'
import TaskCard from './TaskCard'

export default function TrencheraTab() {
  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null)
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

      // Drop zone ids follow format: "YYYY-MM-DD__franja_id"
      if (!overId.includes('__')) return

      const [fecha, franja] = overId.split('__') as [string, FranjaId]
      const tareaId = String(active.id)

      // Don't re-schedule if already in same zone
      const draggedTarea = active.data.current as Tarea | undefined
      if (
        draggedTarea?.fecha_agendada === fecha &&
        draggedTarea?.franja_agendada === franja
      )
        return

      agendar({ tarea_id: tareaId, fecha_agendada: fecha, franja_agendada: franja })
    },
    [agendar],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 p-4 overflow-hidden">
        <TaskStream />
        <TimeBlocker />
      </div>

      {/* Drag Overlay — rendered at root level for 60fps */}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeTarea ? (
          <TaskCard tarea={activeTarea} isDragging isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
