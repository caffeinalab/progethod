import { JSONResponse } from '../utils/response'
import { fetchTimetrackingBoardPages } from '../utils/fetchTimetrackingBoard'

export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)

  const { entries, status, body } = await fetchTimetrackingBoardPages(searchParams, authToken, env)

  if (status !== 200 && entries.length === 0) {
    return new JSONResponse(body, { status })
  }

  return new JSONResponse({ code: 200, status: 'Ok', data: entries }, { status })
}
