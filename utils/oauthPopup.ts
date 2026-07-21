export interface OAuthProviderConfig {
  name: string
  callbackType: string
  authorizeUrl: string
  scopes: string
  clientIdKey: string
  redirectPath: string
  tokenEndpoint: string
  activityEndpoint: string
  stateParam: string
  extraAuthorizeParams?: Record<string, string>
  setAuth: (data: Record<string, any>) => void
  clearAuth: () => void
  getAccessToken: () => string | null | undefined
  getRefreshToken: () => string | null | undefined
  isTokenValid: () => boolean
  isRefreshable: () => boolean
  getActivityHeaders: (accessToken: string) => Record<string, string>
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

export function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function waitForCallback(popup: Window | null, callbackType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) { return }
      if (event.data?.type !== callbackType) { return }
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

export async function connectOAuth(config: OAuthProviderConfig): Promise<void> {
  const runtimeConfig = useRuntimeConfig()
  const api = useApi()
  const redirectUri = `${window.location.origin}${config.redirectPath}`
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    client_id: (runtimeConfig.public as Record<string, any>)[config.clientIdKey],
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: config.stateParam,
    ...config.extraAuthorizeParams,
  })

  const popupWidth = 600
  const popupHeight = 700
  const left = Math.round(window.screenX + (window.outerWidth - popupWidth) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - popupHeight) / 2)

  const popup = window.open(
    `${config.authorizeUrl}?${params}`,
    config.stateParam,
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes`,
  )

  const code = await waitForCallback(popup, config.callbackType)

  const tokenResponse = await api.$post<{ data: Record<string, any> }>(config.tokenEndpoint, {
    code,
    codeVerifier,
    redirectUri,
  })

  config.setAuth(tokenResponse.data)
}

export async function refreshOAuthToken(config: OAuthProviderConfig): Promise<void> {
  const api = useApi()
  const refreshToken = config.getRefreshToken()

  const tokenResponse = await api.$post<{ data: Record<string, any> }>(config.tokenEndpoint, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  config.setAuth(tokenResponse.data)
}

export async function ensureOAuth(config: OAuthProviderConfig): Promise<void> {
  if (!config.isTokenValid()) {
    if (config.isRefreshable()) {
      try { await refreshOAuthToken(config) }
      catch { config.clearAuth(); await connectOAuth(config) }
    } else {
      await connectOAuth(config)
    }
  }
}

export async function fetchActivity(config: OAuthProviderConfig, day: Date | string): Promise<any[]> {
  const api = useApi()
  const accessToken = config.getAccessToken()
  const dayString = typeof day === 'string' ? day : day.toISOString().split('T')[0]

  const response = await api.$get<{ data: any[] }>(config.activityEndpoint, {
    params: { day: dayString, _t: Date.now() },
    headers: config.getActivityHeaders(accessToken!),
  })

  return response.data || []
}

export async function getActivityWithRetry(config: OAuthProviderConfig, day: Date | string): Promise<any[]> {
  await ensureOAuth(config)
  try {
    return await fetchActivity(config, day)
  } catch (error: any) {
    if (error.response?.status === 401) {
      config.clearAuth()
      await connectOAuth(config)
      return await fetchActivity(config, day)
    }
    throw error
  }
}
