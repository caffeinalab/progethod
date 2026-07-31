<template>
  <Modal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="w-full">
      <h2 class="text-lg font-bold text-ink text-center mb-1">
        {{ $t('office_days_modal_title') }}
      </h2>
      <p class="text-sm text-ink-secondary text-center mb-6 capitalize">
        {{ monthLabel }}
      </p>

      <div v-if="loading" class="py-4 space-y-3">
        <p class="text-sm text-ink-muted text-center">
          {{ $t('office_days_modal_loading') }}
        </p>
        <div class="flex justify-between text-xs text-ink-secondary">
          <span>{{ $t('office_days_progress', { checked: checkedCount, total: totalCount }) }}</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <div class="w-full h-2 rounded-full bg-card-hover border border-stroke-muted overflow-hidden">
          <div
            class="h-full rounded-full bg-accent transition-all duration-300"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
      </div>

      <ErrorState
        v-else-if="error"
        :message="$t('office_days_modal_error')"
        :retry-label="$t('office_days_modal_retry')"
        @retry="fetchData"
      />

      <div v-else-if="result !== null" class="space-y-5">
        <p class="text-center">
          <span class="block text-3xl font-semibold text-ink tabular-nums">{{ result.count }}</span>
          <span class="block text-sm text-ink-secondary mt-1">{{ $t('office_days_found_label') }}</span>
        </p>

        <ul v-if="result.officeDates.length > 0" class="space-y-1">
          <li
            v-for="officeDate in result.officeDates"
            :key="officeDate"
            class="text-sm text-ink-secondary capitalize"
          >
            {{ formatOfficeDate(officeDate) }}
          </li>
        </ul>
        <p v-else class="text-sm text-ink-muted text-center">
          {{ $t('office_days_none') }}
        </p>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

/** Parallel single-day checks — each Worker call has its own subrequest budget. */
const CHECK_CONCURRENCY = 6

const { t: $t } = useI18n()
const api = useApi()
const preferencesStore = usePreferencesStore()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  monthTrackedHours: { type: Array, default: () => [] },
  monthLabel: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const error = ref(false)
const result = ref(null)
const checkedCount = ref(0)
const totalCount = ref(0)

const buParam = computed(() => {
  const selectedBuIds = preferencesStore.selectedBusinessUnitIds
  if (selectedBuIds === null) return null
  return selectedBuIds.map(String).join(',')
})

const progressPercent = computed(() => {
  if (totalCount.value <= 0) return 0
  return Math.round((checkedCount.value / totalCount.value) * 100)
})

watch(() => props.modelValue, (open) => {
  if (open) {
    result.value = null
    error.value = false
    checkedCount.value = 0
    totalCount.value = 0
    fetchData()
  }
})

async function fetchData() {
  const candidates = props.monthTrackedHours
    .filter((entry) => entry.value >= 8)
    .map((entry) => ({ date: entry.date, expected: entry.value }))
    .sort((first, second) => first.date.localeCompare(second.date))

  if (candidates.length === 0) {
    result.value = { count: 0, officeDates: [] }
    return
  }

  loading.value = true
  error.value = false
  checkedCount.value = 0
  totalCount.value = candidates.length

  try {
    const officeDates = []
    let hasFailure = false

    await mapPool(candidates, CHECK_CONCURRENCY, async (candidate) => {
      if (hasFailure) {
        checkedCount.value += 1
        return
      }

      try {
        const params = { date: candidate.date, expected: String(candidate.expected) }
        if (buParam.value) {
          params.bu = buParam.value
        }
        const response = await api.$get('office-days', { params })
        if (response?.data?.isOfficeDay) {
          officeDates.push(candidate.date)
        }
      } catch {
        hasFailure = true
      } finally {
        checkedCount.value += 1
      }
    })

    if (hasFailure) {
      error.value = true
      return
    }

    const sortedDates = officeDates.sort()
    result.value = { count: sortedDates.length, officeDates: sortedDates }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

/**
 * Run `worker` over `items` with at most `concurrency` in flight.
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T) => Promise<void>} worker
 */
async function mapPool(items, concurrency, worker) {
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      await worker(items[index])
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))
}

function formatOfficeDate(dateKey) {
  return format(parseISO(dateKey), 'EEEE d MMMM', { locale: it })
}
</script>
