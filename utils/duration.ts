import { intervalToDuration } from 'date-fns'

export function getDecimalDuration(duration?: number): number {
  return duration ? (Math.floor(duration * 10 / 60)) / 10 : 0
}

export function durationRequiresAdjustment(duration?: number): boolean {
  return !!(duration && (duration * 10 % 60 !== 0))
}

export function getPrintableDuration(duration: number): { hours: number; minutes: number } {
  return duration > 0
    ? intervalToDuration({ start: 0, end: duration * 60 * 1000 }) as { hours: number; minutes: number }
    : { hours: 0, minutes: 0 }
}

export function minutesToHHmm(duration: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const minutes = duration % 60
  const hours = Math.floor(duration / 60)
  return `${pad(hours)}:${pad(minutes)}`
}
