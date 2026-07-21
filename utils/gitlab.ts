import { useUserStore } from '~/stores/user'
import { connectOAuth, getActivityWithRetry, type OAuthProviderConfig } from '~/utils/oauthPopup'

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

export async function getGitlabActivity(day: Date | string): Promise<any[]> {
  return getActivityWithRetry(getGitlabConfig(), day)
}
