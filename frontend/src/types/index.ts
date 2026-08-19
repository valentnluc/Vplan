export interface Campo {
  id: string
  nombre: string
  color_hex: string
  tipo_flujo: 'hitos' | 'continuo'
  google_calendar_id: string
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
  progreso_manual: number
  dependencia_hito_id?: string
  estado: 'pendiente' | 'en_progreso' | 'completado'
}

export interface Tarea {
  id: string
  hito_tactico_id?: string
  campo_id: string
  titulo: string
  duracion_min: number
  es_deep_work: boolean
  fecha_agendada?: string
  franja_agendada?: string
  google_event_id?: string
  completada: boolean
  orden: number
  created_at: string
}

export type FranjaId = 'f1_manana' | 'f2_tarde1' | 'f3_tarde2'
export type TabId = 'estrategica' | 'tactica' | 'trinchera'

export const CAMPOS_CONFIG = [
  { id: '01', nombre: 'Salud', color: '#a4e136', tipo: 'continuo' },
  { id: '02', nombre: 'Bienestar', color: '#38ad02', tipo: 'continuo' },
  { id: '03', nombre: 'Carrera y Educación', color: '#0a1b9b', tipo: 'hitos' },
  { id: '04', nombre: 'Finanzas', color: '#367ec0', tipo: 'hitos' },
  { id: '05', nombre: 'Relaciones', color: '#ff7b09', tipo: 'continuo' },
  { id: '06', nombre: 'Ocio y Creatividad', color: '#ffdf24', tipo: 'hitos' },
  { id: '07', nombre: 'Sistemas y Entorno', color: '#e22929', tipo: 'continuo' },
] as const

export const FRANJAS_CONFIG = [
  { id: 'f1_manana' as FranjaId, label: 'F1 — Mañana', hours: '10:30 – 12:30', focus: 'Arranque Operativo' },
  { id: 'f2_tarde1' as FranjaId, label: 'F2 — Tarde', hours: '14:30 – 17:30', focus: 'Deep Work' },
  { id: 'f3_tarde2' as FranjaId, label: 'F3 — Tarde 2', hours: '17:30 – 19:30', focus: 'Foco Secundario' },
] as const

export function getCampoConfig(id: string) {
  return CAMPOS_CONFIG.find(c => c.id === id) ?? CAMPOS_CONFIG[0]
}

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
  return date.toISOString().split('T')[0]
}

export function formatDateDisplay(date: Date, locale = 'es-AR'): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}
