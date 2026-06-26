import { JSONResponse } from '../utils/response'

export async function onRequestGet ({ request }) {
  const accessToken = request.headers.get('x-gitlab-access-token')

  if (!accessToken) {
    return new JSONResponse({
      code: 400,
      status: 'Bad Request',
      message: 'Missing GitLab auth header'
    }, { status: 400 })
  }

  const url = new URL(request.url)
  const day = url.searchParams.get('day')

  if (!day) {
    return new JSONResponse({
      code: 400,
      status: 'Bad Request',
      message: 'Missing day parameter'
    }, { status: 400 })
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json'
  }

  try {
    const previousDay = getOffsetDay(day, -1)
    const nextDay = getOffsetDay(day, 1)

    const eventsUrl = new URL('https://gitlab.com/api/v4/events')
    eventsUrl.searchParams.set('action', 'pushed')
    eventsUrl.searchParams.set('after', previousDay)
    eventsUrl.searchParams.set('before', nextDay)
    eventsUrl.searchParams.set('per_page', '100')

    const eventsResponse = await fetch(eventsUrl.toString(), { headers })

    if (!eventsResponse.ok) {
      const errorBody = await eventsResponse.text()
      return new JSONResponse({
        code: eventsResponse.status,
        status: 'GitLab Error',
        message: errorBody
      }, { status: eventsResponse.status })
    }

    const events = await eventsResponse.json()

    const refsByProject = new Map()
    for (const event of events) {
      const ref = event.push_data?.ref
      if (!ref) { continue }
      if (!refsByProject.has(event.project_id)) {
        refsByProject.set(event.project_id, new Set())
      }
      refsByProject.get(event.project_id).add(ref)
    }

    if (refsByProject.size === 0) {
      return new JSONResponse({ data: [] })
    }

    const daySince = `${day}T00:00:00Z`
    const dayUntil = `${nextDay}T00:00:00Z`

    const commitsQueries = []
    for (const [projectId, refs] of refsByProject) {
      for (const ref of refs) {
        const commitsUrl = new URL(`https://gitlab.com/api/v4/projects/${projectId}/repository/commits`)
        commitsUrl.searchParams.set('ref_name', ref)
        commitsUrl.searchParams.set('since', daySince)
        commitsUrl.searchParams.set('until', dayUntil)
        commitsUrl.searchParams.set('per_page', '100')
        commitsQueries.push({
          ref,
          promise: fetch(commitsUrl.toString(), { headers })
            .then(response => response.ok ? response.json() : [])
            .catch(() => [])
        })
      }
    }

    const commitsResults = await Promise.all(
      commitsQueries.map(query => query.promise)
    )

    const commits = []
    const commitMap = new Map()

    commitsQueries.forEach((query, index) => {
      const projectCommits = commitsResults[index] || []

      for (const commit of projectCommits) {
        if (commitMap.has(commit.id)) {
          const existing = commitMap.get(commit.id)
          if (!existing.branches.includes(query.ref)) {
            existing.branches.push(query.ref)
          }
          continue
        }

        const { projectPath, projectName } = parseProjectFromWebUrl(commit.web_url)

        const entry = {
          sha: commit.id,
          shortSha: commit.short_id,
          title: commit.title,
          message: commit.message,
          project: projectPath,
          projectName,
          branches: [query.ref],
          createdAt: commit.created_at,
          webUrl: commit.web_url
        }
        commitMap.set(commit.id, entry)
        commits.push(entry)
      }
    })

    commits.sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))

    return new JSONResponse({ data: commits })
  } catch (error) {
    return new JSONResponse({
      code: 502,
      status: 'Error',
      message: error.message
    }, { status: 502 })
  }
}

function getOffsetDay (dateString, offset) {
  const date = new Date(dateString)
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

function parseProjectFromWebUrl (webUrl) {
  try {
    const path = new URL(webUrl).pathname.split('/-/')[0].substring(1)
    return { projectPath: path, projectName: path.split('/').pop() }
  } catch {
    return { projectPath: 'unknown', projectName: 'Unknown' }
  }
}
