export function getCorsHeaders (env) {
  const baseCors = {
    'Access-Control-Allow-Headers': 'Content-Type, x-sf-sess-id, x-jira-cloud-id, x-jira-access-token, x-gitlab-access-token'
  }

  if (env.NODE_ENV !== 'development') {
    return baseCors
  }

  return {
    ...baseCors,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,OPTIONS',
    'Access-Control-Max-Age': '86400'
  }
}
