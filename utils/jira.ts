import { useUserStore } from '~/stores/user'
import { connectOAuth, getActivityWithRetry, type OAuthProviderConfig } from '~/utils/oauthPopup'

function getJiraConfig(): OAuthProviderConfig {
  const userStore = useUserStore()
  return {
    name: 'Jira',
    callbackType: 'jira-oauth-callback',
    authorizeUrl: 'https://auth.atlassian.com/authorize',
    scopes: 'read:jira-work read:jira-user',
    clientIdKey: 'jiraClientId',
    redirectPath: '/jira-callback.html',
    tokenEndpoint: 'jira-token',
    activityEndpoint: 'jira-activity',
    stateParam: 'jira-auth',
    extraAuthorizeParams: { audience: 'api.atlassian.com', prompt: 'consent' },
    setAuth: (data) => {
      userStore.setJiraAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        ...(data.cloud_id && { cloudId: data.cloud_id }),
      })
    },
    clearAuth: () => userStore.clearJiraAuth(),
    getAccessToken: () => userStore.jiraAccessToken,
    getRefreshToken: () => userStore.jiraRefreshToken,
    isTokenValid: () => userStore.isJiraTokenValid,
    isRefreshable: () => userStore.isJiraRefreshable,
    getActivityHeaders: (accessToken) => ({
      'x-jira-cloud-id': userStore.jiraCloudId!,
      'x-jira-access-token': accessToken,
    }),
  }
}

export async function connectJira(): Promise<void> {
  await connectOAuth(getJiraConfig())
}

export async function getJiraActivity(day: Date | string): Promise<any[]> {
  return getActivityWithRetry(getJiraConfig(), day)
}
