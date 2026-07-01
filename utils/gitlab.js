const SCOPES = 'read_user read_api'
const AUTHORIZE_URL = 'https://gitlab.com/oauth/authorize'

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

export async function connectGitlab () {
  const store = window.$nuxt.$store
  const redirectUri = `${window.location.origin}/gitlab-callback.html`
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    client_id: process.env.gitlabClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: 'gitlab-auth'
  })

  const popupWidth = 600
  const popupHeight = 700
  const left = Math.round(window.screenX + (window.outerWidth - popupWidth) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - popupHeight) / 2)

  const popup = window.open(
    `${AUTHORIZE_URL}?${params}`,
    'gitlab-auth',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes`
  )

  const code = await waitForCallback(popup)

  const axios = window.$nuxt.$axios
  const tokenResponse = await axios.$post('gitlab-token', {
    code,
    codeVerifier,
    redirectUri
  })

  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenResponse.data

  store.commit('user/setGitlabAuth', { accessToken, refreshToken, expiresIn })
}

async function refreshGitlabToken () {
  const store = window.$nuxt.$store
  const axios = window.$nuxt.$axios
  const refreshToken = store.getters['user/gitlabRefreshToken']

  const tokenResponse = await axios.$post('gitlab-token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

  const { access_token: accessToken, refresh_token: newRefreshToken, expires_in: expiresIn } = tokenResponse.data

  store.commit('user/setGitlabAuth', { accessToken, refreshToken: newRefreshToken, expiresIn })
}

function waitForCallback (popup) {
  return new Promise((resolve, reject) => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) { return }
      if (event.data?.type !== 'gitlab-oauth-callback') { return }

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

export async function getGitlabActivity (day) {
  const store = window.$nuxt.$store
  const axios = window.$nuxt.$axios

  if (!store.getters['user/isGitlabTokenValid']) {
    if (store.getters['user/isGitlabRefreshable']) {
      try {
        await refreshGitlabToken()
      } catch {
        store.commit('user/clearGitlabAuth')
        await connectGitlab()
      }
    } else {
      await connectGitlab()
    }
  }

  const accessToken = store.getters['user/gitlabAccessToken']
  const dayString = typeof day === 'string' ? day : day.toISOString().split('T')[0]

  const response = await axios.$get('gitlab-activity', {
    params: { day: dayString, _t: Date.now() },
    headers: {
      'x-gitlab-access-token': accessToken
    }
  })

  return response.data || []
}
