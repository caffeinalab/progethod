import { startOfDay, endOfDay, differenceInMinutes, parseISO } from 'date-fns'

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile'

function connectCalendar () {
  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: process.env.gCalClientId,
    scope: SCOPES,
    callback: '' // defined later
  })

  const authorizedPromise = new Promise((resolve, reject) => {
    tokenClient.callback = (tokenResponse) => {
      if (tokenResponse.error !== undefined) {
        return reject(tokenResponse)
      }

      window.$nuxt.$store.commit('user/authorizedGoogleToken', tokenResponse.expires_in)

      fetchGoogleProfilePic(tokenResponse.access_token)

      resolve()
    }
  })

  tokenClient.requestAccessToken({ prompt: '' })

  return authorizedPromise
}

async function fetchGoogleProfilePic (accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const data = await response.json()
    if (data.picture) {
      window.$nuxt.$store.commit('user/setProfilePicUrl', data.picture)
    }
  } catch (error) {
    console.warn('Could not fetch Google profile picture', error)
  }
}

export async function getEvents (day) {
  // ensure apiClient is loaded
  await loadGApiClient()

  if (!window.$nuxt.$store.getters['user/isGoogleTokenValid']) {
    // ensure calendar is authorized and connected
    await connectCalendar()
  }

  const request = {
    calendarId: 'primary',
    timeMin: startOfDay(day).toISOString(),
    timeMax: endOfDay(day).toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime'
  }
  const response = await window.gapi.client.calendar.events.list(request)

  const events = response.result.items

  if (!events || events.length === 0) {
    return []
  }

  return events
}

// load event on gApi is called only once
let loadedPromise = null

function loadGApiClient () {
  if (!loadedPromise) {
    loadedPromise = new Promise((resolve) => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: process.env.gCalApiKey,
          discoveryDocs: [DISCOVERY_DOC]
        })

        resolve()
      })
    })
  }
  return loadedPromise
}

/**
 * Creates an all-day Out of Office event on the user's primary calendar.
 * @param {string} dateStr – ISO date like '2026-07-08'
 * @param {string} nextDateStr – ISO date of the following day like '2026-07-09'
 */
export async function createOutOfOfficeEvent (dateStr, nextDateStr) {
  await loadGApiClient()

  if (!window.$nuxt.$store.getters['user/isGoogleTokenValid']) {
    await connectCalendar()
  }

  const response = await window.gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: {
      summary: 'OOO',
      start: { date: dateStr },
      end: { date: nextDateStr },
      eventType: 'outOfOffice',
      outOfOfficeProperties: {
        autoDeclineMode: 'declineAllConflictingInvitations'
      },
      transparency: 'opaque',
      visibility: 'public'
    }
  })

  return response.result
}

function matchEventToProject (description, projects) {
  if (!description) {
    return null
  }

  const matches = Array.from(description.matchAll(/\[progethod:([0-9]{1,}):((generic)|(uid_[a-z0-9]{1,}))\]/g))

  if (matches.length < 1) {
    return null
  }

  // eslint-disable-next-line no-unused-vars
  const [fullTag, projectIdString, areaIdString] = matches[0]

  const projectId = parseInt(projectIdString)
  const areaId = areaIdString === 'generic' ? null : areaIdString

  return projects.find(p => p.linkedProjectId === projectId && p.linkedAreaId === areaId)
}

export function mapEventsToTimesheetEntries (events, currentEntries, projects) {
  return events
    // remove events already imported
    .filter(event => !currentEntries.find(e => e.data.gCalId === event.id))
    // remove all day events / out of office / focus time
    .filter(event => event.start.dateTime && event.eventType === 'default')
    // remove events that have the progethod ignore tag
    .filter(event => !event.description || !event.description.match(/\[progethod:ignore\]/g))
    .map(event => ({
      duration: Math.ceil(differenceInMinutes(parseISO(event.end.dateTime), parseISO(event.start.dateTime)) / 15) * 15,
      project: matchEventToProject(event.description, projects),
      notes: event.summary,
      gCalId: event.id
    }))
}
