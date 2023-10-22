import { getRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

export async function onRequestGet ({ env, data: { authToken } }) {
  const { body, status } = await getRequest('authentication/userinfo', null, authToken, env)

  if (status !== 200) {
    return new JSONResponse(body, { status })
  }

  const email = body.data.email

  const { value: projects, metadata } = await env.PROGETHOD_PROJECTS.getWithMetadata(email, 'json')

  return new JSONResponse({ status: 'ok', projects: projects || [], updatedAt: metadata?.updatedAt }, { status: 200 })
}

export async function onRequestPut ({ request, env, data: { authToken } }) {
  const { body, status } = await getRequest('authentication/userinfo', null, authToken, env)

  if (status !== 200) {
    return new JSONResponse(body, { status })
  }

  const email = body.data.email

  const putBody = await request.json()

  await env.PROGETHOD_PROJECTS.put(email, JSON.stringify(putBody.projects), { metadata: { updatedAt: putBody.updatedAt } })

  return new JSONResponse({ status: 'ok' }, { status: 200 })
}
