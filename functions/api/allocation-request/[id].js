import { patchRequest, deleteRequest } from '../../utils/client'
import { JSONResponse } from '../../utils/response'

export async function onRequestPatch ({ params, request, env, data: { authToken } }) {
  const requestBody = await request.json()

  const { body, status } = await patchRequest(`allocation-request/${params.id}`, requestBody, authToken, env)

  return new JSONResponse(body, { status })
}

export async function onRequestDelete ({ params, env, data: { authToken } }) {
  const { body, status } = await deleteRequest(`allocation-request/${params.id}`, authToken, env)

  return new JSONResponse(body, { status })
}
