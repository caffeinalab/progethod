import { JSONResponse } from '../utils/response'

export async function onRequestPost ({ request, env }) {
  const { code, codeVerifier, redirectUri } = await request.json()

  if (!code || !codeVerifier || !redirectUri) {
    return new JSONResponse({
      code: 400,
      status: 'Bad Request',
      message: 'Missing code, codeVerifier, or redirectUri'
    }, { status: 400 })
  }

  const tokenResponse = await fetch('https://gitlab.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: env.GITLAB_CLIENT_ID,
      client_secret: env.GITLAB_CLIENT_SECRET,
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

  return new JSONResponse({
    data: {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    }
  })
}
