export interface Campo {
  id: string
  nombre: string
  color_hex: string
  tipo_flujo?: string
  google_calendar_id?: string
  descripcion?: string
}

export interface HitoEstrategico {
  id: string
  campo_id: string
  titulo: string
  fecha_inicio: string
  fecha_target: string
  estado: 'en_progreso' | 'completado' | 'pausado'
  orden: number
}

export interface HitoTactico {
  id: string
  hito_estrategico_id?: string
  campo_id: string
  titulo: string
  fecha_limite: string
  hora_limite?: string
  progreso_manual: number
  dependencia_hito_id?: string
  estado: 'pendiente' | 'en_progreso' | 'completado'
  restricciones?: string
}

export type TipoActividadCircadiana =
  | 'trabajo_pesado'
  | 'trabajo_liviano'
  | 'trabajo_creativo'
  | 'ejercicio'
  | 'recuperacion'

export type NivelImportancia = 'alta' | 'media' | 'baja'

export interface Tarea {
  id: string
  hito_tactico_id?: string
  campo_id: string
  titulo: string
  descripcion?: string
  notas?: string
  duracion_min: number
  importancia?: NivelImportancia
  es_deep_work: boolean
  tipo_circadiano?: TipoActividadCircadiana
  fecha_agendada?: string
  hora_inicio?: string
  franja_agendada?: string
  google_event_id?: string
  completada: boolean
  orden: number
  created_at: string
}

export type TabId = 'estrategica' | 'tactica' | 'trinchera'

export interface VentanaCircadiana {
  id: string
  label: string
  categoria: 'pesado' | 'liviano' | 'creativo' | 'ejercicio'
  tipo: TipoActividadCircadiana
  startMin: number
  endMin: number
  startTime: string
  endTime: string
  color: string
}

export const CAMPOS_CONFIG = [
  { id: '01', nombre: 'Salud', color: '#a4e136' },
  { id: '02', nombre: 'Bienestar', color: '#38ad02' },
  { id: '03', nombre: 'Carrera y Educación', color: '#3b82f6' },
  { id: '04', nombre: 'Finanzas', color: '#06b6d4' },
  { id: '05', nombre: 'Relaciones', color: '#ff7b09' },
  { id: '06', nombre: 'Ocio y Creatividad', color: '#ffdf24' },
  { id: '07', nombre: 'Sistemas y Entorno', color: '#e22929' },
] as const

export const IMPORTANCIA_CONFIG: Record<NivelImportancia, { label: string; tag: string; color: string; score: number }> = {
  alta: { label: 'Alta', tag: 'ALTA', color: '#ef4444', score: 3 },
  media: { label: 'Media', tag: 'MEDIA', color: '#eab308', score: 2 },
  baja: { label: 'Baja', tag: 'BAJA', color: '#737373', score: 1 },
}

export const TIPOS_ACTIVIDAD_INFO: Record<TipoActividadCircadiana, { label: string; tag: string; color: string; desc: string; defaultHour: string }> = {
  trabajo_pesado: {
    label: 'Trabajo Profundo',
    tag: 'PROFUNDO',
    color: '#2563eb',
    desc: 'Alta demanda cognitiva y análisis complejo (08:30 - 12:30, 16:00 - 17:30)',
    defaultHour: '09:00',
  },
  trabajo_liviano: {
    label: 'Trabajo Liviano',
    tag: 'LIVIANO',
    color: '#38bdf8',
    desc: 'Correos, orden y tareas operativas (12:30 - 14:00, 18:30 - 20:30)',
    defaultHour: '13:00',
  },
  trabajo_creativo: {
    label: 'Trabajo Creativo',
    tag: 'CREATIVO',
    color: '#a855f7',
    desc: 'Ideación, redacción y diseño libre (14:00 - 16:00, 20:30 - 23:00)',
    defaultHour: '14:00',
  },
  ejercicio: {
    label: 'Ejercicio Físico',
    tag: 'EJERCICIO',
    color: '#22c55e',
    desc: 'Entrenamiento y movilidad física (17:30 - 18:30)',
    defaultHour: '17:30',
  },
  recuperacion: {
    label: 'Desconexión',
    tag: 'PAUSA',
    color: '#818cf8',
    desc: 'Descanso y recuperación',
    defaultHour: '23:00',
  },
}

export function getCampoConfig(id: string) {
  return CAMPOS_CONFIG.find(c => c.id === id) ?? CAMPOS_CONFIG[0]
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToTimeString(minutes: number): string {
  const normalized = (minutes + 24 * 60) % (24 * 60)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const VENTANAS_CIRCADIANAS_CONFIG: VentanaCircadiana[] = [
  {
    id: 'pesado_1',
    label: 'Trabajo Profundo',
    categoria: 'pesado',
    tipo: 'trabajo_pesado',
    startMin: 8 * 60 + 30,
    endMin: 12 * 60 + 30,
    startTime: '08:30',
    endTime: '12:30',
    color: '#2563eb',
  },
  {
    id: 'liviano_1',
    label: 'Trabajo Liviano',
    categoria: 'liviano',
    tipo: 'trabajo_liviano',
    startMin: 12 * 60 + 30,
    endMin: 14 * 60,
    startTime: '12:30',
    endTime: '14:00',
    color: '#38bdf8',
  },
  {
    id: 'creativo_1',
    label: 'Trabajo Creativo',
    categoria: 'creativo',
    tipo: 'trabajo_creativo',
    startMin: 14 * 60,
    endMin: 16 * 60,
    startTime: '14:00',
    endTime: '16:00',
    color: '#a855f7',
  },
  {
    id: 'pesado_2',
    label: 'Trabajo Profundo',
    categoria: 'pesado',
    tipo: 'trabajo_pesado',
    startMin: 16 * 60,
    endMin: 17 * 60 + 30,
    startTime: '16:00',
    endTime: '17:30',
    color: '#2563eb',
  },
  {
    id: 'ejercicio_1',
    label: 'Ejercicio Físico',
    categoria: 'ejercicio',
    tipo: 'ejercicio',
    startMin: 17 * 60 + 30,
    endMin: 18 * 60 + 30,
    startTime: '17:30',
    endTime: '18:30',
    color: '#22c55e',
  },
  {
    id: 'liviano_2',
    label: 'Trabajo Liviano',
    categoria: 'liviano',
    tipo: 'trabajo_liviano',
    startMin: 18 * 60 + 30,
    endMin: 20 * 60 + 30,
    startTime: '18:30',
    endTime: '20:30',
    color: '#38bdf8',
  },
  {
    id: 'creativo_2',
    label: 'Trabajo Creativo',
    categoria: 'creativo',
    tipo: 'trabajo_creativo',
    startMin: 20 * 60 + 30,
    endMin: 23 * 60,
    startTime: '20:30',
    endTime: '23:00',
    color: '#a855f7',
  },
]

export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDateDisplay(date: Date, locale = 'es-AR'): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}
