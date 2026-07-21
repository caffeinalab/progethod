import { ref, computed } from 'vue'
import pLimit from 'p-limit'

interface BatchPostEntry {
  internalIds?: string[]
  debugProjectName?: string
  [key: string]: unknown
}

interface BatchPostErrorDetails {
  code: number | undefined
  message: string | undefined
  debugProjectName: string | undefined
}

interface BatchPostOptions {
  onSuccess?: (entry: BatchPostEntry, internalIds: string[]) => void
  formatError?: (details: BatchPostErrorDetails) => string
}

export function useTimesheetBatchPost() {
  const api = useApi()
  const userStore = useUserStore()
  const eventBus = useEventBus()

  const concurrencyLimit = pLimit(5)

  const isSubmitting = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')
  const sentCount = ref(0)
  const totalCount = ref(0)

  const isExpired = computed(() => userStore.isTokenExpired)

  const progressPercentage = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.floor((sentCount.value * 100) / totalCount.value)
  })

  async function execute(entries: BatchPostEntry[], options?: BatchPostOptions): Promise<boolean> {
    isSubmitting.value = true
    hasError.value = false
    errorMessage.value = ''
    sentCount.value = 0
    totalCount.value = entries.length

    try {
      await Promise.all(
        entries.map(
          (entry) => concurrencyLimit(async () => {
            const { internalIds, debugProjectName, ...requestData } = entry
            let response: Record<string, unknown> = {}

            try {
              response = await api.$post('timetracking', requestData) as Record<string, unknown>
            } catch (error: unknown) {
              const fetchError = error as { response?: { status?: number }; message?: string }
              response = {
                code: fetchError.response?.status || 500,
                message: fetchError.message,
              }
            }

            if (response.code !== 200) {
              isSubmitting.value = false
              hasError.value = true

              const errorDetails: BatchPostErrorDetails = {
                code: response.code as number | undefined,
                message: response.message as string | undefined,
                debugProjectName: debugProjectName as string | undefined,
              }

              errorMessage.value = options?.formatError
                ? options.formatError(errorDetails)
                : `Error ${errorDetails.code || ''}: ${errorDetails.message || ''} (${errorDetails.debugProjectName || 'unknown'})`

              throw new Error(errorMessage.value)
            }

            sentCount.value++

            if (options?.onSuccess) {
              options.onSuccess(entry, (internalIds as string[]) || [])
            }
          }),
        ),
      )

      eventBus.emit('tracked-hours:refresh')
      return true
    } catch {
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    isExpired,
    progressPercentage,
    hasError,
    errorMessage,
    execute,
  }
}
