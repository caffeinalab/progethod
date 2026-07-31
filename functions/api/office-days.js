import { JSONResponse } from '../utils/response'
import {
  fetchTimetrackingBoardPages,
  hoursReachExpected,
  sumBoardInternalHours,
  sumBoardWorkHours,
} from '../utils/fetchTimetrackingBoard'

const OFFICE_DAY_THRESHOLD = 8

/**
 * Single-day office check (client fans out in parallel for speed + progress).
 * Query: date (required), expected (optional tracked-hours total for early-stop),
 * bu (optional CSV of business unit ids — same filter as project refresh / hours detail).
 * Office day = non-automatic `internal` hours >= 8.
 */
export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return new JSONResponse(
      { code: 400, status: 'Error', message: 'date is required' },
      { status: 400 },
    )
  }

  const expectedRaw = parseFloat(searchParams.get('expected'))
  const expected = Number.isFinite(expectedRaw) && expectedRaw > 0 ? expectedRaw : null
  const bu = searchParams.get('bu') || null

  console.log(`office-days: checking ${date} (expected=${expected ?? 'n/a'}, bu=${bu ?? 'all'})`)

  const result = await inspectDay({ date, expected, bu }, authToken, env)

  if (result.error) {
    console.error(`office-days: failed on ${date}: ${result.error}`)
    return new JSONResponse(
      { code: 502, status: 'Error', message: `Failed to inspect ${date}` },
      { status: 502 },
    )
  }

  console.log(`office-days: ${date} internal=${result.internal} office=${result.isOfficeDay}`)

  return new JSONResponse({
    code: 200,
    data: {
      date: result.date,
      internal: result.internal,
      isOfficeDay: result.isOfficeDay,
    },
  })
}

/**
 * @param {{ date: string, expected: number | null, bu: string | null }} candidate
 * @param {string} authToken
 * @param {object} env
 */
async function inspectDay (candidate, authToken, env) {
  const { date, expected, bu } = candidate
  const params = new URLSearchParams({ date })
  if (bu) {
    params.set('bu', bu)
  }

  try {
    const { entries, status } = await fetchTimetrackingBoardPages(
      params,
      authToken,
      env,
      {
        shouldStop: (allEntries) => {
          if (hoursReachExpected(sumBoardInternalHours(allEntries), OFFICE_DAY_THRESHOLD)) {
            return true
          }
          // Stop once tracked work hours are accounted for so remote days
          // don't paginate the entire board.
          if (expected != null && hoursReachExpected(sumBoardWorkHours(allEntries), expected)) {
            return true
          }
          return false
        },
      },
    )

    const internal = sumBoardInternalHours(entries)
    const workTotal = sumBoardWorkHours(entries)
    const isOfficeDay = hoursReachExpected(internal, OFFICE_DAY_THRESHOLD)
    const accountedForExpected = expected != null && hoursReachExpected(workTotal, expected)

    if (status !== 200 && entries.length === 0) {
      return { date, error: `status ${status}` }
    }

    if (status !== 200 && !isOfficeDay && !accountedForExpected) {
      return { date, error: `incomplete board fetch (status ${status})` }
    }

    return { date, internal, isOfficeDay, error: null }
  } catch (error) {
    return { date, error: error?.message || 'unknown error' }
  }
}
