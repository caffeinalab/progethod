import { JSONResponse } from '../utils/response'

export async function onRequestPost ({ request, env }) {
  const body = await request.json()
  const { grant_type: grantType } = body

  if (grantType === 'refresh_token') {
    return handleRefresh(body, env)
  }

  return handleAuthorizationCode(body, env)
}

async function handleAuthorizationCode ({ code, codeVerifier, redirectUri }, env) {
  if (!code || !codeVerifier || !redirectUri) {
    return new JSONResponse({
      code: 400,
      status: 'Bad Request',
      message: 'Missing code, codeVerifier, or redirectUri'
    }, { status: 400 })
  }

  const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: env.JIRA_CLIENT_ID,
      client_secret: env.JIRA_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  })

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text()
    return new JSONResponse({
      code: tokenResponse.status,
      status: 'Token Exchange Error',
      message: errorBody
    }, { status: tokenResponse.status })
  }

  const tokenData = await tokenResponse.json()

  const resourcesResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' }
  })

  let cloudId = null
  if (resourcesResponse.ok) {
    const resources = await resourcesResponse.json()
    if (resources.length > 0) {
      cloudId = resources[0].id
    }
  }

  return new JSONResponse({
    data: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      cloud_id: cloudId
    }
  })
}

async function handleRefresh ({ refresh_token: refreshToken }, env) {
  if (!refreshToken) {
    return new JSONResponse({
      code: 400,
      status: 'Bad Request',
      message: 'Missing refresh_token'
    }, { status: 400 })
  }

  const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: env.JIRA_CLIENT_ID,
      client_secret: env.JIRA_CLIENT_SECRET,
      refresh_token: refreshToken
    })
  })

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text()
    return new JSONResponse({
      code: tokenResponse.status,
      status: 'Token Refresh Error',
      message: errorBody
    }, { status: tokenResponse.status })
  }

  const tokenData = await tokenResponse.json()

  return new JSONResponse({
    data: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in
    }
  })
}
