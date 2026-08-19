import { useState, useMemo, useCallback } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Layers, Zap } from 'lucide-react'
import { useTareasPendientes } from '../../api/queries'
import { useCapturaTarea, useToggleTarea, useDeleteTarea } from '../../api/mutations'
import { CAMPOS_CONFIG, getCampoConfig } from '../../types'
import type { Tarea } from '../../types'
import CapturaInput from './CapturaInput'
import type { CapturaData } from './CapturaInput'
import TaskCard from './TaskCard'

type FilterMode = 'all' | 'deepwork' | string // string = campo_id

export default function TaskStream() {
  const { data: tareas, isLoading, isError } = useTareasPendientes()
  const { mutate: capturar } = useCapturaTarea()
  const { mutate: toggle } = useToggleTarea()
  const { mutate: deleteTarea } = useDeleteTarea()
  const [filter, setFilter] = useState<FilterMode>('all')

  const handleCapture = useCallback(
    (data: CapturaData) => {
      capturar(data)
    },
    [capturar],
  )

  const handleToggle = useCallback(
    (id: string, completada: boolean) => {
      toggle({ id, completada })
    },
    [toggle],
  )

  const filtered = useMemo(() => {
    if (!tareas) return []
    let list = tareas.filter(t => !t.completada) // pending only in stream
    if (filter === 'deepwork') list = list.filter(t => t.es_deep_work)
    else if (filter !== 'all') list = list.filter(t => t.campo_id === filter)
    return list
  }, [tareas, filter])

  const sortableIds = useMemo(() => filtered.map(t => t.id), [filtered])

  return (
    <div className="w-80 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers size={13} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Stream</span>
        {tareas && (
          <span className="ml-auto px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">
            {filtered.length}
          </span>
        )}
      </div>

      {/* Captura input */}
      <CapturaInput onCapture={handleCapture} />

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
            filter === 'all'
              ? 'bg-slate-700 text-slate-100'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Todo
        </button>
        <button
          onClick={() => setFilter('deepwork')}
          className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition ${
            filter === 'deepwork'
              ? 'bg-yellow-900 text-yellow-300'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap size={9} />
          Deep
        </button>
        {CAMPOS_CONFIG.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(filter === c.id ? 'all' : c.id)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition`}
            style={
              filter === c.id
                ? { backgroundColor: c.color + '33', color: c.color, outline: `1px solid ${c.color}44` }
                : { backgroundColor: '#1e293b', color: '#94a3b8' }
            }
            title={c.nombre}
          >
            {c.id}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {isLoading && (
          <div className="animate-pulse space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-800 rounded-r-lg border-l-4 border-slate-700" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-xs text-slate-500 text-center py-4">Error al cargar tareas.</p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center">
            <p className="text-[10px] text-slate-600">Sin tareas pendientes</p>
            <p className="text-[9px] text-slate-700 mt-1">Usa la captura rápida de arriba</p>
          </div>
        )}

        {!isLoading && !isError && (
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {filtered.map(tarea => (
              <TaskCard
                key={tarea.id}
                tarea={tarea}
                onToggle={handleToggle}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
