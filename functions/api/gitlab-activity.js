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

    const projectIds = [...new Set(events.map(event => event.project_id))]

    if (projectIds.length === 0) {
      return new JSONResponse({ data: [] })
    }

    const projectInfoPromises = projectIds.map(projectId =>
      fetch(`https://gitlab.com/api/v4/projects/${projectId}?simple=true`, { headers })
        .then(response => response.ok ? response.json() : null)
        .catch(() => null)
    )

    const daySince = `${day}T00:00:00Z`
    const dayUntil = `${nextDay}T00:00:00Z`

    const commitsPromises = projectIds.map(projectId => {
      const commitsUrl = new URL(`https://gitlab.com/api/v4/projects/${projectId}/repository/commits`)
      commitsUrl.searchParams.set('since', daySince)
      commitsUrl.searchParams.set('until', dayUntil)
      commitsUrl.searchParams.set('per_page', '100')
      return fetch(commitsUrl.toString(), { headers })
        .then(response => response.ok ? response.json() : [])
        .catch(() => [])
    })

    const [projectInfoResults, commitsResults] = await Promise.all([
      Promise.all(projectInfoPromises),
      Promise.all(commitsPromises)
    ])

    const projectMap = {}
    projectIds.forEach((projectId, index) => {
      const info = projectInfoResults[index]
      projectMap[projectId] = info
        ? { name: info.name, path: info.path_with_namespace }
        : { name: `Project #${projectId}`, path: `unknown/${projectId}` }
    })

    const commits = []
    const seen = new Set()

    projectIds.forEach((projectId, index) => {
      const projectCommits = commitsResults[index] || []
      const projectInfo = projectMap[projectId]

      for (const commit of projectCommits) {
        if (seen.has(commit.id)) {
          continue
        }
        seen.add(commit.id)

        commits.push({
          sha: commit.id,
          shortSha: commit.short_id,
          title: commit.title,
          message: commit.message,
          project: projectInfo.path,
          projectName: projectInfo.name,
          createdAt: commit.created_at,
          webUrl: commit.web_url
        })
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
