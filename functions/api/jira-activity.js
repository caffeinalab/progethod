import { JSONResponse } from '../utils/response'

export async function onRequestGet ({ request }) {
  const cloudId = request.headers.get('x-jira-cloud-id')
  const accessToken = request.headers.get('x-jira-access-token')

  if (!cloudId || !accessToken) {
    return new JSONResponse({
      code: 400,
      status: 'Bad Request',
      message: 'Missing Jira auth headers'
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

  const nextDay = getNextDay(day)
  const jql = [
    `status changed BY currentUser() DURING ("${day}", "${nextDay}")`,
    `creator = currentUser() AND created >= "${day}" AND created < "${nextDay}"`,
    `assignee changed BY currentUser() DURING ("${day}", "${nextDay}")`,
    `resolution changed BY currentUser() DURING ("${day}", "${nextDay}")`,
    `worklogAuthor = currentUser() AND worklogDate = "${day}"`,
    `updated >= "${day}" AND updated < "${nextDay}" AND (assignee = currentUser() OR reporter = currentUser())`
  ].join(' OR ')

  const searchUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql`

  try {
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql,
        fields: ['summary', 'status', 'issuetype', 'project'],
        maxResults: 30
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return new JSONResponse({
        code: response.status,
        status: 'Jira Error',
        message: errorBody
      }, { status: response.status })
    }

    const data = await response.json()

    const issues = (data.issues || []).map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name,
      type: issue.fields.issuetype?.name,
      project: issue.fields.project?.name
    }))

    return new JSONResponse({ data: issues })
  } catch (error) {
    return new JSONResponse({
      code: 502,
      status: 'Error',
      message: error.message
    }, { status: 502 })
  }
}

function getNextDay (dateString) {
  const date = new Date(dateString)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}
