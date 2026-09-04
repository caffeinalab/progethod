<template>
  <PanelModal
    :model-value="modelValue"
    :title="$t('diagnostic.title')"
    max-width-class="max-w-xl"
    @update:model-value="close"
  >
    <div class="px-6 pb-6">
      <p class="text-xs text-ink-muted mb-4 leading-snug">
        {{ $t('diagnostic.description') }}
      </p>

      <ul class="space-y-0.5">
        <li v-for="result in results" :key="result.check.id">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex flex-1 min-w-0 items-center gap-2.5 px-2 py-1.5 rounded text-left transition-colors focus:outline-none"
              :class="result.status === 'fail'
                ? 'cursor-pointer hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-focus-ring'
                : 'cursor-default'"
              @click="toggleDetails(result)"
            >
              <span class="inline-flex items-center justify-center min-w-6 min-h-6 shrink-0">
                <span
                  v-if="result.status === 'running'"
                  class="inline-block w-3 h-3 border-2 border-stroke-muted border-t-accent rounded-full animate-spin"
                />
                <IconCheck v-else-if="result.status === 'ok'" :size="16" class="text-success" />
                <IconX v-else-if="result.status === 'fail'" :size="16" class="text-danger" />
                <IconMinus v-else :size="16" class="text-ink-disabled" />
              </span>
              <span class="text-sm text-ink flex-1 truncate">{{ $t(`diagnostic.checks.${result.check.id}`) }}</span>
              <span v-if="result.durationMs !== null" class="text-xs text-ink-faint tabular-nums shrink-0">{{ result.durationMs }}ms</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center min-w-6 min-h-6 p-1 rounded text-ink-faint hover:text-accent-fg hover:bg-card-hover transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring shrink-0"
              :disabled="running"
              :title="$t('diagnostic.run_single')"
              :aria-label="$t('diagnostic.run_single')"
              @click="runSingle(result)"
            >
              <IconPlayerPlay :size="14" />
            </button>
          </div>
          <div
            v-if="result.expanded && result.status === 'fail'"
            class="ml-9 mt-1 mb-2 px-3 py-2 rounded-lg border border-danger bg-danger-soft text-xs text-danger-text"
          >
            <p class="font-semibold leading-snug">{{ result.error }}</p>
            <ul v-if="result.details.length" class="mt-1.5 space-y-0.5 font-mono break-all">
              <li v-for="detail in result.details" :key="detail">{{ detail }}</li>
            </ul>
          </div>
        </li>
      </ul>

      <div class="flex items-center justify-between mt-4 pt-4 border-t border-stroke-muted">
        <span
          class="text-xs font-medium"
          :class="summaryClass"
          role="status"
          aria-live="polite"
        >
          {{ summaryLabel }}
        </span>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-ink-inverse transition-colors hover:bg-accent-hover disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          :disabled="running"
          @click="startRun"
        >
          {{ $t('diagnostic.run_all') }}
        </button>
      </div>
    </div>
  </PanelModal>
</template>

<script setup lang="ts">
import { IconCheck, IconX, IconMinus, IconPlayerPlay } from '@tabler/icons-vue'
import { format } from 'date-fns'
import {
  buildDiagnosticChecks,
  DiagnosticFailure,
  summarizeBody,
  type DiagnosticCheck,
  type DiagnosticContext,
} from '~/utils/diagnostics'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const api = useApi()

type CheckStatus = 'pending' | 'running' | 'ok' | 'fail'

interface CheckResult {
  check: DiagnosticCheck
  status: CheckStatus
  error: string | null
  details: string[]
  durationMs: number | null
  expanded: boolean
}

const results = ref<CheckResult[]>([])
const running = ref(false)

/** One context per modal open: individual runs share the board cache and the created-request id. */
let sharedCtx: DiagnosticContext | null = null

const finishedCount = computed(() => results.value.filter((result) => result.status === 'ok' || result.status === 'fail').length)
const failedCount = computed(() => results.value.filter((result) => result.status === 'fail').length)

