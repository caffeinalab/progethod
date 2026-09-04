// Diagnostic checks for the Wethod API surface the app depends on.
// Each check calls an endpoint and validates the response against an expected
// shape. Matching is a SUBSET: extra fields returned by Wethod are fine,
// missing/wrong-typed expected fields fail the check. The goal is to surface
// upstream breakage (renamed routes, changed payloads) before users notice.

import { addDays, format, getDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export type ShapeSpec = string | { [key: string]: ShapeSpec } | [ShapeSpec]

export interface ShapeMismatch {
  path: string
  expected: string
  actual: string
}

export class DiagnosticFailure extends Error {
  details: string[]

  constructor(message: string, details: string[] = []) {
    super(message)
    this.details = details
  }
}

function typeOf(value: unknown): string {
  if (value === null) { return 'null' }
  if (Array.isArray(value)) { return 'array' }
  return typeof value
}

export function matchShape(value: unknown, spec: ShapeSpec, path = 'response'): ShapeMismatch[] {
  if (Array.isArray(spec)) {
    if (!Array.isArray(value)) { return [{ path, expected: 'array', actual: typeOf(value) }] }
    if (value.length === 0) { return [] } // empty array: nothing to infer element shape from
    return matchShape(value[0], spec[0], `${path}[0]`)
  }
  if (typeof spec === 'string') {
    if (spec === 'any') { return [] }
    const actual = typeOf(value)
    return actual === spec ? [] : [{ path, expected: spec, actual }]
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [{ path, expected: 'object', actual: typeOf(value) }]
  }
  const mismatches: ShapeMismatch[] = []
  for (const [key, childSpec] of Object.entries(spec)) {
    mismatches.push(...matchShape((value as Record<string, unknown>)[key], childSpec, `${path}.${key}`))
  }
  return mismatches
}

/** Wethod envelopes carry { code, status, data }; HTTP can be 200 while code is an error. */
export function assertEnvelope(body: any): void {
  if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
    const message = body?.data?.message || body?.message || `code ${body.code}`
    throw new DiagnosticFailure(String(message))
  }
}

export function assertShape(value: unknown, spec: ShapeSpec): void {
  const mismatches = matchShape(value, spec)
  if (mismatches.length > 0) {
    throw new DiagnosticFailure(
      'unexpected response shape',
      mismatches.map((mismatch) => `${mismatch.path}: expected ${mismatch.expected}, got ${mismatch.actual}`),
    )
  }
}

export interface DiagnosticContext {
  api: ReturnType<typeof useApi>
  employeeId: number
  today: string
  /** CSV of selected business unit ids (null = all) — same filter as project refresh. */
  bu: string | null
  /** Shared scratch space across checks (board reuse, created request id, cleanup payload). */
  cache: {
    board?: any[]
    createdRequestId?: number | null
    timetrackingCleanup?: any | null
  }
}

export interface DiagnosticCheck {
  id: string
  /** Write checks run sequentially after all read checks (which run in parallel). */
  write: boolean
  run: (ctx: DiagnosticContext) => Promise<void>
}

const VACATION_PROJECT_ID = 83
const TEST_NOTES = 'test'
const TEST_HOURS = 0.1

function withBu(ctx: DiagnosticContext, params: Record<string, unknown>): Record<string, unknown> {
  if (ctx.bu) { params.bu = ctx.bu }
  return params
}

async function fetchBoard(ctx: DiagnosticContext): Promise<any[]> {
  const response: any = await ctx.api.$get('timetrackingboard', { params: withBu(ctx, { date: ctx.today }) })
  assertEnvelope(response)
  assertShape(response, { data: [{ can_edit: 'boolean', areas: 'array' }] })
  ctx.cache.board = Array.isArray(response?.data) ? response.data : []
  return ctx.cache.board
}

/** First weekday at least 14 days out with no existing allocation request. */
function pickFreeWeekday(takenDates: Set<string>): string {
  let candidate = addDays(new Date(), 14)
  for (let offset = 0; offset < 45; offset++) {
    const dayOfWeek = getDay(candidate)
    const dateKey = format(candidate, 'yyyy-MM-dd')
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !takenDates.has(dateKey)) { return dateKey }
    candidate = addDays(candidate, 1)
  }
  throw new DiagnosticFailure('no free weekday found in the next 45 days')
}

