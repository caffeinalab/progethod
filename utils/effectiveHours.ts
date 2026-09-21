/**
 * Projected Wethod coverage for a day.
 *
 * Wethod folds approved leave into tracked hours once the day arrives: the
 * hours land on the leave projects (83/90, `is_timesheet_automatic`, area
 * "generic", bucket `internal`) and are included in `tracked-hours`, while
 * the planning board keeps showing the same allocation. Adding leave on top
 * of raw tracked hours would double-count it (verified 2026-09: a Friday with
 * 4h approved Permesso reports tracked-hours value 4 AND a 4h planning row).
 *
 * The max() keeps the projection idempotent across the fold: before it,
 * coverage comes from synced local work + planned absence; after it, those
 * same hours are already inside rawWethod. Unsubmitted local entries never
 * count (they are not on Wethod).
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
  return Math.max(rawWethod, syncedLocalHours + absenceHours)
}
