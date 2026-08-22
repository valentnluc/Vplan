import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Campo, HitoEstrategico, HitoTactico, Tarea } from '../types'

export const useCampos = () =>
  useQuery<Campo[]>({
    queryKey: ['campos'],
    queryFn: () => apiClient.get('/campos').then(r => r.data),
  })

export const useEstrategica = () =>
  useQuery<HitoEstrategico[]>({
    queryKey: ['estrategica'],
    queryFn: () => apiClient.get('/estrategica').then(r => r.data),
  })

export const useTactica = () =>
  useQuery<HitoTactico[]>({
    queryKey: ['tactica'],
    queryFn: () => apiClient.get('/tactica').then(r => r.data),
  })

export const useTareasPendientes = () =>
  useQuery<Tarea[]>({
    queryKey: ['tareas', 'pendientes'],
    queryFn: () => apiClient.get('/trinchera/pendientes').then(r => r.data),
  })

export const useTareasSemana = (startDate: string) =>
  useQuery<Tarea[]>({
    queryKey: ['tareas', 'semana', startDate],
    queryFn: () =>
      apiClient.get(`/trinchera/semana?start_date=${startDate}`).then(r => r.data),
    enabled: !!startDate,
  })
