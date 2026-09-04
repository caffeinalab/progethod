import { getRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

// Wethod removed `planningboard/` (route_not_found). Leave data now lives in
// `planning-groups`, which filters by date overlap with operator-prefixed
// params: from_date=lte:<rangeEnd>&to_date=gte:<rangeStart>.
// We keep the client-facing route/params (`from`, `to`) unchanged and
// translate here so Wethod quirks stay server-side.
// Note: Wethod silently ignores the `person_id` filter today, so the response
// is company-wide and callers filter client-side. We still forward it — if
// Wethod ever honors the filter, the payload shrinks with no client change.
export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const personId = searchParams.get('person_id')

  const params = new URLSearchParams()
  if (from) { params.set('to_date', `gte:${from}`) }
  if (to) { params.set('from_date', `lte:${to}`) }
  if (personId) { params.set('person_id', personId) }

  const { body, status } = await getRequest('planning-groups', params, authToken, env)

  return new JSONResponse(body, { status })
}
