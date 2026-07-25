import { addDays, endOfMonth, format, getDay, startOfMonth } from 'date-fns'

/** Italian weekday headers, Monday-first. */
export const WEEKDAY_HEADERS_IT = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'] as const

export interface CalendarGridBlankCell {
  key: string
  dayNumber: null
}

export interface CalendarGridDayCell {
  key: string
  dayNumber: number
  dateKey: string
  date: Date
  isWeekend: boolean
}

export type CalendarGridCell = CalendarGridBlankCell | CalendarGridDayCell

/** Monday-first month grid cells (leading blanks + days of the month). */
export function buildMonthGridCells(monthDate: Date): CalendarGridCell[] {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const startDow = getDay(monthStart)
  const leadingBlanks = startDow === 0 ? 6 : startDow - 1
  const cells: CalendarGridCell[] = []

  for (let blank = 0; blank < leadingBlanks; blank++) {
    cells.push({ key: `blank-${blank}`, dayNumber: null })
  }

  let current = new Date(monthStart)
  while (current <= monthEnd) {
    const dow = getDay(current)
    const dateKey = format(current, 'yyyy-MM-dd')
    cells.push({
      key: dateKey,
      dayNumber: current.getDate(),
      dateKey,
      date: new Date(current),
      isWeekend: dow === 0 || dow === 6,
    })
    current = addDays(current, 1)
  }

  return cells
}
