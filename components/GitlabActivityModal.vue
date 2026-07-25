<template>
  <ActivityPickerModal
    :model-value="modelValue"
    :title="$t('gitlab.modal_title')"
    :search-placeholder="$t('gitlab.search_placeholder')"
    :loading="loading"
    :error="error"
    :loading-text="$t('gitlab.loading')"
    :retry-label="$t('gitlab.retry')"
    :empty-text="$t('gitlab.no_activity')"
    :no-results-text="$t('gitlab.no_results')"
    :groups="groupedCommits"
    :is-empty="commits.length === 0"
    :filter-item="filterCommit"
    @update:model-value="emit('update:modelValue', $event)"
    @retry="fetchActivity"
    @select="onSelect"
  >
    <template #item="{ item, copiedId, copy }">
      <div class="flex items-center gap-2">
        <code class="text-xs font-semibold text-accent-fg flex-shrink-0">{{ item.shortSha || shortSha(item.sha) }}</code>
        <span class="relative flex-shrink-0">
          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 inline-flex items-center justify-center min-w-6 min-h-6 text-ink-faint hover:text-accent-fg transition-opacity rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            :title="$t('gitlab.copy_sha')"
            @click.stop="copy(item.sha)"
          >
            <IconCopy :size="14" />
          </button>
          <span
            v-if="copiedId === item.sha"
            class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-card-dim text-ink border border-stroke px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none"
          >
            {{ $t('gitlab.copied') }}
          </span>
        </span>
      </div>
      <p class="text-sm text-ink mt-0.5 leading-snug">{{ item.title }}</p>
      <div v-if="item.branches?.length" class="flex flex-wrap gap-1 mt-1">
        <span
          v-for="branch in item.branches"
          :key="branch"
          class="text-xs text-accent-fg bg-accent-soft px-1.5 py-0.5 rounded font-medium"
        >
          {{ branch }}
        </span>
      </div>
    </template>
  </ActivityPickerModal>
</template>

<script setup lang="ts">
import { IconCopy } from '@tabler/icons-vue'
import { getGitlabActivity } from '~/utils/gitlab'
import type { ActivityGroup } from '~/utils/activityPicker'

interface GitlabCommit {
  id: string
  sha: string
  shortSha?: string
  title: string
  project?: string
  projectName?: string
  branches?: string[]
}

const props = defineProps<{
  modelValue: boolean
  day: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [commit: Omit<GitlabCommit, 'id'>]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const commits = ref<GitlabCommit[]>([])

const groupedCommits = computed<ActivityGroup<GitlabCommit>[]>(() => {
  const groups: Record<string, { name: string; commits: GitlabCommit[] }> = {}
  for (const commit of commits.value) {
    const projectKey = commit.project || 'altro'
    if (!groups[projectKey]) groups[projectKey] = { name: commit.project || projectKey, commits: [] }
    groups[projectKey].commits.push(commit)
  }
  return Object.entries(groups)
    .map(([key, group]) => ({ key, label: group.name, items: group.commits }))
    .sort((first, second) => second.items.length - first.items.length)
})

watch(() => props.modelValue, (open) => {
  if (open) fetchActivity()
})

async function fetchActivity() {
  loading.value = true
  error.value = null
  try {
    const raw = await getGitlabActivity(props.day)
    commits.value = (raw || []).map((commit: any) => ({
      ...commit,
      id: commit.sha,
    }))
  } catch (err: any) {
    console.error('GitLab fetch failed:', err)
    error.value = err.response?.data?.message || err.message || 'Errore GitLab'
  } finally {
    loading.value = false
  }
}

function filterCommit(commit: GitlabCommit, query: string) {
  return (commit.sha || '').toLowerCase().includes(query)
    || (commit.shortSha || '').toLowerCase().includes(query)
    || commit.title.toLowerCase().includes(query)
    || (commit.project || '').toLowerCase().includes(query)
    || (commit.projectName || '').toLowerCase().includes(query)
    || (commit.branches || []).some((branch) => branch.toLowerCase().includes(query))
}

function onSelect(commit: GitlabCommit) {
  const { id: _id, ...rest } = commit
  emit('select', rest)
}

function shortSha(sha: string) {
  return sha ? sha.substring(0, 8) : ''
}
</script>
