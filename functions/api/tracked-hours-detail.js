import { JSONResponse } from '../utils/response'
import {
  fetchTimetrackingBoardPages,
  hoursReachExpected,
  sumAreaHours,
  sumBoardHours,
} from '../utils/fetchTimetrackingBoard'

/**
 * Lightweight day breakdown of hours on Wethod.
 * Query: date (required), bu (optional CSV), expected (optional decimal hours).
 * Paginates the board, returns only areas with hours > 0, and stops early
 * once found hours reach `expected` (the badge total from tracked-hours).
 */
export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return new JSONResponse({ code: 400, status: 'Error', message: 'date is required' }, { status: 400 })
  }

  const expected = parseFloat(searchParams.get('expected'))
  const params = new URLSearchParams({ date })

  const bu = searchParams.get('bu')
  if (bu) {
    params.set('bu', bu)
  }

  const { entries, status, body } = await fetchTimetrackingBoardPages(
    params,
    authToken,
    env,
    {
      shouldStop: (allEntries) =>
        Number.isFinite(expected) && hoursReachExpected(sumBoardHours(allEntries), expected),
    },
  )

  if (status !== 200 && entries.length === 0) {
    return new JSONResponse(body, { status })
  }

  const detail = []
  for (const project of entries) {
    const projectName = project.project?.name || '—'
    const projectId = project.project?.id ?? project.id

    for (const area of project.areas || []) {
      const hours = area.hours || {}
      const total = sumAreaHours(hours)
      if (total <= 0) { continue }

      detail.push({
        projectId,
        projectName,
        areaId: area.id,
        areaName: area.name || null,
        notes: typeof area.notes === 'string' ? area.notes : null,
        hours: {
          internal: hours.internal || 0,
          remote: hours.remote || 0,
          travel: hours.travel || 0,
          overtime: hours.overtime || 0,
          night_shift: hours.night_shift || 0,
        },
        total,
      })
    }
  }

  detail.sort((first, second) => second.total - first.total
    || first.projectName.localeCompare(second.projectName))

  return new JSONResponse({
    code: 200,
    status: 'Ok',
    data: {
      entries: detail,
      total: detail.reduce((sum, entry) => sum + entry.total, 0),
      reachedExpected: Number.isFinite(expected)
        ? hoursReachExpected(detail.reduce((sum, entry) => sum + entry.total, 0), expected)
        : null,
    },
  }, { status: 200 })
}
