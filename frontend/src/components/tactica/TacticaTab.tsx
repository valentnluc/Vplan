import { useState, useMemo, useCallback } from 'react'
import { Plus, X, ChevronRight } from 'lucide-react'
import { useTactica } from '../../api/queries'
import { useCreateHitoTactico, useUpdateHitoTactico, useDesglosarHito } from '../../api/mutations'
import { CAMPOS_CONFIG, getCampoConfig } from '../../types'
import type { HitoTactico } from '../../types'

// ── Month helpers ─────────────────────────────────────────────────────────────
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function getThreeMonths(): Date[] {
  const now = new Date()
  return [
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 1),
    new Date(now.getFullYear(), now.getMonth() + 2, 1),
  ]
}

// ── Add Hito Tactico Form ─────────────────────────────────────────────────────
interface AddHitoFormProps {
  monthDate: Date
  onClose: () => void
}

function AddHitoTacticoForm({ monthDate, onClose }: AddHitoFormProps) {
  const { mutate, isPending } = useCreateHitoTactico()
  const [titulo, setTitulo] = useState('')
  const [campoId, setCampoId] = useState('07')
  const [fechaLimite, setFechaLimite] = useState(() => {
    const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    return last.toISOString().split('T')[0]
  })

  const handleSubmit = useCallback(() => {
    if (!titulo.trim()) return
    mutate(
      {
        campo_id: campoId,
        titulo: titulo.trim(),
        fecha_limite: fechaLimite,
        progreso_manual: 0,
        estado: 'pendiente',
      },
      { onSuccess: onClose },
    )
  }, [titulo, campoId, fechaLimite, mutate, onClose])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-80 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Nuevo Hito Táctico</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
            <X size={14} />
          </button>
        </div>
        <input
          autoFocus
          placeholder="Título del hito..."
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
        />
        <select
          value={campoId}
          onChange={e => setCampoId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
        >
          {CAMPOS_CONFIG.map(c => (
            <option key={c.id} value={c.id}>
              [{c.id}] {c.nombre}
            </option>
          ))}
        </select>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Fecha límite</label>
          <input
            type="date"
            value={fechaLimite}
            onChange={e => setFechaLimite(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !titulo.trim()}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium transition disabled:opacity-40"
          >
            {isPending ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Progress Editor ───────────────────────────────────────────────────────────
interface ProgressEditorProps {
  hito: HitoTactico
}

function ProgressEditor({ hito }: ProgressEditorProps) {
  const { mutate } = useUpdateHitoTactico()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(hito.progreso_manual))

  const commit = useCallback(() => {
    const n = Math.max(0, Math.min(100, parseInt(val, 10) || 0))
    mutate({ id: hito.id, progreso_manual: n })
    setEditing(false)
  }, [val, hito.id, mutate])

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Progreso</span>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={commit}
              onKeyDown={e => e.key === 'Enter' && commit()}
              autoFocus
              className="w-14 bg-slate-950 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-100 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">%</span>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-slate-400 hover:text-slate-200 transition"
          >
            {hito.progreso_manual}%
          </button>
        )}
      </div>
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${hito.progreso_manual}%`,
            backgroundColor: getCampoConfig(hito.campo_id).color,
          }}
        />
      </div>
    </div>
  )
}

// ── Hito Card ─────────────────────────────────────────────────────────────────
interface HitoCardProps {
  hito: HitoTactico
}

function HitoCard({ hito }: HitoCardProps) {
  const { mutate: desglosar, isPending: isDesglosando } = useDesglosarHito()
  const campo = getCampoConfig(hito.campo_id)

  const estadoBadge: Record<HitoTactico['estado'], string> = {
    pendiente: 'bg-slate-800 text-slate-400',
    en_progreso: 'bg-blue-950 text-blue-400',
    completado: 'bg-green-950 text-green-400',
  }

  return (
    <div
      className="p-3 bg-slate-950 border-y border-r border-slate-800 rounded-r-lg space-y-2"
      style={{ borderLeft: `4px solid ${campo.color}` }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ backgroundColor: campo.color + '22', color: campo.color }}
            >
              {campo.nombre}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${estadoBadge[hito.estado]}`}>
              {hito.estado.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-100 leading-snug">{hito.titulo}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Límite: {new Date(hito.fecha_limite + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
      <ProgressEditor hito={hito} />
      <button
        onClick={() => desglosar(hito.id)}
        disabled={isDesglosando}
        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition disabled:opacity-40"
      >
        <ChevronRight size={10} />
        {isDesglosando ? 'Desglosando...' : 'Desglosar en tareas'}
      </button>
    </div>
  )
}

// ── Month Column ──────────────────────────────────────────────────────────────
interface MonthColumnProps {
  monthDate: Date
  hitos: HitoTactico[]
}

function MonthColumn({ monthDate, hitos }: MonthColumnProps) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 capitalize">
          {monthLabel(monthDate)}
        </h3>
        <button
          onClick={() => setAdding(true)}
          className="text-slate-500 hover:text-slate-200 transition p-0.5 rounded hover:bg-slate-800"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="space-y-2 flex-1">
        {hitos.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-lg p-4 text-center">
            <p className="text-[10px] text-slate-600">Sin hitos este mes</p>
          </div>
        ) : (
          hitos.map(h => <HitoCard key={h.id} hito={h} />)
        )}
      </div>

      {adding && <AddHitoTacticoForm monthDate={monthDate} onClose={() => setAdding(false)} />}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="h-4 bg-slate-800 rounded w-32" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-20 bg-slate-800 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function TacticaTab() {
  const { data: hitos, isLoading, isError } = useTactica()
  const months = useMemo(() => getThreeMonths(), [])

  const hitosByMonth = useMemo(() => {
    const map: Record<string, HitoTactico[]> = {}
    months.forEach(m => { map[getMonthKey(m)] = [] })
    hitos?.forEach(h => {
      const key = h.fecha_limite.slice(0, 7)
      if (map[key]) map[key].push(h)
    })
    return map
  }, [hitos, months])

  if (isLoading) return <Skeleton />
  if (isError)
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Error al cargar hitos tácticos.
      </div>
    )

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-3 gap-4">
        {months.map(month => (
          <MonthColumn
            key={getMonthKey(month)}
            monthDate={month}
            hitos={hitosByMonth[getMonthKey(month)] ?? []}
          />
        ))}
      </div>
    </div>
  )
}
