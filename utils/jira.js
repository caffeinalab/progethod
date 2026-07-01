const SCOPES = 'read:jira-work read:jira-user'
const AUTHORIZE_URL = 'https://auth.atlassian.com/authorize'

function generateCodeVerifier () {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge (verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode (buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function connectJira () {
  const store = window.$nuxt.$store
  const redirectUri = `${window.location.origin}/jira-callback.html`
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: process.env.jiraClientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    response_type: 'code',
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: 'jira-auth'
  })

  const popupWidth = 600
  const popupHeight = 700
  const left = Math.round(window.screenX + (window.outerWidth - popupWidth) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - popupHeight) / 2)

  const popup = window.open(
    `${AUTHORIZE_URL}?${params}`,
    'jira-auth',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes`
  )

  const code = await waitForCallback(popup)

  const axios = window.$nuxt.$axios
  const tokenResponse = await axios.$post('jira-token', {
    code,
    codeVerifier,
    redirectUri
  })

  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, cloud_id: cloudId } = tokenResponse.data

  store.commit('user/setJiraAuth', { accessToken, refreshToken, expiresIn, cloudId })
}

async function refreshJiraToken () {
  const store = window.$nuxt.$store
  const axios = window.$nuxt.$axios
  const refreshToken = store.getters['user/jiraRefreshToken']

  const tokenResponse = await axios.$post('jira-token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

  const { access_token: accessToken, refresh_token: newRefreshToken, expires_in: expiresIn } = tokenResponse.data

  store.commit('user/setJiraAuth', { accessToken, refreshToken: newRefreshToken, expiresIn })
}

function waitForCallback (popup) {
  return new Promise((resolve, reject) => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) { return }
      if (event.data?.type !== 'jira-oauth-callback') { return }

      window.removeEventListener('message', handleMessage)
      clearInterval(pollTimer)

      if (event.data.error) {
        reject(new Error(event.data.error))
      } else if (event.data.code) {
        resolve(event.data.code)
      } else {
        reject(new Error('Nessun codice ricevuto'))
      }
    }

    window.addEventListener('message', handleMessage)

    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer)
        window.removeEventListener('message', handleMessage)
        reject(new Error('Popup chiuso'))
      }
    }, 500)
  })
}

export async function getJiraActivity (day) {
  const store = window.$nuxt.$store
  const axios = window.$nuxt.$axios

  if (!store.getters['user/isJiraTokenValid']) {
    if (store.getters['user/isJiraRefreshable']) {
      try {
        await refreshJiraToken()
      } catch {
        store.commit('user/clearJiraAuth')
        await connectJira()
      }
    } else {
      await connectJira()
    }
  }

  const cloudId = store.getters['user/jiraCloudId']
  const accessToken = store.getters['user/jiraAccessToken']
  const dayString = typeof day === 'string' ? day : day.toISOString().split('T')[0]

  const response = await axios.$get('jira-activity', {
    params: { day: dayString, _t: Date.now() },
    headers: {
      'x-jira-cloud-id': cloudId,
      'x-jira-access-token': accessToken
    }
  })

  return response.data || []
}
