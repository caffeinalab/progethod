import { defineStore } from 'pinia'
import {
  DEFAULT_WEEK_LAYOUT,
  isWeekLayoutKey,
  type WeekLayoutKey,
} from '~/components/ab-week-layouts/types'

/** Allowed duration rounding quanta (minutes) for imported activities; 0 = no rounding. */
export const DURATION_ROUNDING_OPTIONS = [0, 15, 30] as const
export type DurationRoundingMinutes = typeof DURATION_ROUNDING_OPTIONS[number]

export function isDurationRoundingMinutes(value: unknown): value is DurationRoundingMinutes {
  return DURATION_ROUNDING_OPTIONS.includes(value as DurationRoundingMinutes)
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    requireConfirmationOnSubmit: true,
    selectedBusinessUnitIds: null as number[] | null,
    theme: 'auto' as 'auto' | 'light' | 'dark',
    highContrast: false,
    durationRoundingMinutes: 15 as DurationRoundingMinutes,
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
    setDurationRoundingMinutes(value: DurationRoundingMinutes) {
      if (!isDurationRoundingMinutes(value)) { return }
      this.durationRoundingMinutes = value
    },
    setWeekLayout(value: WeekLayoutKey) {
      if (!isWeekLayoutKey(value)) { return }
      this.weekLayout = value
    },
  },
})
