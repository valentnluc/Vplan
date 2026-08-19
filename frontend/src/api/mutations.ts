import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Tarea, HitoEstrategico, HitoTactico } from '../types'

// ── 1. Captura Tarea ──────────────────────────────────────────────────────────
interface CapturaPayload {
  campo_id: string
  titulo: string
  duracion_min: number
  es_deep_work: boolean
  hito_tactico_id?: string
  fecha_agendada?: string
}

export function useCapturaTarea() {
  const qc = useQueryClient()
  return useMutation<Tarea, Error, CapturaPayload>({
    mutationFn: (data) => apiClient.post('/trinchera/captura', data).then(r => r.data),
    onMutate: async (newTarea) => {
      await qc.cancelQueries({ queryKey: ['tareas', 'pendientes'] })
      const prev = qc.getQueryData<Tarea[]>(['tareas', 'pendientes'])
      const optimistic: Tarea = {
        id: `optimistic-${Date.now()}`,
        campo_id: newTarea.campo_id,
        titulo: newTarea.titulo,
        duracion_min: newTarea.duracion_min,
        es_deep_work: newTarea.es_deep_work,
        hito_tactico_id: newTarea.hito_tactico_id,
        fecha_agendada: newTarea.fecha_agendada,
        franja_agendada: undefined,
        completada: false,
        orden: (prev?.length ?? 0) + 1,
        created_at: new Date().toISOString(),
        google_event_id: undefined,
      }
      qc.setQueryData<Tarea[]>(['tareas', 'pendientes'], old => [...(old ?? []), optimistic])
      return { prev }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev !== undefined) {
        qc.setQueryData(['tareas', 'pendientes'], context.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tareas', 'pendientes'] })
    },
  })
}

// ── 2. Toggle Tarea ───────────────────────────────────────────────────────────
interface TogglePayload { id: string; completada: boolean }

export function useToggleTarea() {
  const qc = useQueryClient()
  return useMutation<Tarea, Error, TogglePayload>({
    mutationFn: ({ id, completada }) =>
      apiClient.patch(`/trinchera/tareas/${id}`, { completada }).then(r => r.data),
    onMutate: async ({ id, completada }) => {
      await qc.cancelQueries({ queryKey: ['tareas', 'pendientes'] })
      const prev = qc.getQueryData<Tarea[]>(['tareas', 'pendientes'])
      qc.setQueryData<Tarea[]>(['tareas', 'pendientes'], old =>
        old?.map(t => (t.id === id ? { ...t, completada } : t)) ?? [],
      )
      return { prev }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev !== undefined) qc.setQueryData(['tareas', 'pendientes'], context.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tareas', 'pendientes'] }),
  })
}

// ── 3. Agendar Tarea ──────────────────────────────────────────────────────────
interface AgendarPayload { tarea_id: string; fecha_agendada: string; franja_agendada: string }

export function useAgendarTarea() {
  const qc = useQueryClient()
  return useMutation<Tarea, Error, AgendarPayload>({
    mutationFn: (data) => apiClient.post('/calendar/agendar-tarea', data).then(r => r.data),
    onMutate: async ({ tarea_id, fecha_agendada, franja_agendada }) => {
      await qc.cancelQueries({ queryKey: ['tareas', 'pendientes'] })
      await qc.cancelQueries({ queryKey: ['tareas', 'semana'] })
      const prevPendientes = qc.getQueryData<Tarea[]>(['tareas', 'pendientes'])
      const tarea = prevPendientes?.find(t => t.id === tarea_id)
      if (tarea) {
        qc.setQueryData<Tarea[]>(['tareas', 'pendientes'], old =>
          old?.filter(t => t.id !== tarea_id) ?? [],
        )
        const semanaKeys = qc.getQueriesData<Tarea[]>({ queryKey: ['tareas', 'semana'] })
        semanaKeys.forEach(([key, data]) => {
          qc.setQueryData<Tarea[]>(key, [
            ...(data ?? []),
            { ...tarea, fecha_agendada, franja_agendada },
          ])
        })
      }
      return { prevPendientes, tarea }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prevPendientes !== undefined)
        qc.setQueryData(['tareas', 'pendientes'], context.prevPendientes)
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['tareas', 'pendientes'] })
      qc.invalidateQueries({ queryKey: ['tareas', 'semana'] })
    },
  })
}

// ── 4. Desagendar Tarea ───────────────────────────────────────────────────────
interface DesagendarPayload { tarea_id: string }

