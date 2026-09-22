import { JSONResponse } from '../utils/response'

const GITLAB_API = 'https://gitlab.com/api/v4'
const MAX_EVENT_PAGES = 3
const REQUEST_CONCURRENCY = 6

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
    // Local-day boundaries converted to UTC (tz = minutes behind UTC, like Date.getTimezoneOffset())
    const tzMinutes = parseTzOffset(url.searchParams.get('tz'))
    const dayStartUtc = Date.parse(`${day}T00:00:00Z`) + tzMinutes * 60 * 1000
    const dayEndUtc = dayStartUtc + 24 * 60 * 60 * 1000
    const since = new Date(dayStartUtc).toISOString()
    const until = new Date(dayEndUtc).toISOString()

    // Round 1: push events (wide UTC window, filtered below) + user profile, in parallel
    const [eventsResult, profile] = await Promise.all([
      fetchPushEvents(headers, day),
      fetchUserProfile(headers)
    ])

    if (eventsResult.error) {
      return eventsResult.error
    }

    const dayEvents = eventsResult.events.filter((event) => {
      const pushData = event.push_data
      if (!pushData || pushData.ref_type !== 'branch' || !pushData.ref || !pushData.commit_to) {
        return false
      }
      const createdAt = Date.parse(event.created_at)
      return createdAt >= dayStartUtc && createdAt < dayEndUtc
    })

    if (dayEvents.length === 0) {
      return new JSONResponse({ data: [] })
    }

    // Merge same-branch pushes into one range: newest commit_to, oldest commit_from
    dayEvents.sort((first, second) => Date.parse(second.created_at) - Date.parse(first.created_at))
    const rangesByBranch = new Map()
    for (const event of dayEvents) {
      const key = `${event.project_id}:${event.push_data.ref}`
      const existing = rangesByBranch.get(key)
      if (!existing) {
        rangesByBranch.set(key, {
          projectId: event.project_id,
          ref: event.push_data.ref,
          from: event.push_data.commit_from,
          to: event.push_data.commit_to
        })
      } else if (event.push_data.commit_from) {
        existing.from = event.push_data.commit_from
      }
    }

    const ranges = [...rangesByBranch.values()]
    const projectIds = [...new Set(ranges.map((range) => range.projectId))]

    // Round 2: branch commit ranges + project info, all parallel (concurrency-limited)
    const [branchCommits, projects] = await Promise.all([
      mapWithConcurrency(ranges, REQUEST_CONCURRENCY, (range) => fetchRangeCommits(range, headers, since, until)),
      mapWithConcurrency(projectIds, REQUEST_CONCURRENCY, (projectId) => fetchProject(projectId, headers))
    ])

    const projectsById = new Map()
    projects.forEach((project, index) => {
      if (project) { projectsById.set(projectIds[index], project) }
    })

    const commits = []
    const commitMap = new Map()

    branchCommits.forEach((rangeResult, rangeIndex) => {
      const range = ranges[rangeIndex]
      const project = projectsById.get(range.projectId)
      const projectPath = project?.path || `project-${range.projectId}`
      const projectName = project?.name || projectPath

      for (const commit of rangeResult) {
        if (profile && !isOwnCommit(commit, profile)) { continue }

        if (commitMap.has(commit.id)) {
          const existing = commitMap.get(commit.id)
          if (!existing.branches.includes(range.ref)) {
            existing.branches.push(range.ref)
          }
          continue
        }

        const entry = {
          sha: commit.id,
          shortSha: commit.short_id,
          title: commit.title,
          message: commit.message,
          project: projectPath,
          projectName,
          branches: [range.ref],
          createdAt: commit.created_at,
          webUrl: commit.web_url || (project?.webUrl ? `${project.webUrl}/-/commit/${commit.id}` : null)
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

async function fetchPushEvents (headers, day) {
  // Wide UTC window: events near local midnight fall on adjacent UTC days, filtered precisely by the caller
  const previousDay = getOffsetDay(day, -1)
  const nextDay = getOffsetDay(day, 1)

  const events = []
  let page = 1
  while (page <= MAX_EVENT_PAGES) {
    const eventsUrl = new URL(`${GITLAB_API}/events`)
    eventsUrl.searchParams.set('action', 'pushed')
    eventsUrl.searchParams.set('after', previousDay)
    eventsUrl.searchParams.set('before', nextDay)
    eventsUrl.searchParams.set('per_page', '100')
    eventsUrl.searchParams.set('page', String(page))

    const response = await fetch(eventsUrl.toString(), { headers })
    if (!response.ok) {
      const errorBody = await response.text()
      return {
        error: new JSONResponse({
          code: response.status,
          status: 'GitLab Error',
          message: errorBody
        }, { status: response.status })
      }
    }

    events.push(...await response.json())
    if (!response.headers.get('x-next-page')) { break }
    page++
  }

  return { events }
}

async function fetchUserProfile (headers) {
  try {
    const [userResponse, emailsResponse] = await Promise.all([
      fetch(`${GITLAB_API}/user`, { headers }),
      fetch(`${GITLAB_API}/user/emails`, { headers })
    ])
    if (!userResponse.ok) { return null }

    const user = await userResponse.json()
    const emails = new Set()
    if (user.email) { emails.add(user.email.toLowerCase()) }
    if (emailsResponse.ok) {
      for (const entry of await emailsResponse.json()) {
        if (entry.email) { emails.add(entry.email.toLowerCase()) }
      }
    }

    return {
      emails,
      name: (user.name || '').toLowerCase(),
      username: (user.username || '').toLowerCase()
    }
  } catch {
    return null
  }
}

function isOwnCommit (commit, profile) {
  const authorEmail = (commit.author_email || '').toLowerCase()
  if (authorEmail && profile.emails.has(authorEmail)) { return true }
  const authorName = (commit.author_name || '').toLowerCase()
  return Boolean(authorName) && (authorName === profile.name || authorName === profile.username)
}

async function fetchRangeCommits (range, headers, since, until) {
  // Exact push range via compare: only commits added by that push, no date ambiguity
  if (range.from && range.to && range.from !== range.to) {
    try {
      const compareUrl = new URL(`${GITLAB_API}/projects/${range.projectId}/repository/compare`)
      compareUrl.searchParams.set('from', range.from)
      compareUrl.searchParams.set('to', range.to)
      const response = await fetch(compareUrl.toString(), { headers })
      if (response.ok) {
        const payload = await response.json()
        return payload.commits || []
      }
    } catch {
      // fall through to the ref-based query
    }
  }

  // Fallback: new branch (no commit_from) or unresolvable range — scan the ref for the day
  try {
    const commitsUrl = new URL(`${GITLAB_API}/projects/${range.projectId}/repository/commits`)
    commitsUrl.searchParams.set('ref_name', range.ref)
    commitsUrl.searchParams.set('since', since)
    commitsUrl.searchParams.set('until', until)
    commitsUrl.searchParams.set('per_page', '100')
    const response = await fetch(commitsUrl.toString(), { headers })
    return response.ok ? await response.json() : []
  } catch {
    return []
  }
}

async function fetchProject (projectId, headers) {
  try {
    const response = await fetch(`${GITLAB_API}/projects/${projectId}`, { headers })
    if (!response.ok) { return null }
    const project = await response.json()
    return {
      path: project.path_with_namespace,
      name: project.name,
      webUrl: project.web_url
    }
  } catch {
    return null
  }
}

async function mapWithConcurrency (items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++
      results[currentIndex] = await mapper(items[currentIndex])
    }
  })
  await Promise.all(workers)
  return results
}

function parseTzOffset (raw) {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) { return 0 }
  return Math.max(-840, Math.min(840, parsed))
}

function getOffsetDay (dateString, offset) {
  const date = new Date(dateString)
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}
