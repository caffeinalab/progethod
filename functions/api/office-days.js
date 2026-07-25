import { JSONResponse } from '../utils/response'
import {
  fetchTimetrackingBoardPages,
  hoursReachExpected,
  sumBoardInternalHours,
} from '../utils/fetchTimetrackingBoard'

const CONCURRENCY = 5
const OFFICE_DAY_THRESHOLD = 8

export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)
  const datesParam = searchParams.get('dates')

  if (!datesParam) {
    return new JSONResponse({ code: 200, data: [] })
  }

  const dates = datesParam.split(',').filter(Boolean)

  if (dates.length === 0) {
    return new JSONResponse({ code: 200, data: [] })
  }

  const officeDays = []

  for (let batch = 0; batch < dates.length; batch += CONCURRENCY) {
    const chunk = dates.slice(batch, batch + CONCURRENCY)
    const results = await Promise.all(
      chunk.map(async (date) => {
        const params = new URLSearchParams({ date })
        const { entries, status } = await fetchTimetrackingBoardPages(
          params,
          authToken,
          env,
          {
            shouldStop: (allEntries) =>
              hoursReachExpected(sumBoardInternalHours(allEntries), OFFICE_DAY_THRESHOLD),
          },
        )

        if (status !== 200) {
          return null
        }

        return hoursReachExpected(sumBoardInternalHours(entries), OFFICE_DAY_THRESHOLD)
          ? date
          : null
      }),
    )

    results.filter(Boolean).forEach(date => officeDays.push(date))
  }

  return new JSONResponse({ code: 200, data: officeDays })
}
