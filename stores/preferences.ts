import { defineStore } from 'pinia'
import {
  DEFAULT_WEEK_LAYOUT,
  isWeekLayoutKey,
  type WeekLayoutKey,
} from '~/components/ab-week-layouts/types'

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    requireConfirmationOnSubmit: true,
    selectedBusinessUnitIds: null as number[] | null,
    theme: 'auto' as 'auto' | 'light' | 'dark',
    highContrast: false,
    // A/B week layouts — temporary; remove with components/ab-week-layouts/
    weekLayout: DEFAULT_WEEK_LAYOUT as WeekLayoutKey,
  }),

  getters: {
    isConfirmOnSubmitRequired: (state) => state.requireConfirmationOnSubmit,
  },

  actions: {
    setRequireSubmitConfirmation(value: boolean) {
      this.requireConfirmationOnSubmit = value
    },
    setSelectedBusinessUnitIds(ids: number[] | null) {
      this.selectedBusinessUnitIds = ids
    },
    setTheme(value: 'auto' | 'light' | 'dark') {
      this.theme = value
    },
    setHighContrast(value: boolean) {
      this.highContrast = value
    },
    setWeekLayout(value: WeekLayoutKey) {
      if (!isWeekLayoutKey(value)) { return }
      this.weekLayout = value
    },
  },
})
