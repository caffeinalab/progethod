import { JSONResponse } from '../utils/response'

// Public Google Calendar "Festività in Italia" — no auth needed, covers ~10
// years with one all-day event per holiday (no RRULE expansion required).
const ICAL_URL = 'https://calendar.google.com/calendar/ical/it.italian%23holiday%40group.v.calendar.google.com/public/basic.ics'

// The calendar also includes observances that are not days off (Venerdì
// Santo, Festa della Mamma, San Silvestro, ...). Only allow actual Italian
// public holidays, so expected/working hours are never skewed by them.
const PUBLIC_HOLIDAY_NAMES = new Set([
  'Capodanno',
  'Epifania',
  'Pasqua',
  'Lunedì di Pasquetta',
  'Liberazione',
  'Festa del Lavoro',
  'Festa della Repubblica',
  'Assunzione',
  'Ferragosto',
  "San Francesco d'Assisi",
  'Tutti i Santi',
  'Immacolata',
  'Natale',
  'Santo Stefano'
])

export async function onRequestGet () {
  const response = await fetch(ICAL_URL)

  if (!response.ok) {
    return new JSONResponse(
      { code: response.status, message: 'Failed to fetch holidays calendar' },
      { status: 502 }
    )
  }

  const icalText = await response.text()
  const holidays = parseHolidays(icalText)

  return new JSONResponse(
    { code: 200, data: holidays },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
  )
}

function parseHolidays (icalText) {
  const events = icalText.split('BEGIN:VEVENT')
  const seen = new Map()

  for (let eventIndex = 1; eventIndex < events.length; eventIndex++) {
    const block = events[eventIndex]
    const summary = extractField(block, 'SUMMARY')

    if (!summary || !PUBLIC_HOLIDAY_NAMES.has(summary)) {
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
