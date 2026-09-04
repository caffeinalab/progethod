import { getRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

// Wethod removed `planningboard/` (route_not_found). Leave data now lives in
// `planning-groups`, which filters by date overlap with operator-prefixed
// params: from_date=lte:<rangeEnd>&to_date=gte:<rangeStart>.
// We keep the client-facing route/params (`from`, `to`) unchanged and
// translate here so Wethod quirks stay server-side.
//
// Wethod silently ignores person/project filters and always returns the
// company-wide payload (~115KB/month), so we trim it here before responding:
// callers pass `projects` (comma-separated ids) and/or `employeeId` and get
// back only the rows they need (a few hundred bytes for one user's leave).
export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const projectsFilter = (searchParams.get('projects') || '')
    .split(',')
    .map(Number)
    .filter(Boolean)
  const employeeId = Number(searchParams.get('employeeId')) || null

  const params = new URLSearchParams()
  if (from) { params.set('to_date', `gte:${from}`) }
  if (to) { params.set('from_date', `lte:${to}`) }

  const { body, status } = await getRequest('planning-groups', params, authToken, env)

  if (status === 200 && Array.isArray(body?.data) && (projectsFilter.length || employeeId)) {
    body.data = body.data.filter((group) => {
      if (employeeId && Number(group?.person_id) !== employeeId) { return false }
      if (projectsFilter.length && !projectsFilter.includes(Number(group?.project_id))) { return false }
      return true
    })
  }

  return new JSONResponse(body, { status })
}
