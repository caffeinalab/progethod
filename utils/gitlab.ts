import { useUserStore } from '~/stores/user'

const SCOPES = 'read_user read_api'
const AUTHORIZE_URL = 'https://gitlab.com/oauth/authorize'

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
      if (event.data?.type !== 'gitlab-oauth-callback') { return }
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

export async function connectGitlab(): Promise<void> {
  const userStore = useUserStore()
  const config = useRuntimeConfig()
  const api = useApi()
  const redirectUri = `${window.location.origin}/gitlab-callback.html`
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    client_id: config.public.gitlabClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: 'gitlab-auth',
  })

  const popupWidth = 600
  const popupHeight = 700
  const left = Math.round(window.screenX + (window.outerWidth - popupWidth) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - popupHeight) / 2)

  const popup = window.open(
    `${AUTHORIZE_URL}?${params}`,
    'gitlab-auth',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes`,
  )

  const code = await waitForCallback(popup)

  const tokenResponse = await api.$post<{ data: { access_token: string; refresh_token: string; expires_in: number } }>('gitlab-token', {
    code,
    codeVerifier,
    redirectUri,
  })

  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenResponse.data
  userStore.setGitlabAuth({ accessToken, refreshToken, expiresIn })
}

async function refreshGitlabToken(): Promise<void> {
  const userStore = useUserStore()
  const api = useApi()
  const refreshToken = userStore.gitlabRefreshToken

  const tokenResponse = await api.$post<{ data: { access_token: string; refresh_token: string; expires_in: number } }>('gitlab-token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const { access_token: accessToken, refresh_token: newRefreshToken, expires_in: expiresIn } = tokenResponse.data
  userStore.setGitlabAuth({ accessToken, refreshToken: newRefreshToken, expiresIn })
}

async function ensureGitlabAuth(): Promise<void> {
  const userStore = useUserStore()
  if (!userStore.isGitlabTokenValid) {
    if (userStore.isGitlabRefreshable) {
      try { await refreshGitlabToken() }
      catch { userStore.clearGitlabAuth(); await connectGitlab() }
    } else {
      await connectGitlab()
    }
  }
}

async function fetchGitlabActivity(day: Date | string): Promise<any[]> {
  const userStore = useUserStore()
  const api = useApi()
  const accessToken = userStore.gitlabAccessToken
  const dayString = typeof day === 'string' ? day : day.toISOString().split('T')[0]

  const response = await api.$get<{ data: any[] }>('gitlab-activity', {
    params: { day: dayString, _t: Date.now() },
    headers: { 'x-gitlab-access-token': accessToken! },
  })

  return response.data || []
}

export async function getGitlabActivity(day: Date | string): Promise<any[]> {
  await ensureGitlabAuth()
  try {
    return await fetchGitlabActivity(day)
  } catch (error: any) {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.clearGitlabAuth()
      await connectGitlab()
      return await fetchGitlabActivity(day)
    }
    throw error
  }
}
