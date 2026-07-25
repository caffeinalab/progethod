export function getDecimalDuration(duration?: number): number {
  return duration ? (Math.floor(duration * 10 / 60)) / 10 : 0
}

export function durationRequiresAdjustment(duration?: number): boolean {
  return !!(duration && (duration * 10 % 60 !== 0))
}

export function getPrintableDuration(duration: number): { hours: number; minutes: number } {
  const totalMinutes = Math.max(0, Math.round(duration))
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}

/** Formats minutes as `Xh`, or `Xh Ym` when there are leftover minutes. */
export function formatDurationLabel(durationMinutes: number): string {
  const { hours, minutes } = getPrintableDuration(durationMinutes)
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/** Formats decimal hours (e.g. 8.2) with the same `Xh Ym` style. */
export function formatDecimalHoursLabel(decimalHours: number): string {
  return formatDurationLabel(decimalHours * 60)
}

export function minutesToHHmm(duration: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const minutes = duration % 60
  const hours = Math.floor(duration / 60)
  return `${pad(hours)}:${pad(minutes)}`
}
