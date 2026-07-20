import { useUserStore } from '~/stores/user'

const SCOPES = 'read:jira-work read:jira-user'
const AUTHORIZE_URL = 'https://auth.atlassian.com/authorize'

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function waitForCallback(popup: Window | null): Promise<string> {
  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) { return }
      if (event.data?.type !== 'jira-oauth-callback') { return }
      window.removeEventListener('message', handleMessage)
      clearInterval(pollTimer)
      if (event.data.error) { reject(new Error(event.data.error)) }
      else if (event.data.code) { resolve(event.data.code) }
      else { reject(new Error('Nessun codice ricevuto')) }
    }
    window.addEventListener('message', handleMessage)
    const pollTimer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollTimer)
        window.removeEventListener('message', handleMessage)
        reject(new Error('Popup chiuso'))
      }
    }, 500)
  })
}

export async function connectJira(): Promise<void> {
  const userStore = useUserStore()
  const config = useRuntimeConfig()
  const api = useApi()
  const redirectUri = `${window.location.origin}/jira-callback.html`
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: config.public.jiraClientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    response_type: 'code',
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: 'jira-auth',
  })

  const popupWidth = 600
  const popupHeight = 700
  const left = Math.round(window.screenX + (window.outerWidth - popupWidth) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - popupHeight) / 2)

  const popup = window.open(
    `${AUTHORIZE_URL}?${params}`,
    'jira-auth',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes`,
  )

  const code = await waitForCallback(popup)

  const tokenResponse = await api.$post<{ data: { access_token: string; refresh_token: string; expires_in: number; cloud_id: string } }>('jira-token', {
    code,
    codeVerifier,
    redirectUri,
  })

  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, cloud_id: cloudId } = tokenResponse.data
  userStore.setJiraAuth({ accessToken, refreshToken, expiresIn, cloudId })
}

async function refreshJiraToken(): Promise<void> {
  const userStore = useUserStore()
  const api = useApi()
  const refreshToken = userStore.jiraRefreshToken

  const tokenResponse = await api.$post<{ data: { access_token: string; refresh_token: string; expires_in: number } }>('jira-token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const { access_token: accessToken, refresh_token: newRefreshToken, expires_in: expiresIn } = tokenResponse.data
  userStore.setJiraAuth({ accessToken, refreshToken: newRefreshToken, expiresIn })
}

async function ensureJiraAuth(): Promise<void> {
  const userStore = useUserStore()
  if (!userStore.isJiraTokenValid) {
    if (userStore.isJiraRefreshable) {
      try { await refreshJiraToken() }
      catch { userStore.clearJiraAuth(); await connectJira() }
    } else {
      await connectJira()
    }
  }
}

async function fetchJiraActivity(day: Date | string): Promise<any[]> {
  const userStore = useUserStore()
  const api = useApi()
  const cloudId = userStore.jiraCloudId
  const accessToken = userStore.jiraAccessToken
  const dayString = typeof day === 'string' ? day : day.toISOString().split('T')[0]

  const response = await api.$get<{ data: any[] }>('jira-activity', {
    params: { day: dayString, _t: Date.now() },
    headers: { 'x-jira-cloud-id': cloudId!, 'x-jira-access-token': accessToken! },
  })

  return response.data || []
}

export async function getJiraActivity(day: Date | string): Promise<any[]> {
  await ensureJiraAuth()
  try {
    return await fetchJiraActivity(day)
  } catch (error: any) {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.clearJiraAuth()
      await connectJira()
      return await fetchJiraActivity(day)
    }
    throw error
  }
}
