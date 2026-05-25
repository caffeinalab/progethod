import { getRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

// Wethod caps a single timetrackingboard response at ~2000 entries (500 above
// that). For tenants with more projects we paginate server-side: fetch pages
// of PAGE_SIZE, merge all `data` arrays, and return a single flat response.
const PAGE_SIZE = 2000
const MAX_PAGES = 10

export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)

  const envLimit = parseInt(env.BOARD_FETCH_LIMIT, 10)
  const pageSize = Number.isFinite(envLimit) && envLimit > 0
    ? envLimit
    : PAGE_SIZE

  searchParams.set('limit', String(pageSize))

  const allEntries = []
  let lastStatus = 200

  for (let page = 0; page < MAX_PAGES; page++) {
    searchParams.set('offset', String(page * pageSize))

    const { body, status } = await getRequest('timetrackingboard', searchParams, authToken, env)
    lastStatus = status

    if (status !== 200 || !Array.isArray(body?.data)) {
      if (page === 0) {
        return new JSONResponse(body, { status })
      }
      break
    }

    allEntries.push(...body.data)

    if (body.data.length < pageSize) {
      break
    }
  }

  return new JSONResponse({ code: 200, status: 'Ok', data: allEntries }, { status: lastStatus })
}
