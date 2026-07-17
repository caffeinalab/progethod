import { isAfter, addSeconds, parseISO } from 'date-fns'

export const state = () => ({
  authToken: null,
  isTokenExpired: false,
  info: {
    usr_id: 0,
    employee_id: 0,
    email: '',
    name: '',
    surname: '',
    pic: null
  },
  hasAuthorizedGCal: false,
  googleTokenExpiration: null,
  jira: {
    accessToken: null,
    refreshToken: null,
    tokenExpiration: null,
    cloudId: null
  },
  gitlab: {
    accessToken: null,
    refreshToken: null,
    tokenExpiration: null
  },
  profilePicUrl: null
})

export const getters = {
  canMakeRequests (state) {
    return state.authToken && !state.isTokenExpired
  },
  authToken (state) {
    return state.authToken
  },
  isTokenExpired (state) {
    return state.isTokenExpired
  },
  isGoogleTokenValid (state) {
    return state.googleTokenExpiration && isAfter(parseISO(state.googleTokenExpiration), new Date())
  },
  isGCalSetup (state) {
    return state.hasAuthorizedGCal
  },
  info (state) {
    return state.info
  },
  businessUnits (state) {
    return state.info.business_units || []
  },
  businessUnitsEnabled (state) {
    return state.info.business_units_enabled === true
  },
  isJiraConfigured (state) {
    return !!(state.jira.accessToken || state.jira.refreshToken)
  },
  isJiraTokenValid (state) {
    return state.jira.accessToken && state.jira.tokenExpiration && isAfter(parseISO(state.jira.tokenExpiration), new Date())
  },
  isJiraRefreshable (state) {
    return !!state.jira.refreshToken
  },
  jiraAccessToken (state) {
    return state.jira.accessToken
  },
  jiraRefreshToken (state) {
    return state.jira.refreshToken
  },
  jiraCloudId (state) {
    return state.jira.cloudId
  },
  isGitlabConfigured (state) {
    return !!(state.gitlab.accessToken || state.gitlab.refreshToken)
  },
  isGitlabTokenValid (state) {
    return state.gitlab.accessToken && state.gitlab.tokenExpiration && isAfter(parseISO(state.gitlab.tokenExpiration), new Date())
  },
  isGitlabRefreshable (state) {
    return !!state.gitlab.refreshToken
  },
  gitlabAccessToken (state) {
    return state.gitlab.accessToken
  },
  gitlabRefreshToken (state) {
    return state.gitlab.refreshToken
  },
  profilePicUrl (state) {
    return state.profilePicUrl
  }
}

export const mutations = {
  setToken (state, token) {
    state.authToken = token
    state.isTokenExpired = false
  },
  updateInfo (state, info) {
    state.info = info
  },
  invalidateToken (state) {
    state.isTokenExpired = true
  },
  authorizedGoogleToken (state, expiresIn) {
    state.hasAuthorizedGCal = true
    state.googleTokenExpiration = (addSeconds(new Date(), expiresIn)).toISOString()
  },
  setJiraAuth (state, { accessToken, refreshToken, expiresIn, cloudId }) {
    state.jira = {
      accessToken,
      refreshToken: refreshToken || state.jira.refreshToken,
      tokenExpiration: addSeconds(new Date(), expiresIn).toISOString(),
      cloudId: cloudId || state.jira.cloudId
    }
  },
  clearJiraAuth (state) {
    state.jira = { accessToken: null, refreshToken: null, tokenExpiration: null, cloudId: null }
  },
  setGitlabAuth (state, { accessToken, refreshToken, expiresIn }) {
    state.gitlab = {
      accessToken,
      refreshToken: refreshToken || state.gitlab.refreshToken,
      tokenExpiration: addSeconds(new Date(), expiresIn).toISOString()
    }
  },
  clearGitlabAuth (state) {
    state.gitlab = { accessToken: null, refreshToken: null, tokenExpiration: null }
  },
  setProfilePicUrl (state, url) {
    state.profilePicUrl = url
  }
}
