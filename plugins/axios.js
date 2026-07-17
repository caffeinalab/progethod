const EXTERNAL_AUTH_PATHS = ['jira-token', 'jira-activity', 'gitlab-token', 'gitlab-activity']

function isExternalAuthRequest (config) {
  const url = config?.url || ''
  return EXTERNAL_AUTH_PATHS.some(path => url.includes(path))
}

export default function ({ $axios, store }) {
  $axios.onRequest((config) => {
    if (!config.headers['x-sf-sess-id']) {
      config.headers['x-sf-sess-id'] = store.getters['user/authToken']
    }
  })

  $axios.onError((error) => {
    const code = parseInt(error.response && error.response.status)
    if (code === 401 && !isExternalAuthRequest(error.config)) {
      store.commit('user/invalidateToken')
    }
  })
}
