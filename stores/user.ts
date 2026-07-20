import { defineStore } from 'pinia'
import { isAfter, addSeconds, parseISO } from 'date-fns'

interface UserInfo {
  usr_id: number
  employee_id: number
  email: string
  name: string
  surname: string
  pic: string | null
  business_units?: Array<{ id: number; name: string }>
  business_units_enabled?: boolean
}

interface JiraAuth {
  accessToken: string | null
  refreshToken: string | null
  tokenExpiration: string | null
  cloudId: string | null
}

interface GitlabAuth {
  accessToken: string | null
  refreshToken: string | null
  tokenExpiration: string | null
}

export const useUserStore = defineStore('user', {
  state: () => ({
    authToken: null as string | null,
    isTokenExpired: false,
    info: {
      usr_id: 0,
      employee_id: 0,
      email: '',
      name: '',
      surname: '',
      pic: null,
    } as UserInfo,
    hasAuthorizedGCal: false,
    googleTokenExpiration: null as string | null,
    jira: {
      accessToken: null,
      refreshToken: null,
      tokenExpiration: null,
      cloudId: null,
    } as JiraAuth,
    gitlab: {
      accessToken: null,
      refreshToken: null,
      tokenExpiration: null,
    } as GitlabAuth,
    profilePicUrl: null as string | null,
  }),

  getters: {
    canMakeRequests: (state) => state.authToken && !state.isTokenExpired,
    isGoogleTokenValid: (state) =>
      state.googleTokenExpiration && isAfter(parseISO(state.googleTokenExpiration), new Date()),
    isGCalSetup: (state) => state.hasAuthorizedGCal,
    businessUnits: (state) => state.info.business_units || [],
    businessUnitsEnabled: (state) => state.info.business_units_enabled === true,
    isJiraConfigured: (state) => !!(state.jira.accessToken || state.jira.refreshToken),
    isJiraTokenValid: (state) =>
      state.jira.accessToken &&
      state.jira.tokenExpiration &&
      isAfter(parseISO(state.jira.tokenExpiration), new Date()),
    isJiraRefreshable: (state) => !!state.jira.refreshToken,
    jiraAccessToken: (state) => state.jira.accessToken,
    jiraRefreshToken: (state) => state.jira.refreshToken,
    jiraCloudId: (state) => state.jira.cloudId,
    isGitlabConfigured: (state) => !!(state.gitlab.accessToken || state.gitlab.refreshToken),
    isGitlabTokenValid: (state) =>
      state.gitlab.accessToken &&
      state.gitlab.tokenExpiration &&
      isAfter(parseISO(state.gitlab.tokenExpiration), new Date()),
    isGitlabRefreshable: (state) => !!state.gitlab.refreshToken,
    gitlabAccessToken: (state) => state.gitlab.accessToken,
    gitlabRefreshToken: (state) => state.gitlab.refreshToken,
  },

  actions: {
    setToken(token: string) {
      this.authToken = token
      this.isTokenExpired = false
    },
    updateInfo(info: UserInfo) {
      this.info = info
    },
    invalidateToken() {
      this.isTokenExpired = true
    },
    authorizedGoogleToken(expiresIn: number) {
      this.hasAuthorizedGCal = true
      this.googleTokenExpiration = addSeconds(new Date(), expiresIn).toISOString()
    },
    setJiraAuth({ accessToken, refreshToken, expiresIn, cloudId }: {
      accessToken: string
      refreshToken?: string | null
      expiresIn: number
      cloudId?: string | null
    }) {
      this.jira = {
        accessToken,
        refreshToken: refreshToken || this.jira.refreshToken,
        tokenExpiration: addSeconds(new Date(), expiresIn).toISOString(),
        cloudId: cloudId || this.jira.cloudId,
      }
    },
    clearJiraAuth() {
      this.jira = { accessToken: null, refreshToken: null, tokenExpiration: null, cloudId: null }
    },
    setGitlabAuth({ accessToken, refreshToken, expiresIn }: {
      accessToken: string
      refreshToken?: string | null
      expiresIn: number
    }) {
      this.gitlab = {
        accessToken,
        refreshToken: refreshToken || this.gitlab.refreshToken,
        tokenExpiration: addSeconds(new Date(), expiresIn).toISOString(),
      }
    },
    clearGitlabAuth() {
      this.gitlab = { accessToken: null, refreshToken: null, tokenExpiration: null }
    },
    setProfilePicUrl(url: string | null) {
      this.profilePicUrl = url
    },
  },
})