const summaryLabel = computed(() => {
  if (running.value) { return t('diagnostic.running') }
  if (finishedCount.value === 0) { return '' }
  if (failedCount.value === 0) { return t('diagnostic.summary_ok', { count: finishedCount.value, total: results.value.length }) }
  return t('diagnostic.summary_fail', { failed: failedCount.value, total: results.value.length })
})

const summaryClass = computed(() => {
  if (running.value || finishedCount.value === 0) { return 'text-ink-muted' }
  return failedCount.value === 0 ? 'text-success' : 'text-danger'
})

watch(() => props.modelValue, (open) => {
  if (open) { resetRun() }
})

function resetRun() {
  // A run already in progress keeps going in the background so cleanup completes
  sharedCtx = null
  results.value = buildDiagnosticChecks().map((check) => ({
    check,
    status: 'pending',
    error: null,
    details: [],
    durationMs: null,
    expanded: false,
  }))
}

function getCtx(): DiagnosticContext {
  if (!sharedCtx) {
    sharedCtx = {
      api,
      employeeId: Number(userStore.info?.employee_id) || 0,
      today: format(new Date(), 'yyyy-MM-dd'),
      bu: preferencesStore.selectedBusinessUnitIds?.join(',') ?? null,
      cache: {},
    }
  }
  return sharedCtx
}

function close() {
  emit('update:modelValue', false)
}

function toggleDetails(result: CheckResult) {
  if (result.status !== 'fail') { return }
  result.expanded = !result.expanded
}

/** Run every check: reads in parallel, then writes sequentially (create → update → delete). */
async function startRun() {
  if (running.value) { return }
  running.value = true
  const ctx = getCtx()
  for (const result of results.value) {
    result.status = 'pending'
    result.error = null
    result.details = []
    result.durationMs = null
    result.expanded = false
  }
  const readResults = results.value.filter((result) => !result.check.write)
  const writeResults = results.value.filter((result) => result.check.write)
  await Promise.all(readResults.map((result) => runOne(result, ctx)))
  for (const result of writeResults) {
    await runOne(result, ctx)
  }
  running.value = false
}

/** Run a single check on demand. Write checks may depend on earlier ones (e.g. delete needs a created request). */
async function runSingle(result: CheckResult) {
  if (running.value) { return }
  running.value = true
  await runOne(result, getCtx())
  running.value = false
}

async function runOne(result: CheckResult, ctx: DiagnosticContext) {
  result.status = 'running'
  const startedAt = performance.now()
  try {
    await result.check.run(ctx)
    result.status = 'ok'
  } catch (error: any) {
    result.status = 'fail'
    if (error instanceof DiagnosticFailure) {
      result.error = error.message
      result.details = error.details
    } else {
      // $fetch errors: error.data is the parsed body, error.message the HTTP status line.
      // Wethod 500s carry only { code, status } — no message — so fall back to both.
      result.error = error?.data?.data?.message
        || error?.data?.message
        || (error?.data?.status ? `Wethod: ${error.data.status} (code ${error.data.code ?? '?'})` : null)
        || error?.message
        || 'unknown error'
      // The actual log: failing call, field-level failures, and the raw body
      const details: string[] = []
      const requestUrl = error?.request || error?.response?.url
      const httpStatus = error?.response?.status
      if (requestUrl || httpStatus) { details.push(`${requestUrl || 'request'} → HTTP ${httpStatus ?? '?'}`) }
      const failures = error?.data?.data?.failures ?? error?.data?.failures
      if (Array.isArray(failures)) {
        for (const failure of failures) { details.push(`${failure?.field}: ${failure?.message}`) }
      }
      if (error?.data !== undefined) { details.push(summarizeBody(error.data)) }
      result.details = details
    }
  } finally {
    result.durationMs = Math.round(performance.now() - startedAt)
  }
}
</script>
