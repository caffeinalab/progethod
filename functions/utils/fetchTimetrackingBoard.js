import { getRequest } from './client'

// Wethod caps a single timetrackingboard response at ~2000 entries (500 above
// that). For tenants with more projects we paginate: fetch pages of PAGE_SIZE
// and merge. Callers may early-stop via shouldStop.
const PAGE_SIZE = 2000
const MAX_PAGES = 10

/**
 * @param {URLSearchParams} searchParams
 * @param {string} authToken
 * @param {object} env
 * @param {{ shouldStop?: (allEntries: any[], pageEntries: any[]) => boolean }} [options]
 * @returns {Promise<{ entries: any[], status: number, body: any }>}
 */
export async function fetchTimetrackingBoardPages (searchParams, authToken, env, options = {}) {
  const { shouldStop } = options

  const envLimit = parseInt(env.BOARD_FETCH_LIMIT, 10)
  const pageSize = Number.isFinite(envLimit) && envLimit > 0
    ? envLimit
    : PAGE_SIZE

  const params = new URLSearchParams(searchParams)
  params.set('limit', String(pageSize))

  const allEntries = []
  let lastStatus = 200
  let lastBody = { code: 200, status: 'Ok', data: [] }

  for (let page = 0; page < MAX_PAGES; page++) {
    params.set('offset', String(page * pageSize))

    const { body, status } = await getRequest('timetrackingboard', params, authToken, env)
    lastStatus = status
    lastBody = body

    if (status !== 200 || !Array.isArray(body?.data)) {
      if (page === 0) {
        return { entries: [], status, body }
      }
      break
    }

    allEntries.push(...body.data)

    if (typeof shouldStop === 'function' && shouldStop(allEntries, body.data)) {
      break
    }

    if (body.data.length < pageSize) {
      break
    }
  }

  return { entries: allEntries, status: lastStatus, body: lastBody }
}

export function sumAreaHours (hours) {
  if (!hours) { return 0 }
  return (hours.internal || 0)
    + (hours.remote || 0)
    + (hours.travel || 0)
    + (hours.overtime || 0)
    + (hours.night_shift || 0)
}

export function sumBoardHours (entries) {
  let total = 0
  for (const project of entries) {
    for (const area of project.areas || []) {
      total += sumAreaHours(area.hours)
    }
  }
  return total
}

export function sumBoardInternalHours (entries) {
  let total = 0
  for (const project of entries) {
    if (project.project?.project_type?.is_timesheet_automatic) {
      continue
    }
    for (const area of project.areas || []) {
      if (area.hours?.internal > 0) {
        total += area.hours.internal
      }
    }
  }
  return total
}

/** Compare decimal hours at one-decimal precision (Wethod tenths). */
export function hoursReachExpected (found, expected) {
  if (!Number.isFinite(expected) || expected <= 0) { return false }
  return Math.round(found * 10) >= Math.round(expected * 10)
}
