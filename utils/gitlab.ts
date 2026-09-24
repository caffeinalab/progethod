import { useUserStore } from '~/stores/user'
import { connectOAuth, ensureOAuth, fetchActivity, type OAuthProviderConfig } from '~/utils/oauthPopup'

const GITLAB_API = 'https://gitlab.com/api/v4'
const MAX_EVENT_PAGES = 3
const REQUEST_CONCURRENCY = 6

function getGitlabConfig(): OAuthProviderConfig {
  const userStore = useUserStore()
  return {
    name: 'GitLab',
    callbackType: 'gitlab-oauth-callback',
    authorizeUrl: 'https://gitlab.com/oauth/authorize',
    scopes: 'read_user read_api',
    clientIdKey: 'gitlabClientId',
    redirectPath: '/gitlab-callback.html',
    tokenEndpoint: 'gitlab-token',
    activityEndpoint: 'gitlab-activity',
    stateParam: 'gitlab-auth',
    setAuth: (data) => {
      userStore.setGitlabAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      })
    },
    clearAuth: () => userStore.clearGitlabAuth(),
    getAccessToken: () => userStore.gitlabAccessToken,
    getRefreshToken: () => userStore.gitlabRefreshToken,
    isTokenValid: () => userStore.isGitlabTokenValid,
    isRefreshable: () => userStore.isGitlabRefreshable,
    getActivityHeaders: (accessToken) => ({
      'x-gitlab-access-token': accessToken,
    }),
  }
}

export async function connectGitlab(): Promise<void> {
  await connectOAuth(getGitlabConfig())
}

// In-flight request sharing, so a hover prefetch and the modal opening share a single
// request. Settled results are never kept — this is not a cache.
const inFlightRequests = new Map<string, Promise<any[]>>()

function fetchActivityShared(day: string): Promise<any[]> {
  const existing = inFlightRequests.get(day)
  if (existing) { return existing }
  const request = fetchActivityWithFallback(day)
    .finally(() => { inFlightRequests.delete(day) })
  inFlightRequests.set(day, request)
  return request
}

export function prefetchGitlabActivity(day: string): void {
  const config = getGitlabConfig()
  // Never trigger a token refresh or the OAuth popup from a hover
  if (!config.getAccessToken() || !config.isTokenValid()) { return }
  void fetchActivityShared(day).catch(() => {})
}

export async function getGitlabActivity(day: Date | string): Promise<any[]> {
  const config = getGitlabConfig()
  await ensureOAuth(config)
  const dayString = typeof day === 'string' ? day : day.toISOString().split('T')[0]
  try {
    return await fetchActivityShared(dayString)
  } catch (error: any) {
    if (isAuthError(error)) {
      config.clearAuth()
      await connectOAuth(config)
      return await fetchActivityShared(dayString)
    }
    throw error
  }
}

function isAuthError(error: any): boolean {
  return error?.status === 401 || error?.response?.status === 401
}

// GitLab tarpits authenticated API calls from Cloudflare's shared egress IPs (Sept 2026:
// ~20s for round 1 alone from Pages Functions vs ~0.5s from a browser). The activity flow
// therefore calls gitlab.com directly — the token lives in this browser anyway, and the
// scopes are read-only. The server-side proxy remains as a fallback for when direct calls
// can't be made at all (CORS/network failure, e.g. a privacy extension blocking them).
async function fetchActivityWithFallback(day: string): Promise<any[]> {
  try {
    return await fetchActivityDirect(day)
  } catch (error: any) {
    if (isAuthError(error)) { throw error }
    if (error instanceof TypeError) {
      return await fetchActivity(getGitlabConfig(), day)
    }
    throw error
  }
}

interface GitlabProfile {
  emails: Set<string>
  name: string
  username: string
}

interface PushedBranch {
  projectId: number
  ref: string
}

interface GitlabProjectInfo {
  path: string
  name: string
  webUrl: string
}

