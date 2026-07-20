import { defineStore } from 'pinia'

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    requireConfirmationOnSubmit: true,
    selectedBusinessUnitIds: null as number[] | null,
    theme: 'auto' as 'auto' | 'light' | 'dark',
    highContrast: false,
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
  },
})
