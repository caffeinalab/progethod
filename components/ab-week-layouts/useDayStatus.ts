/**
 * A/B week layouts — temporary. See README.md in this folder.
 */
import { format as formatDate, getDay, isSameDay, isBefore, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { formatDecimalHoursLabel, formatDurationLabel } from '~/utils/duration'
import { effectiveWethodHours } from '~/utils/effectiveHours'

export type DayHealth = 'empty' | 'ok' | 'partial' | 'unsynced' | 'leave' | 'holiday' | 'weekend'

export interface WeekDayStatus {
  day: Date
  dayKey: string
  weekdayShort: string
  weekdayLong: string
  dayOfMonth: string
  isToday: boolean
  isWeekend: boolean
  isPast: boolean
  localMinutes: number
  localHoursLabel: string
  localHoursDecimal: number
  wethodHours: number
  wethodHoursLabel: string
  leaveHours: number
  leaveHoursLabel: string
  holidayName: string | null
  entryCount: number
  unsyncedCount: number
  fillRatio: number
  health: DayHealth
  needsAttention: boolean
  statusLabel: string
}

export function buildWeekDayStatus(options: {
  day: Date
  today: Date
  wethodHours?: number | null
  leaveHours?: number | null
  holidayName?: string | null
}): WeekDayStatus {
  const entriesStore = useEntriesStore()
  const dayKey = formatDate(options.day, 'yyyy-MM-dd')
  const dayOfWeek = getDay(options.day)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isToday = isSameDay(options.day, options.today)
  const isPast = isBefore(startOfDay(options.day), startOfDay(options.today))

  const entries = entriesStore.entries.filter(entry => entry.day === dayKey)
  const localMinutes = entries.reduce((sum, entry) => sum + (entry.data.duration || 0), 0)
  const localHoursDecimal = localMinutes / 60
  const unsyncedCount = entries.filter(entry => !entry.synced).length
  const syncedLocalHours = entries
    .filter(entry => entry.synced)
    .reduce((sum, entry) => sum + (entry.data.duration || 0), 0) / 60

  const leaveHours = options.leaveHours || 0
  const holidayName = options.holidayName || null
  const holidayHours = holidayName && !isWeekend ? 8 : 0
  const rawWethod = options.wethodHours || 0
  const effectiveWethod = effectiveWethodHours({
    rawWethod,
    syncedLocalHours,
    leaveHours,
    holidayHours,
  })

  const coveredHours = Math.max(localHoursDecimal, leaveHours + holidayHours)
  const fillRatio = Math.min(1, effectiveWethod / 8)

  let health: DayHealth = 'empty'
  if (isWeekend && coveredHours === 0 && !holidayName) {
    health = 'weekend'
  } else if (holidayName) {
    health = 'holiday'
  } else if (leaveHours >= 8) {
    health = 'leave'
  } else if (effectiveWethod >= 8 || coveredHours >= 8) {
    health = 'ok'
  } else if (coveredHours > 0 || leaveHours > 0) {
    health = 'partial'
  } else {
    health = 'empty'
  }

  const needsAttention = isPast
    && !isWeekend
    && !holidayName
    && leaveHours < 8
    && effectiveWethod < 8

  let statusLabel = ''
  if (unsyncedCount > 0) { statusLabel = 'Pending' }
  else if (health === 'weekend') { statusLabel = 'Weekend' }
  else if (health === 'holiday') { statusLabel = holidayName || 'Festivo' }
  else if (health === 'leave') { statusLabel = 'Assenza' }
  else if (needsAttention) { statusLabel = 'Non completo' }

  return {
    day: options.day,
    dayKey,
    weekdayShort: formatDate(options.day, 'EEE', { locale: it }),
    weekdayLong: formatDate(options.day, 'EEEE', { locale: it }),
    dayOfMonth: formatDate(options.day, 'd'),
    isToday,
    isWeekend,
    isPast,
    localMinutes,
    localHoursLabel: formatDurationLabel(localMinutes),
    localHoursDecimal,
    wethodHours: effectiveWethod,
    wethodHoursLabel: formatDecimalHoursLabel(effectiveWethod),
    leaveHours,
    leaveHoursLabel: formatDecimalHoursLabel(leaveHours),
    holidayName,
    entryCount: entries.length,
    unsyncedCount,
    fillRatio,
    health,
    needsAttention,
    statusLabel,
  }
}

/** Progress fill color from 8h target only — pending/unsynced does not affect this. */
export function fillProgressClass(status: Pick<WeekDayStatus, 'fillRatio' | 'health' | 'holidayName'>): string {
  if (status.fillRatio >= 1) { return 'bg-success' }
  if (status.health === 'leave' || status.holidayName) { return 'bg-accent' }
  if (status.fillRatio > 0) { return 'bg-warning' }
  return 'bg-stroke-muted'
}

export function fillProgressColor(status: Pick<WeekDayStatus, 'fillRatio' | 'health' | 'holidayName'>): string {
  if (status.fillRatio >= 1) { return 'var(--color-success)' }
  if (status.health === 'leave' || status.holidayName) { return 'var(--color-accent)' }
  if (status.fillRatio > 0) { return 'var(--color-warning)' }
  return 'var(--color-stroke)'
}

export function healthToneClasses(health: DayHealth, needsAttention: boolean): {
  border: string
  soft: string
  text: string
  bar: string
} {
  if (needsAttention) {
    return {
      border: 'border-warning',
      soft: 'bg-warning-soft',
      text: 'text-warning-text',
      bar: 'bg-warning',
    }
  }
  switch (health) {
    case 'ok':
    case 'holiday':
      return {
        border: 'border-success',
        soft: 'bg-success-soft',
        text: 'text-success-text',
        bar: 'bg-success',
      }
    case 'leave':
      return {
        border: 'border-accent',
        soft: 'bg-accent-soft',
        text: 'text-accent-fg',
        bar: 'bg-accent',
      }
    case 'partial':
    case 'unsynced':
      return {
        border: 'border-warning',
        soft: 'bg-warning-soft',
        text: 'text-warning-text',
        bar: 'bg-warning',
      }
    case 'weekend':
      return {
        border: 'border-stroke-muted',
        soft: 'bg-card-dim',
        text: 'text-ink-muted',
        bar: 'bg-stroke',
      }
    default:
      return {
        border: 'border-stroke',
        soft: 'bg-card',
        text: 'text-ink-muted',
        bar: 'bg-stroke-muted',
      }
  }
}
