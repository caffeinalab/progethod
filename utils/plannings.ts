// Normalizes Wethod leave/planning data into a flat, typed per-day list.
//
// Wethod replaced `planningboard/` (grouped per-day rows) with
// `planning-groups` (flat array of allocations spanning multiple dates):
//   { project_id, person_id, daily_minutes, from_date, to_date, dates[],
//     allocation_request_id, allocation_request_status, type, deleted_at }
// Parse defensively and never trust the payload types — Wethod changes them
// without notice.

import { addDays, format } from 'date-fns'

export interface PlanningEntry {
  employeeId: number
  projectId: number
  day: string
  amount: number // hours
  isPending: boolean
  allocationRequestId: number | null
}

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function expandDateRange(fromDate: unknown, toDate: unknown): string[] {
  if (typeof fromDate !== 'string' || typeof toDate !== 'string') { return [] }
  const days: string[] = []
  let current = new Date(fromDate + 'T00:00:00')
  const end = new Date(toDate + 'T00:00:00')
  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) { return [] }
  while (current <= end) {
    days.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }
  return days
}

/** planning-groups row: one allocation covering many days at daily_minutes each. */
function normalizePlanningGroup(raw: any): PlanningEntry[] {
  if (raw?.deleted_at) { return [] }
  const days = Array.isArray(raw?.dates) && raw.dates.length
    ? raw.dates.filter((day: unknown) => typeof day === 'string')
    : expandDateRange(raw?.from_date, raw?.to_date)
  const amount = toFiniteNumber(raw?.daily_minutes ?? raw?.daily_hours * 60) / 60
  const employeeId = toFiniteNumber(raw?.person_id ?? raw?.employee_id)
  const projectId = toFiniteNumber(raw?.project_id ?? raw?.project?.id)
  const isPending = raw?.allocation_request_status === 'pending' || raw?.type === 'tentative'
  const allocationRequestId = toFiniteNumber(raw?.allocation_request_id) || null
  return days.map((day: string) => ({ employeeId, projectId, day, amount, isPending, allocationRequestId }))
}

/** Legacy planningboard row: one row per day, amount already in hours. */
function normalizeLegacyPlanning(raw: any): PlanningEntry[] {
  const day = raw?.day ?? raw?.date
  if (!day || typeof day !== 'string') { return [] }
  return [{
    employeeId: toFiniteNumber(raw.employee_id ?? raw.employeeId ?? raw.employee?.id),
    projectId: toFiniteNumber(raw.project_id ?? raw.projectId ?? raw.project?.id),
    day,
    amount: toFiniteNumber(raw.amount ?? raw.hours),
    isPending: Boolean(raw.is_pending ?? raw.isPending),
    allocationRequestId: toFiniteNumber(raw.allocation_request_id ?? raw.allocationRequestId) || null,
  }]
}

function normalizePlanning(raw: any): PlanningEntry[] {
  if (raw && (Array.isArray(raw.dates) || raw.daily_minutes !== undefined || raw.person_id !== undefined)) {
    return normalizePlanningGroup(raw)
  }
  return normalizeLegacyPlanning(raw)
}

function collectRawPlannings(container: unknown): any[] {
  if (Array.isArray(container)) { return container }
  if (!container || typeof container !== 'object') { return [] }
  const raws: any[] = []
  for (const group of Object.values(container)) {
    if (Array.isArray(group)) {
      raws.push(...group)
    } else if (group && typeof group === 'object' && Array.isArray((group as any).data)) {
      raws.push(...(group as any).data)
    }
  }
  return raws
}

/** Accepts the `data` envelope of a planningboard/planning-groups response (or the plannings container itself). */
export function normalizePlanningsResponse(payload: unknown): PlanningEntry[] {
  const container = (payload as any)?.plannings ?? payload
  const entries: PlanningEntry[] = []
  for (const raw of collectRawPlannings(container)) {
    entries.push(...normalizePlanning(raw))
  }
  return entries
}

/** Keep only the given employee's plannings on the given projects (e.g. leave projects 83/90). */
export function filterPlannings(entries: PlanningEntry[], employeeId: number, projectIds: Iterable<number>): PlanningEntry[] {
  const wanted = new Set([...projectIds].map(Number))
  return entries.filter((entry) => entry.employeeId === Number(employeeId) && wanted.has(entry.projectId))
}
