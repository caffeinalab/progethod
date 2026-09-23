import { useUserStore } from '~/stores/user'
import { connectOAuth, ensureOAuth, fetchActivity, type OAuthProviderConfig } from '~/utils/oauthPopup'

function getGitlabConfig(): OAuthProviderConfig {
  const userStore = useUserStore()
  return {
    name: 'GitLab',
    callbackType: 'gitlab-oauth-callback',
    authorizeUrl: 'https://gitlab.com/oauth/authorize',
    scopes: 'read_user read_api',
    clientIdKey: 'gitlabClientId',
    redirectPath: '/gitlab-callback.html',
    tokenEndpoint: 'gitlab-token',
    activityEndpoint: 'gitlab-activity',
    stateParam: 'gitlab-auth',
    setAuth: (data) => {
      userStore.setGitlabAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      })
    },
    clearAuth: () => userStore.clearGitlabAuth(),
    getAccessToken: () => userStore.gitlabAccessToken,
    getRefreshToken: () => userStore.gitlabRefreshToken,
    isTokenValid: () => userStore.isGitlabTokenValid,
    isRefreshable: () => userStore.isGitlabRefreshable,
    getActivityHeaders: (accessToken) => ({
      'x-gitlab-access-token': accessToken,
    }),
  }
}

export async function connectGitlab(): Promise<void> {
  await connectOAuth(getGitlabConfig())
}

// In-flight request sharing, so a hover prefetch and the modal opening share a single
// request. Settled results are never kept — this is not a cache.
const inFlightRequests = new Map<string, Promise<any[]>>()

function fetchActivityShared(day: string): Promise<any[]> {
  const existing = inFlightRequests.get(day)
  if (existing) { return existing }
  const request = fetchActivity(getGitlabConfig(), day)
    .finally(() => { inFlightRequests.delete(day) })
  inFlightRequests.set(day, request)
  return request
}

export function prefetchGitlabActivity(day: string): void {
  const config = getGitlabConfig()
  // Never trigger a token refresh or the OAuth popup from a hover
  if (!config.getAccessToken() || !config.isTokenValid()) { return }
  void fetchActivityShared(day).catch(() => {})
}

export async function getGitlabActivity(day: Date | string): Promise<any[]> {
  const config = getGitlabConfig()
  await ensureOAuth(config)
  const dayString = typeof day === 'string' ? day : day.toISOString().split('T')[0]
  try {
    return await fetchActivityShared(dayString)
  } catch (error: any) {
    if (error.response?.status === 401) {
      config.clearAuth()
      await connectOAuth(config)
      return await fetchActivityShared(dayString)
    }
    throw error
  }
}
