import { useState, useMemo } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useTareasPendientes } from '../../api/queries'
import { useToggleTarea } from '../../api/mutations'
import { IMPORTANCIA_CONFIG, getCampoConfig } from '../../types'
import TaskCard from './TaskCard'

type SortMode = 'creacion' | 'importancia' | 'duracion'

export default function TaskStream() {
  const { data: tareas, isLoading, isError } = useTareasPendientes()
  const openCreateTaskModal = useAppStore(s => s.openCreateTaskModal)
  const { mutate: toggleTarea } = useToggleTarea()
  const [sortMode, setSortMode] = useState<SortMode>('creacion')
  const [showCompleted, setShowCompleted] = useState(false)


  // Filter & Sort pending tasks in Inbox exclusively by sorting criteria
  const pendingTasks = useMemo(() => {
    if (!tareas) return []
    let list = tareas.filter(t => !t.completada)

    // Sort options: Creación, Importancia, Duración
    if (sortMode === 'creacion') {
      list = [...list].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
    } else if (sortMode === 'importancia') {
      list = [...list].sort((a, b) => {
        const scoreA = IMPORTANCIA_CONFIG[a.importancia || 'media']?.score || 2
        const scoreB = IMPORTANCIA_CONFIG[b.importancia || 'media']?.score || 2
        return scoreB - scoreA
      })
    } else if (sortMode === 'duracion') {
      list = [...list].sort((a, b) => (b.duracion_min || 0) - (a.duracion_min || 0))
    }

    return list
  }, [tareas, sortMode])

  const completedTasks = useMemo(() => {
    if (!tareas) return []
    return tareas.filter(t => t.completada)
  }, [tareas])

  const sortableIds = useMemo(() => pendingTasks.map(t => t.id), [pendingTasks])

  return (
    <div className="w-80 flex-shrink-0 bg-black border border-[#141414] p-3 flex flex-col gap-2 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
            TASK STREAM
          </span>
          {tareas && (
            <span className="font-mono text-[10px] text-neutral-600">
              ({pendingTasks.length})
            </span>
          )}
        </div>

        <button
          onClick={() => openCreateTaskModal()}
          className="flex items-center gap-1 px-2.5 py-1 bg-white text-black text-[10px] font-mono font-bold hover:bg-neutral-200 transition"
        >
          <Plus size={11} /> NUEVA
        </button>
      </div>

      {/* Simplified Clean Sort Bar */}
      <div className="flex items-center justify-between font-mono text-[9px] pb-1">
        <span className="text-neutral-600">ORDEN:</span>
        <div className="flex items-center gap-1">
          {(
            [
              ['creacion', 'CREACIÓN'],
              ['importancia', 'IMPORTANCIA'],
              ['duracion', 'DURACIÓN'],
            ] as [SortMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={[
                'px-2 py-0.5 font-bold transition',
                sortMode === mode
                  ? 'bg-white text-black'
                  : 'text-neutral-500 hover:text-white hover:bg-[#111111]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 pr-0.5">
        {isLoading && (
          <div className="space-y-1 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-[#080808]" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-[11px] font-mono text-neutral-600 text-center py-4">
            ERR_FETCH_TASKS
          </p>
        )}

        {!isLoading && !isError && pendingTasks.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-[10px] font-mono text-neutral-600 uppercase">Sin tareas pendientes en Inbox</p>
          </div>
        )}

        {!isLoading && !isError && (
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {pendingTasks.map(tarea => (
              <TaskCard key={tarea.id} tarea={tarea} />
            ))}
          </SortableContext>
        )}

        {/* Completed Tasks section */}
        {completedTasks.length > 0 && (
          <div className="pt-2 mt-2 border-t border-[#111111]">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between w-full text-[10px] font-mono text-neutral-600 hover:text-neutral-400 py-1 transition"
            >
              <div className="flex items-center gap-1">
                {showCompleted ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <span>COMPLETADAS ({completedTasks.length})</span>
              </div>
            </button>

            {showCompleted && (
              <div className="space-y-1 pt-1">
                {completedTasks.map(t => {
                  const campo = getCampoConfig(t.campo_id)
                  return (
                    <div
                      key={t.id}
                      className="p-2 bg-[#050505] flex items-center justify-between gap-2 opacity-50 hover:opacity-100 transition"
                      style={{ borderLeft: `2px solid ${campo.color}` }}
                    >
                      <button
                        onClick={() => toggleTarea({ id: t.id, completada: false })}
                        className="w-3.5 h-3.5 bg-white border border-white text-black flex items-center justify-center flex-shrink-0"
                        title="Desmarcar completada"
                      >
                        <Check size={10} strokeWidth={3} />
                      </button>
                      <span className="flex-1 text-[10px] line-through text-neutral-500 truncate">
                        {t.titulo}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-600">
                        {t.duracion_min}m
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