async function fetchActivityDirect(day: string): Promise<any[]> {
  const accessToken = getGitlabConfig().getAccessToken()
  const headers = { Authorization: `Bearer ${accessToken}` }

  // Local-day boundaries converted to UTC (getTimezoneOffset = minutes behind UTC)
  const tzMinutes = new Date(`${day}T12:00:00`).getTimezoneOffset()
  const dayStartUtc = Date.parse(`${day}T00:00:00Z`) + tzMinutes * 60 * 1000
  const dayEndUtc = dayStartUtc + 24 * 60 * 60 * 1000
  const since = new Date(dayStartUtc).toISOString()
  const until = new Date(dayEndUtc).toISOString()

  // Round 1: push events (wide UTC window, filtered below) + user profile, in parallel
  const [events, profile] = await Promise.all([
    fetchPushEvents(headers, day),
    fetchUserProfile(headers),
  ])

  const dayEvents = events.filter((event) => {
    const pushData = event.push_data
    // commit_to is null on branch deletions — skip those
    if (!pushData || pushData.ref_type !== 'branch' || !pushData.ref || !pushData.commit_to) { return false }
    const createdAt = Date.parse(event.created_at)
    return createdAt >= dayStartUtc && createdAt < dayEndUtc
  })

  if (dayEvents.length === 0) { return [] }

  // Unique branches pushed that day — one cheap commit-list call each
  const branchesByKey = new Map<string, PushedBranch>()
  for (const event of dayEvents) {
    const key = `${event.project_id}:${event.push_data.ref}`
    if (!branchesByKey.has(key)) {
      branchesByKey.set(key, { projectId: event.project_id, ref: event.push_data.ref })
    }
  }
  const branches = [...branchesByKey.values()]
  const projectIds = [...new Set(branches.map((branch) => branch.projectId))]

  // Round 2: branch commits + project info, all parallel (concurrency-limited)
  const [branchCommits, projects] = await Promise.all([
    mapWithConcurrency(branches, REQUEST_CONCURRENCY, (branch) => fetchBranchCommits(branch, headers, since, until)),
    mapWithConcurrency(projectIds, REQUEST_CONCURRENCY, (projectId) => fetchProject(projectId, headers)),
  ])

  const projectsById = new Map<number, GitlabProjectInfo>()
  projects.forEach((project, index) => {
    if (project) { projectsById.set(projectIds[index], project) }
  })

  const commits: any[] = []
  const commitMap = new Map<string, any>()

  branchCommits.forEach((commitList, branchIndex) => {
    const branch = branches[branchIndex]
    const project = projectsById.get(branch.projectId)
    const projectPath = project?.path || `project-${branch.projectId}`
    const projectName = project?.name || projectPath

    for (const commit of commitList) {
      if (profile && !isOwnCommit(commit, profile)) { continue }

      if (commitMap.has(commit.id)) {
        const existing = commitMap.get(commit.id)
        if (!existing.branches.includes(branch.ref)) {
          existing.branches.push(branch.ref)
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
        branches: [branch.ref],
        createdAt: commit.created_at,
        webUrl: commit.web_url || (project?.webUrl ? `${project.webUrl}/-/commit/${commit.id}` : null),
      }
      commitMap.set(commit.id, entry)
      commits.push(entry)
    }
  })

  commits.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
  return commits
}

async function gitlabGet(url: string, headers: Record<string, string>): Promise<Response> {
  const response = await fetch(url, { headers, cache: 'no-store' })
  if (!response.ok) {
    throw Object.assign(new Error(`GitLab API error ${response.status}`), { status: response.status })
  }
  return response
}

async function fetchPushEvents(headers: Record<string, string>, day: string): Promise<any[]> {
  // Wide UTC window: /events only accepts UTC dates, so events near local midnight fall on
  // adjacent UTC days. The caller filters precisely by timestamp.
  const previousDay = getOffsetDay(day, -1)
  const nextDay = getOffsetDay(day, 1)

  const firstPage = await fetchEventsPage(headers, previousDay, nextDay, 1)
  const events = [...firstPage.events]
  if (firstPage.hasNextPage) {
    // Remaining pages are independent — fetch them in parallel instead of chaining on
    // x-next-page. Requesting a page beyond the last one just returns an empty array.
    const extraPages = await Promise.all(
      Array.from({ length: MAX_EVENT_PAGES - 1 }, (_, index) => fetchEventsPage(headers, previousDay, nextDay, index + 2)),
    )
    for (const result of extraPages) {
      events.push(...result.events)
    }
  }
  return events
}

async function fetchEventsPage(headers: Record<string, string>, after: string, before: string, page: number): Promise<{ events: any[], hasNextPage: boolean }> {
  const eventsUrl = new URL(`${GITLAB_API}/events`)
  eventsUrl.searchParams.set('action', 'pushed')
  eventsUrl.searchParams.set('after', after)
  eventsUrl.searchParams.set('before', before)
  eventsUrl.searchParams.set('per_page', '100')
  eventsUrl.searchParams.set('page', String(page))

  const response = await gitlabGet(eventsUrl.toString(), headers)
  return { events: await response.json(), hasNextPage: Boolean(response.headers.get('x-next-page')) }
}

async function fetchUserProfile(headers: Record<string, string>): Promise<GitlabProfile | null> {
  const [userResponse, emailsResponse] = await Promise.all([
    fetch(`${GITLAB_API}/user`, { headers, cache: 'no-store' }),
    fetch(`${GITLAB_API}/user/emails`, { headers, cache: 'no-store' }),
  ])
  if (userResponse.status === 401) {
    throw Object.assign(new Error('GitLab API error 401'), { status: 401 })
  }
  if (!userResponse.ok) { return null }

  const user = await userResponse.json()
  const emails = new Set<string>()
  if (user.email) { emails.add(user.email.toLowerCase()) }
  if (emailsResponse.ok) {
    for (const entry of await emailsResponse.json()) {
      if (entry.email) { emails.add(entry.email.toLowerCase()) }
    }
  }

  return {
    emails,
    name: (user.name || '').toLowerCase(),
    username: (user.username || '').toLowerCase(),
  }
}

function isOwnCommit(commit: any, profile: GitlabProfile): boolean {
  const authorEmail = (commit.author_email || '').toLowerCase()
  if (authorEmail && profile.emails.has(authorEmail)) { return true }
  const authorName = (commit.author_name || '').toLowerCase()
  return Boolean(authorName) && (authorName === profile.name || authorName === profile.username)
}

async function fetchBranchCommits(branch: PushedBranch, headers: Record<string, string>, since: string, until: string): Promise<any[]> {
  // Commits created that day on a pushed branch — cheap list call.
  // Deliberately NOT the compare API: compare computes the full file diff for the push
  // range (which we never display) and made the modal take 30-40s to load.
  // Trade-off: commits authored before that day that entered the branch via the push
  // (e.g. merging an old branch) are not listed.
  try {
    const commitsUrl = new URL(`${GITLAB_API}/projects/${branch.projectId}/repository/commits`)
    commitsUrl.searchParams.set('ref_name', branch.ref)
    commitsUrl.searchParams.set('since', since)
    commitsUrl.searchParams.set('until', until)
    commitsUrl.searchParams.set('per_page', '100')
    const response = await fetch(commitsUrl.toString(), { headers, cache: 'no-store' })
    return response.ok ? await response.json() : []
  } catch {
    return []
  }
}

async function fetchProject(projectId: number, headers: Record<string, string>): Promise<GitlabProjectInfo | null> {
  try {
    const response = await fetch(`${GITLAB_API}/projects/${projectId}`, { headers, cache: 'no-store' })
    if (!response.ok) { return null }
    const project = await response.json()
    return {
      path: project.path_with_namespace,
      name: project.name,
      webUrl: project.web_url,
    }
  } catch {
    return null
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
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

function getOffsetDay(dateString: string, offset: number): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}
