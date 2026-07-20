import { getRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

const CONCURRENCY = 5

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
        const { body, status } = await getRequest('timetrackingboard', params, authToken, env)

        if (status !== 200 || !Array.isArray(body?.data)) {
          return null
        }

        let totalInternal = 0
        for (const project of body.data) {
          for (const area of project.areas || []) {
            if (area.hours?.internal > 0) {
              totalInternal += area.hours.internal
            }
          }
        }

        return totalInternal >= 8 ? date : null
      })
    )

    results.filter(Boolean).forEach(date => officeDays.push(date))
  }

  return new JSONResponse({ code: 200, data: officeDays })
}
