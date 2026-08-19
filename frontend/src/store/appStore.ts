import { create } from 'zustand'
import type { TabId } from '../types'
import { getMonday, addDays } from '../types'

interface AppStore {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  currentWeekStart: Date
  setCurrentWeekStart: (date: Date) => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToCurrentWeek: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'trinchera',
  setActiveTab: (tab) => set({ activeTab: tab }),
  currentWeekStart: getMonday(new Date()),
  setCurrentWeekStart: (date) => set({ currentWeekStart: date }),
  goToPrevWeek: () => set(s => ({ currentWeekStart: addDays(s.currentWeekStart, -7) })),
  goToNextWeek: () => set(s => ({ currentWeekStart: addDays(s.currentWeekStart, 7) })),
  goToCurrentWeek: () => set({ currentWeekStart: getMonday(new Date()) }),
}))
