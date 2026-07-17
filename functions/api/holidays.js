import { JSONResponse } from '../utils/response'

const ICAL_BASE_URL = 'https://factorialhr.com/icals'

export async function onRequestGet ({ env }) {
  const token = env.FACTORIAL_ICAL_TOKEN

  if (!token) {
    return new JSONResponse({ code: 500, message: 'FACTORIAL_ICAL_TOKEN not configured' }, { status: 500 })
  }

  const url = `${ICAL_BASE_URL}?token=${token}&own=true`
  const response = await fetch(url)

  if (!response.ok) {
    return new JSONResponse(
      { code: response.status, message: 'Failed to fetch Factorial calendar' },
      { status: 502 }
    )
  }

  const icalText = await response.text()
  const holidays = parseHolidays(icalText)

  return new JSONResponse({ code: 200, data: holidays })
}

function parseHolidays (icalText) {
  const events = icalText.split('BEGIN:VEVENT')
  const seen = new Map()

  for (let eventIndex = 1; eventIndex < events.length; eventIndex++) {
    const block = events[eventIndex]
    const summary = extractField(block, 'SUMMARY')

    if (!summary || summary.startsWith('🎉')) {
      continue
    }

    const dateStart = extractDateField(block, 'DTSTART')
    if (!dateStart) {
      continue
    }

    if (!seen.has(dateStart)) {
      seen.set(dateStart, summary)
    }
  }

  return Array.from(seen.entries())
    .map(([date, name]) => ({ date, name }))
    .sort((first, second) => first.date.localeCompare(second.date))
}

function extractField (block, fieldName) {
  const regex = new RegExp(`^${fieldName}[^:]*:(.+)$`, 'm')
  const match = block.match(regex)
  return match ? match[1].trim() : null
}

function extractDateField (block, fieldName) {
  const regex = new RegExp(`^${fieldName}[^:]*:(\\d{4})(\\d{2})(\\d{2})`, 'm')
  const match = block.match(regex)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}
