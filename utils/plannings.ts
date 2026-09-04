// Normalizes Wethod planningboard plannings into a flat, typed list.
// Wethod has changed this response shape without notice (grouped object vs
// flat array, string vs numeric ids, renamed fields), so parse defensively
// and never trust the payload types.

export interface PlanningEntry {
  employeeId: number
  projectId: number
  day: string
  amount: number
  isPending: boolean
  allocationRequestId: number | null
}

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizePlanning(raw: any): PlanningEntry | null {
  const day = raw?.day ?? raw?.date
  if (!day || typeof day !== 'string') { return null }
  return {
    employeeId: toFiniteNumber(raw.employee_id ?? raw.employeeId ?? raw.employee?.id),
    projectId: toFiniteNumber(raw.project_id ?? raw.projectId ?? raw.project?.id),
    day,
    amount: toFiniteNumber(raw.amount ?? raw.hours),
    isPending: Boolean(raw.is_pending ?? raw.isPending),
    allocationRequestId: toFiniteNumber(raw.allocation_request_id ?? raw.allocationRequestId) || null,
  }
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

/** Accepts the `data` envelope of a planningboard response (or the plannings container itself). */
export function normalizePlanningsResponse(payload: unknown): PlanningEntry[] {
  const container = (payload as any)?.plannings ?? payload
  const entries: PlanningEntry[] = []
  for (const raw of collectRawPlannings(container)) {
    const entry = normalizePlanning(raw)
    if (entry) { entries.push(entry) }
  }
  return entries
}

/** Keep only the given employee's plannings on the given projects (e.g. leave projects 83/90). */
export function filterPlannings(entries: PlanningEntry[], employeeId: number, projectIds: Iterable<number>): PlanningEntry[] {
  const wanted = new Set([...projectIds].map(Number))
  return entries.filter((entry) => entry.employeeId === Number(employeeId) && wanted.has(entry.projectId))
}
