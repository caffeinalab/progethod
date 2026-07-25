<template>
  <ActivityPickerModal
    :model-value="modelValue"
    :title="$t('jira.modal_title')"
    :search-placeholder="$t('jira.search_placeholder')"
    :loading="loading"
    :error="error"
    :loading-text="$t('jira.loading')"
    :retry-label="$t('jira.retry')"
    :empty-text="$t('jira.no_activity')"
    :no-results-text="$t('jira.no_results')"
    :groups="groupedIssues"
    :is-empty="issues.length === 0"
    :filter-item="filterIssue"
    @update:model-value="emit('update:modelValue', $event)"
    @retry="fetchActivity"
    @select="onSelect"
  >
    <template #item="{ item, copiedId, copy }">
      <div class="flex items-center gap-2">
        <code class="text-xs font-semibold text-accent-fg">{{ item.key }}</code>
        <span class="relative">
          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 inline-flex items-center justify-center min-w-6 min-h-6 text-ink-faint hover:text-accent-fg transition-opacity rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            :title="$t('jira.copy_id')"
            @click.stop="copy(item.key)"
          >
            <IconCopy :size="14" />
          </button>
          <span
            v-if="copiedId === item.key"
            class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-card-dim text-ink border border-stroke px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none"
          >
            {{ $t('jira.copied') }}
          </span>
        </span>
        <span class="ml-auto text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap" :class="statusClasses(item.status)">
          {{ item.status }}
        </span>
      </div>
      <p class="text-sm text-ink mt-0.5 leading-snug">{{ item.summary }}</p>
    </template>
  </ActivityPickerModal>
</template>

<script setup lang="ts">
import { IconCopy } from '@tabler/icons-vue'
import { getJiraActivity } from '~/utils/jira'
import type { ActivityGroup } from '~/utils/activityPicker'

interface JiraIssue {
  id: string
  key: string
  summary: string
  status: string
  project?: string
}

const props = defineProps<{
  modelValue: boolean
  day: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [issue: Omit<JiraIssue, 'id'> & { key: string }]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const issues = ref<JiraIssue[]>([])

const groupedIssues = computed<ActivityGroup<JiraIssue>[]>(() => {
  const groups: Record<string, JiraIssue[]> = {}
  for (const issue of issues.value) {
    const project = issue.project || 'Altro'
    if (!groups[project]) groups[project] = []
    groups[project].push(issue)
  }
  return Object.entries(groups)
    .map(([project, items]) => ({ key: project, label: project, items }))
    .sort((first, second) => second.items.length - first.items.length)
})

watch(() => props.modelValue, (open) => {
  if (open) fetchActivity()
})

async function fetchActivity() {
  loading.value = true
  error.value = null
  try {
    const raw = await getJiraActivity(props.day)
    issues.value = (raw || []).map((issue: any) => ({
      ...issue,
      id: issue.key,
    }))
  } catch (err: any) {
    console.error('Jira fetch failed:', err)
    error.value = err.response?.data?.message || err.message || 'Errore Jira'
  } finally {
    loading.value = false
  }
}

function filterIssue(issue: JiraIssue, query: string) {
  return issue.key.toLowerCase().includes(query)
    || issue.summary.toLowerCase().includes(query)
    || issue.status.toLowerCase().includes(query)
    || (issue.project || '').toLowerCase().includes(query)
}

function onSelect(issue: JiraIssue) {
  const { id: _id, ...rest } = issue
  emit('select', rest)
}

function statusClasses(status: string) {
  const lower = (status || '').toLowerCase()
  if (lower.includes('done') || lower.includes('chiuso') || lower.includes('completat')) return 'bg-success-soft text-success-text'
  if (lower.includes('progress') || lower.includes('corso') || lower.includes('review')) return 'bg-accent-soft text-accent-fg'
  if (lower.includes('test')) return 'bg-warning-soft text-warning-text'
  return 'bg-card-hover text-ink-secondary'
}
</script>
