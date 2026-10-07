import { useState, useEffect, useRef, useCallback } from 'react'
import { Zap } from 'lucide-react'
import { getCampoConfig, CAMPOS_CONFIG } from '../../types'

// ── Parser types ──────────────────────────────────────────────────────────────
export interface CapturaData {
  campo_id: string
  titulo: string
  duracion_min: number
  es_deep_work: boolean
  hito_tactico_id?: string
  fecha_agendada?: string
}

function parseCapturaInput(raw: string): CapturaData {
  let text = raw
  let campo_id = '07'
  let duracion_min = 60
  let hito_tactico_id: string | undefined
  let fecha_agendada: string | undefined
  let es_deep_work = false

  // [01]–[07] campo
  const campoMatch = text.match(/\[0[1-7]\]/)
  if (campoMatch) {
    campo_id = campoMatch[0].slice(1, 3)
    text = text.replace(campoMatch[0], '').trim()
  }

  // #<hito-id>
  const hitoMatch = text.match(/#([\w-]+)/)
  if (hitoMatch) {
    hito_tactico_id = hitoMatch[1]
    text = text.replace(hitoMatch[0], '').trim()
  }

  // !YYYY-MM-DD
  const fechaMatch = text.match(/!(\d{4}-\d{2}-\d{2})/)
  if (fechaMatch) {
    fecha_agendada = fechaMatch[1]
    text = text.replace(fechaMatch[0], '').trim()
  }

  // ~<number> duracion
  const durMatch = text.match(/~(\d+)/)
  if (durMatch) {
    duracion_min = parseInt(durMatch[1], 10)
    text = text.replace(durMatch[0], '').trim()
  }

  // **<text>** deep work flag
  if (text.includes('**')) {
    es_deep_work = true
    text = text.replace(/\*\*/g, '').trim()
  }

  return {
    campo_id,
    titulo: text.trim() || 'Tarea sin título',
    duracion_min,
    es_deep_work,
    hito_tactico_id,
    fecha_agendada,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
interface CapturaInputProps {
  onCapture: (data: CapturaData) => void
}

export default function CapturaInput({ onCapture }: CapturaInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for global focus-capture event (Ctrl+K)
  useEffect(() => {
    const handler = () => inputRef.current?.focus()
    window.addEventListener('focus-capture', handler)
    return () => window.removeEventListener('focus-capture', handler)
  }, [])

  const parsed = parseCapturaInput(value)
  const campo = getCampoConfig(parsed.campo_id)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim()) {
        onCapture(parsed)
        setValue('')
      }
      if (e.key === 'Escape') {
        setValue('')
        inputRef.current?.blur()
      }
    },
    [value, parsed, onCapture],
  )

  return (
    <div className="space-y-1.5 font-mono">
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Captura rápida… [03] Estudiar ~90 !2026-08-20"
          className="w-full bg-[#0a0a0a] border border-[#262626] px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition font-sans pr-8"
        />
        {parsed.es_deep_work && (
          <Zap
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-yellow-400"
          />
        )}
      </div>

      {/* Live parse preview */}
      {value.trim() && (
        <div className="flex items-center gap-1.5 flex-wrap px-0.5 text-[9px]">
          <span
            className="px-1.5 py-0.2 font-bold text-black"
            style={{ backgroundColor: campo.color }}
          >
            [{campo.id}] {campo.nombre}
          </span>
          <span className="text-neutral-400 bg-[#141414] px-1 py-0.2 border border-[#222222]">
            {parsed.duracion_min}m
          </span>
          {parsed.fecha_agendada && (
            <span className="text-neutral-300 bg-[#141414] px-1 py-0.2 border border-[#222222]">
              📅 {parsed.fecha_agendada}
            </span>
          )}
          {parsed.hito_tactico_id && (
            <span className="text-neutral-300 bg-[#141414] px-1 py-0.2 border border-[#222222]">
              → #{parsed.hito_tactico_id}
            </span>
          )}
          {parsed.es_deep_work && (
            <span className="text-yellow-400 font-bold bg-[#141414] px-1 py-0.2 border border-[#222222] flex items-center gap-0.5">
              <Zap size={8} /> DEEP WORK
            </span>
          )}
          <span className="text-white font-sans font-medium truncate max-w-[140px]" title={parsed.titulo}>
            "{parsed.titulo}"
          </span>
        </div>
      )}

      {/* Hint */}
      {!value && (
        <p className="text-[8.5px] text-neutral-600 px-0.5">
          [01–07] CAMPO &nbsp;~MIN &nbsp;!FECHA &nbsp;#HITO &nbsp;**DEEP**
        </p>
      )}
    </div>
  )
}
