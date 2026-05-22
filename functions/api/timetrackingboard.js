import { getRequest } from '../utils/client'
import { JSONResponse } from '../utils/response'

// Wethod /timetrackingboard ha introdotto una paginazione hard a 20 entries
// dopo che progethod è stato scritto. Senza `?limit=N` la dropdown progetti
// vede solo i primi 20 entry restituiti da Wethod. Passando un limit alto si
// può richiedere fino a ~2000 entries per chiamata (oltre Wethod risponde 500).
// Configurabile via env per tenant con più progetti.
const DEFAULT_BOARD_FETCH_LIMIT = 2000

export async function onRequestGet ({ request, env, data: { authToken } }) {
  const { searchParams } = new URL(request.url)

  if (!searchParams.has('limit')) {
    const envLimit = parseInt(env.BOARD_FETCH_LIMIT, 10)
    const limit = Number.isFinite(envLimit) && envLimit > 0
      ? envLimit
      : DEFAULT_BOARD_FETCH_LIMIT
    searchParams.set('limit', String(limit))
  }

  const { body, status } = await getRequest('timetrackingboard', searchParams, authToken, env)

  return new JSONResponse(body, { status })
}