export function useDesagendarTarea() {
  const qc = useQueryClient()
  return useMutation<Tarea, Error, DesagendarPayload>({
    mutationFn: ({ tarea_id }) =>
      apiClient.post('/calendar/desagendar-tarea', { tarea_id }).then(r => r.data),
    onMutate: async ({ tarea_id }) => {
      await qc.cancelQueries({ queryKey: ['tareas', 'semana'] })
      await qc.cancelQueries({ queryKey: ['tareas', 'pendientes'] })
      const semanaKeys = qc.getQueriesData<Tarea[]>({ queryKey: ['tareas', 'semana'] })
      let movedTarea: Tarea | undefined
      semanaKeys.forEach(([key, data]) => {
        movedTarea = data?.find(t => t.id === tarea_id)
        qc.setQueryData<Tarea[]>(key, data?.filter(t => t.id !== tarea_id) ?? [])
      })
      if (movedTarea) {
        const unscheduled = { ...movedTarea, fecha_agendada: undefined, franja_agendada: undefined }
        qc.setQueryData<Tarea[]>(['tareas', 'pendientes'], old => [
          ...(old ?? []),
          unscheduled,
        ])
      }
      return { movedTarea }
    },
    onError: (_err, _vars, _context) => {
      qc.invalidateQueries({ queryKey: ['tareas', 'semana'] })
      qc.invalidateQueries({ queryKey: ['tareas', 'pendientes'] })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tareas', 'semana'] })
      qc.invalidateQueries({ queryKey: ['tareas', 'pendientes'] })
    },
  })
}

// ── 5. Update Tarea (generic) ─────────────────────────────────────────────────
export function useUpdateTarea() {
  const qc = useQueryClient()
  return useMutation<Tarea, Error, Partial<Tarea> & { id: string }>({
    mutationFn: ({ id, ...data }) =>
      apiClient.patch(`/trinchera/tareas/${id}`, data).then(r => r.data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] })
    },
  })
}

// ── 6. Delete Tarea ───────────────────────────────────────────────────────────
export function useDeleteTarea() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete(`/trinchera/tareas/${id}`).then(r => r.data),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tareas', 'pendientes'] })
      const prev = qc.getQueryData<Tarea[]>(['tareas', 'pendientes'])
      qc.setQueryData<Tarea[]>(['tareas', 'pendientes'], old =>
        old?.filter(t => t.id !== id) ?? [],
      )
      return { prev }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev !== undefined) qc.setQueryData(['tareas', 'pendientes'], context.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tareas', 'pendientes'] }),
  })
}

// ── 7. Create Hito Estrategico ────────────────────────────────────────────────
type CreateEstrategicoPayload = Omit<HitoEstrategico, 'id' | 'orden'>

export function useCreateHitoEstrategico() {
  const qc = useQueryClient()
  return useMutation<HitoEstrategico, Error, CreateEstrategicoPayload>({
    mutationFn: (data) => apiClient.post('/estrategica', data).then(r => r.data),
    onMutate: async (newHito) => {
      await qc.cancelQueries({ queryKey: ['estrategica'] })
      const prev = qc.getQueryData<HitoEstrategico[]>(['estrategica'])
      const optimistic: HitoEstrategico = {
        id: `optimistic-${Date.now()}`,
        orden: (prev?.length ?? 0) + 1,
        ...newHito,
      }
      qc.setQueryData<HitoEstrategico[]>(['estrategica'], old => [...(old ?? []), optimistic])
      return { prev }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev !== undefined) qc.setQueryData(['estrategica'], context.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['estrategica'] }),
  })
}

// ── 8. Create Hito Tactico ────────────────────────────────────────────────────
type CreateTacticoPayload = Omit<HitoTactico, 'id'>

export function useCreateHitoTactico() {
  const qc = useQueryClient()
  return useMutation<HitoTactico, Error, CreateTacticoPayload>({
    mutationFn: (data) => apiClient.post('/tactica', data).then(r => r.data),
    onMutate: async (newHito) => {
      await qc.cancelQueries({ queryKey: ['tactica'] })
      const prev = qc.getQueryData<HitoTactico[]>(['tactica'])
      const optimistic: HitoTactico = { id: `optimistic-${Date.now()}`, ...newHito }
      qc.setQueryData<HitoTactico[]>(['tactica'], old => [...(old ?? []), optimistic])
      return { prev }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev !== undefined) qc.setQueryData(['tactica'], context.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tactica'] }),
  })
}

// ── 9. Update Hito Tactico ────────────────────────────────────────────────────
export function useUpdateHitoTactico() {
  const qc = useQueryClient()
  return useMutation<HitoTactico, Error, Partial<HitoTactico> & { id: string }>({
    mutationFn: ({ id, ...data }) => apiClient.patch(`/tactica/${id}`, data).then(r => r.data),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ['tactica'] })
      const prev = qc.getQueryData<HitoTactico[]>(['tactica'])
      qc.setQueryData<HitoTactico[]>(['tactica'], old =>
        old?.map(h => (h.id === id ? { ...h, ...data } : h)) ?? [],
      )
      return { prev }
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev !== undefined) qc.setQueryData(['tactica'], context.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tactica'] }),
  })
}

// ── 10. Desglosar Hito ────────────────────────────────────────────────────────
export function useDesglosarHito() {
  const qc = useQueryClient()
  return useMutation<Tarea[], Error, string>({
    mutationFn: (hitoTacticoId) =>
      apiClient.post(`/tactica/${hitoTacticoId}/desglosar`).then(r => r.data),
    onSuccess: (tareas) => {
      qc.setQueryData<Tarea[]>(['tareas', 'pendientes'], old => [
        ...(old ?? []),
        ...tareas,
      ])
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tareas', 'pendientes'] })
    },
  })
}
