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

function loadGApiClient(): Promise<void> {
  if (!loadedPromise) {
    loadedPromise = new Promise((resolve) => {
      const config = useRuntimeConfig()
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: config.public.gCalApiKey,
          discoveryDocs: [DISCOVERY_DOC],
        })
        resolve()
      })
    })
  }
  return loadedPromise
}

function connectCalendar(): Promise<void> {
  const config = useRuntimeConfig()
  const userStore = useUserStore()

  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: config.public.gCalClientId,
    scope: SCOPES,
    callback: '',
  })

  const authorizedPromise = new Promise<void>((resolve, reject) => {
    tokenClient.callback = (tokenResponse: any) => {
      if (tokenResponse.error !== undefined) { return reject(tokenResponse) }
      userStore.authorizedGoogleToken(tokenResponse.expires_in)
      fetchGoogleProfilePic(tokenResponse.access_token)
      resolve()
    }
  })

  tokenClient.requestAccessToken({ prompt: '' })
  return authorizedPromise
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
  await loadGApiClient()
  const userStore = useUserStore()

  if (!userStore.isGoogleTokenValid) {
    await connectCalendar()
  }

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
}

export async function createOutOfOfficeEvent(dateStr: string, nextDateStr: string, options: { startTime?: string; endTime?: string } = {}) {
  await loadGApiClient()
  const userStore = useUserStore()

  if (!userStore.isGoogleTokenValid) {
    await connectCalendar()
  }

  const resource: any = {
    summary: 'OOO',
    eventType: 'outOfOffice',
    outOfOfficeProperties: { autoDeclineMode: 'declineAllConflictingInvitations' },
    transparency: 'opaque',
    visibility: 'public',
  }

  if (options.startTime && options.endTime) {
    resource.start = { dateTime: `${dateStr}T${options.startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    resource.end = { dateTime: `${dateStr}T${options.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  } else {
    resource.start = { date: dateStr }
    resource.end = { date: nextDateStr }
  }

  const response = await window.gapi.client.calendar.events.insert({ calendarId: 'primary', resource })
  return response.result
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
