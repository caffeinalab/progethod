/**
 * Projected Wethod coverage for a day.
 * Work comes from raw tracked hours and/or synced local entries; planned
 * leave/holidays are always added on top (they live on the planning board
 * until Wethod folds them into tracked hours).
 */
export function effectiveWethodHours(options: {
  rawWethod?: number | null
  syncedLocalHours?: number | null
  leaveHours?: number | null
  holidayHours?: number | null
}): number {
  const rawWethod = options.rawWethod || 0
  const syncedLocalHours = options.syncedLocalHours || 0
  const absenceHours = (options.leaveHours || 0) + (options.holidayHours || 0)
  return Math.max(rawWethod, syncedLocalHours) + absenceHours
}
