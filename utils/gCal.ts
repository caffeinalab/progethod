import { startOfDay, endOfDay, differenceInMinutes, parseISO } from 'date-fns'
import { useUserStore } from '~/stores/user'

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile'

let loadedPromise: Promise<void> | null = null

function waitForGapi(): Promise<void> {
  if (window.gapi) return Promise.resolve()
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.gapi) { clearInterval(interval); resolve() }
    }, 100)
  })
}

function loadGApiClient(): Promise<void> {
  if (!loadedPromise) {
    loadedPromise = waitForGapi().then(() => new Promise((resolve) => {
      const config = useRuntimeConfig()
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: config.public.gCalApiKey,
          discoveryDocs: [DISCOVERY_DOC],
        })
        resolve()
      })
    }))
  }
  return loadedPromise
}

function waitForGsi(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(interval); resolve() }
    }, 100)
  })
}

function hasGapiAccessToken(): boolean {
  return !!window.gapi?.client?.getToken()?.access_token
}

function clearGapiAccessToken() {
  if (window.gapi?.client?.getToken()) {
    window.gapi.client.setToken(null)
  }
}

function isAuthError(error: any): boolean {
  const status = error?.status ?? error?.result?.error?.code
  if (status === 401 || status === 403) return true

  const reason = String(
    error?.error
    || error?.result?.error?.status
    || error?.result?.error?.message
    || error?.message
    || '',
  ).toLowerCase()

  return (
    reason.includes('login_required')
    || reason.includes('interaction_required')
    || reason.includes('consent_required')
    || reason.includes('invalid_grant')
    || reason.includes('invalid_token')
    || reason.includes('unauthenticated')
    || reason.includes('access_denied')
  )
}

async function connectCalendar({ interactive = false }: { interactive?: boolean } = {}): Promise<void> {
  await waitForGsi()
  const config = useRuntimeConfig()
  const userStore = useUserStore()

  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: config.public.gCalClientId,
    scope: SCOPES,
    callback: '',
  })

  const authorizedPromise = new Promise<void>((resolve, reject) => {
    tokenClient.callback = (tokenResponse: any) => {
      if (tokenResponse.error !== undefined) {
        console.warn('Google Calendar token request failed', tokenResponse)
        return reject(tokenResponse)
      }
      // GIS usually wires this for gapi.client, but set it explicitly so retries are reliable
      window.gapi.client.setToken(tokenResponse)
      userStore.authorizedGoogleToken(tokenResponse.expires_in)
      fetchGoogleProfilePic(tokenResponse.access_token)
      resolve()
    }
  })

  // consent when we need a fresh interactive login; empty prompt for silent refresh
  tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' })
  return authorizedPromise
}

async function ensureCalendarAuth(): Promise<void> {
  const userStore = useUserStore()
  const hasLiveToken = hasGapiAccessToken() && !!userStore.isGoogleTokenValid

  if (hasLiveToken) return

  // Prefer silent refresh first (returning users), then fall back to interactive consent
  try {
    await connectCalendar({ interactive: false })
  } catch (silentError) {
    console.warn('Silent Google Calendar auth failed, prompting user', silentError)
    userStore.invalidateGoogleToken()
    clearGapiAccessToken()
    await connectCalendar({ interactive: true })
  }
}

async function withCalendarAuthRetry<T>(operation: () => Promise<T>): Promise<T> {
  await loadGApiClient()
  await ensureCalendarAuth()

  try {
    return await operation()
  } catch (error) {
    if (!isAuthError(error)) throw error

    console.warn('Google Calendar request unauthorized, re-prompting login', error)
    const userStore = useUserStore()
    userStore.invalidateGoogleToken()
    clearGapiAccessToken()
    await connectCalendar({ interactive: true })
    return await operation()
  }
}

async function fetchGoogleProfilePic(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await response.json()
    if (data.picture) {
      const userStore = useUserStore()
      userStore.setProfilePicUrl(data.picture)
    }
  } catch (error) {
    console.warn('Could not fetch Google profile picture', error)
  }
}

export async function getEvents(day: Date) {
  return withCalendarAuthRetry(async () => {
    const request = {
      calendarId: 'primary',
      timeMin: startOfDay(day).toISOString(),
      timeMax: endOfDay(day).toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    }
    const response = await window.gapi.client.calendar.events.list(request)
    return response.result.items || []
  })
}

export async function createOutOfOfficeEvent(dateStr: string, _nextDateStr: string, options: { startTime?: string; endTime?: string } = {}) {
  return withCalendarAuthRetry(async () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const startTime = options.startTime || '09:00'
    const endTime = options.endTime || '18:00'

    const existing = await findExistingOooEvent(dateStr, startTime, endTime, timeZone)
    if (existing) return existing

    const resource: any = {
      summary: 'OOO',
      eventType: 'outOfOffice',
      outOfOfficeProperties: { autoDeclineMode: 'declineAllConflictingInvitations' },
      transparency: 'opaque',
      visibility: 'public',
      start: { dateTime: `${dateStr}T${startTime}:00`, timeZone },
      end: { dateTime: `${dateStr}T${endTime}:00`, timeZone },
    }

    const response = await window.gapi.client.calendar.events.insert({ calendarId: 'primary', resource })
    return response.result
  })
}

async function findExistingOooEvent(dateStr: string, startTime: string, endTime: string, _timeZone: string) {
  const dayStart = `${dateStr}T00:00:00`
  const dayEnd = `${dateStr}T23:59:59`

  const response = await window.gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date(dayStart).toISOString(),
    timeMax: new Date(dayEnd).toISOString(),
    singleEvents: true,
    eventTypes: 'outOfOffice',
  })

  const events = response.result.items || []
  return events.find((event: any) => event.eventType === 'outOfOffice') || null
}

function matchEventToProject(description: string | null, projects: any[]) {
  if (!description) { return null }
  const matches = Array.from(description.matchAll(/\[progethod:([0-9]+):((generic)|(uid_[a-z0-9]+))\]/g))
  if (matches.length < 1) { return null }
  const [, projectIdString, areaIdString] = matches[0]
  const projectId = parseInt(projectIdString)
  const areaId = areaIdString === 'generic' ? null : areaIdString
  return projects.find(project => project.linkedProjectId === projectId && project.linkedAreaId === areaId)
}

export function mapEventsToTimesheetEntries(events: any[], currentEntries: any[], projects: any[]) {
  return events
    .filter((event: any) => !currentEntries.find(entry => entry.data.gCalId === event.id))
    .filter((event: any) => event.start.dateTime && event.eventType === 'default')
    .filter((event: any) => !event.description || !event.description.match(/\[progethod:ignore\]/g))
    .map((event: any) => ({
      duration: Math.ceil(differenceInMinutes(parseISO(event.end.dateTime), parseISO(event.start.dateTime)) / 15) * 15,
      project: matchEventToProject(event.description, projects),
      notes: event.summary,
      gCalId: event.id,
    }))
}
