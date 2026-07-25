<template>
  <Modal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="w-full">
      <h2 class="text-lg font-bold text-ink text-center mb-1">
        {{ $t('wethod_hours_modal.title') }}
      </h2>
      <p class="text-sm text-ink-secondary text-center mb-5 capitalize">
        {{ dayLabel }}
      </p>

      <div v-if="loading" class="flex flex-col items-center py-8">
        <span class="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm text-ink-muted mt-3">{{ $t('wethod_hours_modal.loading') }}</p>
      </div>

      <div v-else-if="error" class="text-center py-6">
        <p class="text-sm text-danger">{{ $t('wethod_hours_modal.error') }}</p>
        <button class="mt-3 text-sm text-accent-fg hover:text-accent-hover font-medium" @click="fetchData">
          {{ $t('wethod_hours_modal.retry') }}
        </button>
      </div>

      <div v-else-if="entries.length === 0" class="text-center py-6">
        <p class="text-sm text-ink-faint">{{ $t('wethod_hours_modal.empty') }}</p>
      </div>

      <div v-else class="space-y-3 max-h-[50vh] overflow-y-auto -mx-1 px-1">
        <div
          v-for="entry in entries"
          :key="entry.key"
          class="rounded-lg border border-stroke-muted bg-page px-3 py-2.5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-ink truncate">{{ entry.projectName }}</p>
              <p class="text-xs text-ink-secondary truncate mt-0.5">{{ entry.areaName }}</p>
            </div>
            <span class="text-sm font-bold text-ink tabular-nums shrink-0">{{ entry.totalLabel }}</span>
          </div>
          <div v-if="entry.types.length" class="flex flex-wrap gap-1.5 mt-2">
            <span
              v-for="typeEntry in entry.types"
              :key="typeEntry.key"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-card border border-stroke-muted text-ink-secondary"
            >
              {{ typeEntry.label }}
              <span class="font-semibold text-ink tabular-nums">{{ typeEntry.hoursLabel }}</span>
            </span>
          </div>
          <p v-if="entry.notes" class="text-xs text-ink-muted mt-2 whitespace-pre-line">{{ entry.notes }}</p>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-stroke-muted px-1">
          <span class="text-sm font-medium text-ink-secondary">{{ $t('total') }}</span>
          <span class="text-sm font-bold text-ink tabular-nums">{{ totalLabel }}</span>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { format as formatDate } from 'date-fns'
import { it } from 'date-fns/locale'
import { formatDecimalHoursLabel } from '~/utils/duration'

type HourTypeKey = 'internal' | 'remote' | 'travel' | 'overtime' | 'night_shift'

interface DetailHours {
  internal: number
  remote: number
  travel: number
  overtime: number
  night_shift: number
}

interface DetailEntry {
  projectId: number
  projectName: string
  areaId: number
  areaName: string | null
  notes: string | null
  hours: DetailHours
  total: number
}

interface BreakdownEntry {
  key: string
  projectName: string
  areaName: string
  notes: string
  total: number
  totalLabel: string
  types: Array<{ key: HourTypeKey; label: string; hoursLabel: string }>
}

const HOUR_TYPES: Array<{ key: HourTypeKey; i18nKey: string }> = [
  { key: 'internal', i18nKey: 'office' },
  { key: 'remote', i18nKey: 'home' },
  { key: 'travel', i18nKey: 'travel' },
  { key: 'overtime', i18nKey: 'overtime' },
  { key: 'night_shift', i18nKey: 'night_shift' },
]

const props = defineProps<{
  modelValue: boolean
  day: string
  expectedHours?: number | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const api = useApi()
const preferencesStore = usePreferencesStore()

const loading = ref(false)
const error = ref(false)
const entries = ref<BreakdownEntry[]>([])

const dayLabel = computed(() => {
  try {
    return formatDate(new Date(props.day + 'T00:00:00'), 'EEEE d MMMM yyyy', { locale: it })
  } catch {
    return props.day
  }
})

const totalLabel = computed(() => {
  const total = entries.value.reduce((sum, entry) => sum + entry.total, 0)
  return formatDecimalHoursLabel(total)
})

watch(() => props.modelValue, (open) => {
  if (open) {
    entries.value = []
    error.value = false
    fetchData()
  }
})

async function fetchData() {
  loading.value = true
  error.value = false

  try {
    const params: Record<string, string> = { date: props.day }

    if (props.expectedHours != null && props.expectedHours > 0) {
      params.expected = String(props.expectedHours)
    }

    const selectedBuIds = preferencesStore.selectedBusinessUnitIds
    if (selectedBuIds !== null) {
      params.bu = selectedBuIds.map(String).join(',')
    }

    const response = await api.$get<{ data: { entries: DetailEntry[] } }>('tracked-hours-detail', { params })
    entries.value = mapDetailEntries(response?.data?.entries || [])
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function mapDetailEntries(detailEntries: DetailEntry[]): BreakdownEntry[] {
  return detailEntries.map((entry) => {
    const types = HOUR_TYPES
      .filter(({ key }) => (entry.hours?.[key] || 0) > 0)
      .map(({ key, i18nKey }) => ({
        key,
        label: t(i18nKey),
        hoursLabel: formatDecimalHoursLabel(entry.hours[key] || 0),
      }))

    return {
      key: `${entry.projectId}-${entry.areaId}`,
      projectName: entry.projectName || '—',
      areaName: entry.areaName || t('wethod_hours_modal.generic_area'),
      notes: typeof entry.notes === 'string' ? entry.notes.trim() : '',
      total: entry.total,
      totalLabel: formatDecimalHoursLabel(entry.total),
      types,
    }
  })
}
</script>
