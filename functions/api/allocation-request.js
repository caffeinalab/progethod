import { getRequest, postRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)

  const { body, status } = await getRequest('allocation-request/', searchParams, authToken, env)

  return new JSONResponse(body, { status })
}

export async function onRequestPost ({ request, env, data: { authToken } }) {
  const requestBody = await request.json()

  const { body, status } = await postRequest('allocation-request/', requestBody, authToken, env)

  return new JSONResponse(body, { status })
}
