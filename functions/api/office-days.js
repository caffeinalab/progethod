import { getRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

const CONCURRENCY = 5

export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return new JSONResponse({ code: 400, message: 'Missing from/to params' }, { status: 400 })
  }

  const workingDays = getWorkingDaysInRange(from, to)
  const officeDays = []

  for (let batch = 0; batch < workingDays.length; batch += CONCURRENCY) {
    const chunk = workingDays.slice(batch, batch + CONCURRENCY)
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

function getWorkingDaysInRange (from, to) {
  const days = []
  const current = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')

  while (current <= end) {
    const dow = current.getDay()
    if (dow !== 0 && dow !== 6) {
      days.push(current.toISOString().slice(0, 10))
    }
    current.setDate(current.getDate() + 1)
  }

  return days
}
