import { useState, useEffect, useCallback } from 'react'
import { X, Check, Trash2, Target, AlertTriangle, Calendar, Clock, AlignLeft } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useCapturaTarea, useUpdateTarea, useDeleteTarea } from '../../api/mutations'
import { useTactica } from '../../api/queries'
import {
  CAMPOS_CONFIG,
  TIPOS_ACTIVIDAD_INFO,
  IMPORTANCIA_CONFIG,
  TipoActividadCircadiana,
  NivelImportancia,
  getCampoConfig,
  formatDateISO,
} from '../../types'

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]
const MAX_DESC_CHARS = 100

export default function TaskFormModal() {
  const { taskModalOpen, editingTask, closeTaskModal } = useAppStore()
  const { data: hitosTacticos } = useTactica()
  const { mutate: capturar, isPending: isCreating } = useCapturaTarea()
  const { mutate: updateTarea, isPending: isUpdating } = useUpdateTarea()
  const { mutate: deleteTarea, isPending: isDeleting } = useDeleteTarea()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [campoId, setCampoId] = useState('03')
  const [duracion, setDuracion] = useState(60)
  const [importancia, setImportancia] = useState<NivelImportancia>('media')
  const [tipoCircadiano, setTipoCircadiano] = useState<TipoActividadCircadiana>('trabajo_pesado')
  const [hitoId, setHitoId] = useState<string>('')
  
  const [isScheduled, setIsScheduled] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('09:00')

  const isEditMode = Boolean(editingTask && editingTask.id)

  useEffect(() => {
    if (editingTask) {
      setTitulo(editingTask.titulo || '')
      setDescripcion((editingTask.descripcion || '').slice(0, MAX_DESC_CHARS))
      setCampoId(editingTask.campo_id || '03')
      setDuracion(editingTask.duracion_min || 60)
      setImportancia(editingTask.importancia || 'media')
      setTipoCircadiano(
        editingTask.tipo_circadiano ||
          (editingTask.es_deep_work ? 'trabajo_pesado' : 'trabajo_pesado'),
      )
      setHitoId(editingTask.hito_tactico_id || '')
      if (editingTask.fecha_agendada) {
        setIsScheduled(true)
        setCustomDate(editingTask.fecha_agendada)
        setCustomTime(editingTask.hora_inicio || editingTask.franja_agendada || '09:00')
      } else {
        setIsScheduled(false)
        setCustomDate(formatDateISO(new Date()))
        setCustomTime('09:00')
      }
    } else {
      setTitulo('')
      setDescripcion('')
      setCampoId('03')
      setDuracion(60)
      setImportancia('media')
      setTipoCircadiano('trabajo_pesado')
      setHitoId('')
      setIsScheduled(false)
      setCustomDate(formatDateISO(new Date()))
      setCustomTime('09:00')
    }
  }, [editingTask, taskModalOpen])

  const handleHitoChange = (selectedId: string) => {
    setHitoId(selectedId)
    if (selectedId) {
      const matched = hitosTacticos?.find(h => h.id === selectedId)
      if (matched) {
        setCampoId(matched.campo_id)
      }
    }
  }

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!titulo.trim()) return

      const defaultHour = customTime || TIPOS_ACTIVIDAD_INFO[tipoCircadiano].defaultHour

      const payload = {
        campo_id: campoId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() ? descripcion.trim().slice(0, MAX_DESC_CHARS) : undefined,
        duracion_min: duracion,
        importancia,
        es_deep_work: tipoCircadiano === 'trabajo_pesado',
        tipo_circadiano: tipoCircadiano,
        hito_tactico_id: hitoId || undefined,
        fecha_agendada: isScheduled && customDate ? customDate : undefined,
        hora_inicio: isScheduled && customDate ? defaultHour : undefined,
        franja_agendada: isScheduled && customDate ? defaultHour : undefined,
      }

      if (isEditMode && editingTask?.id) {
        updateTarea({ id: editingTask.id, ...payload }, { onSuccess: closeTaskModal })
      } else {
        capturar(payload, { onSuccess: closeTaskModal })
      }
    },
    [titulo, descripcion, campoId, duracion, importancia, tipoCircadiano, hitoId, isScheduled, customDate, customTime, isEditMode, editingTask, updateTarea, capturar, closeTaskModal],
  )

  const handleDelete = () => {
    if (editingTask?.id) {
      deleteTarea(editingTask.id, { onSuccess: closeTaskModal })
    }
  }

  if (!taskModalOpen) return null

  const selectedCampo = getCampoConfig(campoId)

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
      onClick={closeTaskModal}
    >
      <div
        className="bg-black border border-[#262626] w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3.5 p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5" style={{ backgroundColor: selectedCampo.color }} />
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-white">
              {isEditMode ? 'MODIFICAR TAREA' : 'NUEVA TAREA (INBOX O AGENDAR)'}
            </h2>
          </div>
          <button
            onClick={closeTaskModal}
            className="text-neutral-500 hover:text-white transition p-1"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
              Nombre de la tarea
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="Ej. Revisión de modelo financiero"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition font-sans"
            />
          </div>

          {/* Description (Limitada a 100 caracteres para asegurar encaje perfecto) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                <AlignLeft size={11} className="text-neutral-400" />
                <span>Descripción / Notas breves</span>
              </label>
              <span className={`text-[9px] font-mono ${descripcion.length >= MAX_DESC_CHARS ? 'text-amber-400 font-bold' : 'text-neutral-500'}`}>
                {descripcion.length}/{MAX_DESC_CHARS}
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={MAX_DESC_CHARS}
              placeholder="Detalles clave o notas breves (máx. 100 caracteres)..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] px-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-white transition font-sans resize-none"
            />
          </div>

          {/* Scheduling Mode */}
          <div className="p-2.5 bg-[#080808] border border-[#1e1e1e] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase text-neutral-300 font-bold flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={e => setIsScheduled(e.target.checked)}
                  className="accent-white cursor-pointer"
                />
                <span>Agendar en fecha y hora específica</span>
              </label>
              <span className="text-[9px] font-mono text-neutral-500">
                {isScheduled ? 'AGENDADA EN CALENDARIO' : 'INBOX (TASK STREAM)'}
              </span>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#1a1a1a]">
                <div>
                  <label className="block text-[9px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                    <Calendar size={10} />
                    <span>Fecha</span>
                  </label>
                  <input
                    type="date"
                    required={isScheduled}
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262626] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white font-mono [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                    <Clock size={10} />
                    <span>Hora Exacta</span>
                  </label>
                  <input
                    type="time"
                    required={isScheduled}
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262626] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white font-mono [color-scheme:dark]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Importancia Selection */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
              <AlertTriangle size={11} className="text-neutral-400" />
              <span>Nivel de Importancia / Prioridad</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['alta', 'media', 'baja'] as NivelImportancia[]).map(lvl => {
                const conf = IMPORTANCIA_CONFIG[lvl]
                const isSelected = importancia === lvl
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setImportancia(lvl)}
                    className={[
                      'py-1 px-2 text-center text-xs transition border font-mono flex items-center justify-center gap-1.5',
                      isSelected
                        ? 'bg-white text-black font-bold border-white'
                        : 'bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:border-neutral-500',
                    ].join(' ')}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: conf.color }}
                    />
                    <span className="text-[10px]">{conf.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vincular a Hito Táctico Existente */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
              <Target size={11} className="text-neutral-400" />
              <span>Vincular a Hito Táctico (Opcional)</span>
            </label>
            <select
              value={hitoId}
              onChange={e => handleHitoChange(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
            >
              <option value="">-- Sin Hito Táctico (Tarea Independiente) --</option>
              {hitosTacticos?.map(h => (
                <option key={h.id} value={h.id}>
                  [{h.campo_id}] {h.titulo} (Límite: {h.fecha_limite})
                </option>
              ))}
            </select>
          </div>

          {/* Campo Life Area Selection */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
              Campo Vital
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {CAMPOS_CONFIG.map(c => {
                const isSelected = campoId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCampoId(c.id)}
                    className={[
                      'py-1 px-2 text-left text-xs transition border font-mono flex items-center gap-1.5 truncate',
                      isSelected
                        ? 'bg-white text-black font-bold border-white'
                        : 'bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:border-neutral-500',
                    ].join(' ')}
                  >
                    <div
                      className="w-2 h-2 flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-[10px] truncate">{c.nombre}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
              Duración (Minutos)
            </label>
            <div className="flex gap-1">
              {DURATION_PRESETS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuracion(d)}
                  className={[
                    'flex-1 py-1 text-center text-xs font-mono transition border',
                    duracion === d
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:border-neutral-500',
                  ].join(' ')}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Circadian Activity Type */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
              Tipo de Actividad Circadiana
            </label>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  'trabajo_pesado',
                  'trabajo_liviano',
                  'trabajo_creativo',
                  'ejercicio',
                ] as TipoActividadCircadiana[]
              ).map(tipo => {
                const info = TIPOS_ACTIVIDAD_INFO[tipo]
                const isSelected = tipoCircadiano === tipo
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoCircadiano(tipo)}
                    className={[
                      'p-2 text-left border transition font-mono flex items-start gap-2',
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:border-neutral-500',
                    ].join(' ')}
                  >
                    <div
                      className="w-2 h-2 mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: info.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold">{info.label}</div>
                      <div className="text-[8px] opacity-75 truncate">{info.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
            {isEditMode ? (
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
                onClick={closeTaskModal}
                className="px-3 py-1.5 bg-[#141414] hover:bg-[#222222] text-neutral-300 text-xs font-mono transition"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="flex items-center gap-1 px-4 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold transition"
              >
                <Check size={12} strokeWidth={3} />
                <span>
                  {isCreating || isUpdating
                    ? 'GUARDANDO...'
                    : isEditMode
                    ? 'GUARDAR CAMBIOS'
                    : 'CREAR TAREA'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
