/**
 * A/B week layouts — temporary. See README.md in this folder.
 * Delete the whole `components/ab-week-layouts/` directory when the experiment ends.
 */

export const WEEK_LAYOUT_KEYS = ['classic', 'accordion', 'rail', 'split'] as const

export type WeekLayoutKey = (typeof WEEK_LAYOUT_KEYS)[number]

export const DEFAULT_WEEK_LAYOUT: WeekLayoutKey = 'classic'

export function isWeekLayoutKey(value: unknown): value is WeekLayoutKey {
  return typeof value === 'string' && (WEEK_LAYOUT_KEYS as readonly string[]).includes(value)
}

export interface WeekLayoutProps {
  days: Date[]
  today: Date
  wethodHoursByDay: Record<string, number>
  leaveHoursByDay: Record<string, number>
  holidaysByDate: Record<string, string>
  focused?: boolean
  focusedDayIndex?: number | null
  navigating?: boolean
  insideDay?: boolean
}