function extractCreatedRequestId(body: any): number | null {
  const data = body?.data
  const id = data?.id
    ?? data?.allocation_request?.id
    ?? data?.request?.id
    ?? (Array.isArray(data) ? data[0]?.id : undefined)
  const parsed = Number(id)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function buildDiagnosticChecks(): DiagnosticCheck[] {
  return [
    {
      id: 'me',
      write: false,
      async run(ctx) {
        const response: any = await ctx.api.$get('me')
        assertEnvelope(response)
        assertShape(response, { data: { employee_id: 'number', email: 'string' } })
      },
    },
    {
      id: 'planningboard',
      write: false,
      async run(ctx) {
        const now = new Date()
        const params = {
          from: format(startOfMonth(now), 'yyyy-MM-dd'),
          to: format(endOfMonth(now), 'yyyy-MM-dd'),
          person_id: ctx.employeeId,
        }
        const response: any = await ctx.api.$get('planningboard', { params })
        assertEnvelope(response)
        assertShape(response, { data: [{ project_id: 'number', person_id: 'number', daily_minutes: 'number', dates: 'array' }] })
      },
    },
    {
      id: 'timetrackingboard',
      write: false,
      async run(ctx) {
        await fetchBoard(ctx)
      },
    },
    {
      id: 'tracked_hours',
      write: false,
      async run(ctx) {
        const now = new Date()
        const params = {
          from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          employeeId: ctx.employeeId,
        }
        const response: any = await ctx.api.$get('tracked-hours', { params })
        assertEnvelope(response)
        assertShape(response, { data: [{ date: 'string', value: 'number' }] })
      },
    },
    {
      id: 'tracked_hours_detail',
      write: false,
      async run(ctx) {
        const response: any = await ctx.api.$get('tracked-hours-detail', { params: withBu(ctx, { date: ctx.today }) })
        assertEnvelope(response)
        assertShape(response, { data: { entries: 'array', total: 'number' } })
      },
    },
    {
      id: 'office_days',
      write: false,
      async run(ctx) {
        const response: any = await ctx.api.$get('office-days', { params: withBu(ctx, { date: ctx.today }) })
        assertEnvelope(response)
        assertShape(response, { data: { date: 'string', internal: 'number', isOfficeDay: 'boolean' } })
      },
    },
    {
      id: 'timeoff',
      write: false,
      async run(ctx) {
        const params = { offset: 0, limit: 100, search: '', year: new Date().getFullYear() }
        const response: any = await ctx.api.$get('timeoff', { params })
        assertEnvelope(response)
        assertShape(response, { data: [{ employee: 'object', time_off_targets: 'object' }] })
      },
    },
    {
      id: 'allocation_list',
      write: false,
      async run(ctx) {
        const params = { offset: 0, limit: 1, ownership: 'mine', search: '', order: 'status', sort: 'desc' }
        const response: any = await ctx.api.$get('allocation-request', { params })
        assertEnvelope(response)
        assertShape(response, { data: [{ id: 'number', status: 'string', project: 'object', days: 'array' }] })
      },
    },
    {
      id: 'allocation_create',
      write: true,
      async run(ctx) {
        const listParams = { offset: 0, limit: 100, ownership: 'mine', search: '', order: 'status', sort: 'desc' }
        const listResponse: any = await ctx.api.$get('allocation-request', { params: listParams })
        assertEnvelope(listResponse)
        const takenDates = new Set<string>()
        for (const request of Array.isArray(listResponse?.data) ? listResponse.data : []) {
          for (const day of request?.days || []) {
            const dateKey = day?.date || day?.day
            if (dateKey) { takenDates.add(dateKey) }
          }
        }
        const date = pickFreeWeekday(takenDates)
        const payload = { notes: TEST_NOTES, days: [{ date, hours: 8 }], project: VACATION_PROJECT_ID }
        const response: any = await ctx.api.$post('allocation-request', payload)
        assertEnvelope(response)
        const createdId = extractCreatedRequestId(response)
        if (!createdId) {
          throw new DiagnosticFailure('create succeeded but no request id found in response', [
            `response.data: expected an id field, got ${JSON.stringify(Object.keys(response?.data ?? {}))}`,
          ])
        }
        ctx.cache.createdRequestId = createdId
      },
    },
    {
      id: 'allocation_update',
      write: true,
      async run(ctx) {
        if (!ctx.cache.createdRequestId) { throw new DiagnosticFailure('skipped: no request was created') }
        const response: any = await ctx.api.$patch(`allocation-request/${ctx.cache.createdRequestId}`, {
          notes: TEST_NOTES,
          project: VACATION_PROJECT_ID,
        })
        assertEnvelope(response)
      },
    },
    {
      id: 'allocation_delete',
      write: true,
      async run(ctx) {
        if (!ctx.cache.createdRequestId) { throw new DiagnosticFailure('skipped: no request was created') }
        const response: any = await ctx.api.$delete(`allocation-request/${ctx.cache.createdRequestId}`)
        assertEnvelope(response)
        ctx.cache.createdRequestId = null
      },
    },
    {
      id: 'timetracking_write',
      write: true,
      async run(ctx) {
        const board = ctx.cache.board ?? await fetchBoard(ctx)
        const projectIdOf = (entry: any) => Number(entry?.project?.id ?? entry?.id)
        // Leave projects (83/90) are is_timesheet_automatic, so can_edit is
        // always false — write the test hours to the first editable project.
        const target = board.find((entry) => entry?.can_edit === true)
        if (!target) {
          throw new DiagnosticFailure('no editable project on today\'s board — user may not be whitelisted')
        }
        const projectId = projectIdOf(target)
        // Board areas are objects ({ id, name, hours, on }); the "generic" area
        // has id null. Prefer the first named area, else null (both are valid
        // write targets — real submissions post null area_id for generic).
        const areaIds = (target.areas || []).map((area: any) => (area && typeof area === 'object' ? area.id : area))
        const areaId = areaIds.find((id: unknown) => id != null) ?? null
        const baseHours = { internal: null, remote: null, travel: null, overtime: null, night_shift: null }
        const writePayload = {
          project_id: projectId,
          employee_id: ctx.employeeId,
          date: ctx.today,
          hours: [{ area_id: areaId, types: { ...baseHours, remote: TEST_HOURS }, notes: TEST_NOTES }],
        }
        const response: any = await ctx.api.$post('timetracking', writePayload)
        assertEnvelope(response)
        ctx.cache.timetrackingCleanup = {
          project_id: projectId,
          employee_id: ctx.employeeId,
          date: ctx.today,
          hours: [{ area_id: areaId, types: { ...baseHours } }],
        }
      },
    },
    {
      id: 'timetracking_cleanup',
      write: true,
      async run(ctx) {
        if (!ctx.cache.timetrackingCleanup) { throw new DiagnosticFailure('skipped: no test hours were written') }
        const response: any = await ctx.api.$post('timetracking', ctx.cache.timetrackingCleanup)
        assertEnvelope(response)
        ctx.cache.timetrackingCleanup = null
      },
    },
  ]
}
