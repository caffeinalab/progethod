export function useApi() {
  const userStore = useUserStore()

  const headers = computed(() => {
    const result: Record<string, string> = {}
    if (userStore.authToken) {
      result['x-sf-sess-id'] = userStore.authToken
    }
    return result
  })

  async function request<T = unknown>(
    method: string,
    url: string,
    options?: { query?: Record<string, string>; headers?: Record<string, string>; body?: unknown },
  ): Promise<T> {
    return await $fetch<T>(`/api/${url}`, {
      method,
      query: options?.query,
      body: options?.body,
      headers: { ...headers.value, ...options?.headers },
      onResponseError({ response: errorResponse }) {
        if (errorResponse.status === 401 && !isExternalAuthRequest(url)) {
          userStore.invalidateToken()
        }
      },
    })
  }

  function $get<T = unknown>(url: string, options?: { params?: Record<string, unknown>; headers?: Record<string, string> }): Promise<T> {
    return request<T>('GET', url, {
      query: options?.params as Record<string, string> | undefined,
      headers: options?.headers,
    })
  }

  function $post<T = unknown>(url: string, body?: unknown): Promise<T> {
    return request<T>('POST', url, { body })
  }

  function $put<T = unknown>(url: string, body?: unknown): Promise<T> {
    return request<T>('PUT', url, { body })
  }

  function $patch<T = unknown>(url: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', url, { body })
  }

  function $delete<T = unknown>(url: string): Promise<T> {
    return request<T>('DELETE', url)
  }

  return { $get, $post, $put, $patch, $delete }
}

const EXTERNAL_AUTH_PATHS = ['jira-token', 'jira-activity', 'gitlab-token', 'gitlab-activity']

function isExternalAuthRequest(url: string): boolean {
  return EXTERNAL_AUTH_PATHS.some(path => url.includes(path))
}
