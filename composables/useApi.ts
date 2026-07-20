export function useApi() {
  const userStore = useUserStore()

  const headers = computed(() => {
    const result: Record<string, string> = {}
    if (userStore.authToken) {
      result['x-sf-sess-id'] = userStore.authToken
    }
    return result
  })

  async function $get<T = unknown>(url: string, options?: { params?: Record<string, unknown>; headers?: Record<string, string> }): Promise<T> {
    const query = options?.params as Record<string, string> | undefined
    const mergedHeaders = { ...headers.value, ...options?.headers }
    const response = await $fetch<T>(`/api/${url}`, {
      method: 'GET',
      query,
      headers: mergedHeaders,
      onResponseError({ response: errorResponse }) {
        if (errorResponse.status === 401 && !isExternalAuthRequest(url)) {
          userStore.invalidateToken()
        }
      },
    })
    return response
  }

  async function $post<T = unknown>(url: string, body?: unknown): Promise<T> {
    return await $fetch<T>(`/api/${url}`, {
      method: 'POST',
      body,
      headers: headers.value,
      onResponseError({ response: errorResponse }) {
        if (errorResponse.status === 401 && !isExternalAuthRequest(url)) {
          userStore.invalidateToken()
        }
      },
    })
  }

  async function $put<T = unknown>(url: string, body?: unknown): Promise<T> {
    return await $fetch<T>(`/api/${url}`, {
      method: 'PUT',
      body,
      headers: headers.value,
      onResponseError({ response: errorResponse }) {
        if (errorResponse.status === 401 && !isExternalAuthRequest(url)) {
          userStore.invalidateToken()
        }
      },
    })
  }

  async function $patch<T = unknown>(url: string, body?: unknown): Promise<T> {
    return await $fetch<T>(`/api/${url}`, {
      method: 'PATCH',
      body,
      headers: headers.value,
      onResponseError({ response: errorResponse }) {
        if (errorResponse.status === 401 && !isExternalAuthRequest(url)) {
          userStore.invalidateToken()
        }
      },
    })
  }

  async function $delete<T = unknown>(url: string): Promise<T> {
    return await $fetch<T>(`/api/${url}`, {
      method: 'DELETE',
      headers: headers.value,
      onResponseError({ response: errorResponse }) {
        if (errorResponse.status === 401 && !isExternalAuthRequest(url)) {
          userStore.invalidateToken()
        }
      },
    })
  }

  return { $get, $post, $put, $patch, $delete }
}

const EXTERNAL_AUTH_PATHS = ['jira-token', 'jira-activity', 'gitlab-token', 'gitlab-activity']

function isExternalAuthRequest(url: string): boolean {
  return EXTERNAL_AUTH_PATHS.some(path => url.includes(path))
}
