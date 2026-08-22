import { create } from 'zustand'
import type { TabId, Tarea } from '../types'
import { addDays } from '../types'

// Returns a Date object set to 00:00:00 local time
function getTodayStart(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

interface AppStore {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  currentWeekStart: Date
  setCurrentWeekStart: (date: Date) => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToCurrentWeek: () => void

  // Circadian overlays toggle
  showCircadianLayers: boolean
  setShowCircadianLayers: (show: boolean) => void
  toggleCircadianLayers: () => void

  // Task form modal
  taskModalOpen: boolean
  editingTask: Tarea | null
  openCreateTaskModal: (initialData?: Partial<Tarea>) => void
  openEditTaskModal: (task: Tarea) => void
  closeTaskModal: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'trinchera',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Start directly on Today as the first visible column
  currentWeekStart: getTodayStart(),
  setCurrentWeekStart: (date) => set({ currentWeekStart: date }),
  goToPrevWeek: () => set(s => ({ currentWeekStart: addDays(s.currentWeekStart, -7) })),
  goToNextWeek: () => set(s => ({ currentWeekStart: addDays(s.currentWeekStart, 7) })),
  goToCurrentWeek: () => set({ currentWeekStart: getTodayStart() }),

  showCircadianLayers: true,
  setShowCircadianLayers: (show) => set({ showCircadianLayers: show }),
  toggleCircadianLayers: () => set(s => ({ showCircadianLayers: !s.showCircadianLayers })),

  taskModalOpen: false,
  editingTask: null,
  openCreateTaskModal: (initialData) =>
    set({
      taskModalOpen: true,
      editingTask: initialData ? ({ ...initialData, id: '' } as Tarea) : null,
    }),
  openEditTaskModal: (task) => set({ taskModalOpen: true, editingTask: task }),
  closeTaskModal: () => set({ taskModalOpen: false, editingTask: null }),
}))
