<template>
  <Transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
      <div class="fixed inset-0 bg-black/40" @click="close" />
      <div class="relative bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 class="text-base font-bold text-ink">
            {{ $t('jira.modal_title') }}
          </h2>
          <button class="text-ink-faint hover:text-ink-secondary p-1" @click="close">
            <IconX :size="20" />
          </button>
        </div>

        <div class="px-5 pb-3">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="w-full px-3 py-2 border border-stroke-muted rounded-lg text-sm text-ink bg-card focus:ring-2 focus:ring-focus-ring focus:border-transparent outline-none placeholder-ink-faint"
            :placeholder="$t('jira.search_placeholder')"
          >
        </div>

        <div class="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          <div v-if="loading" class="py-10 text-center text-sm text-ink-faint">
            <div class="inline-block w-5 h-5 border-2 border-stroke border-t-accent rounded-full animate-spin mb-2" />
            <p>{{ $t('jira.loading') }}</p>
          </div>

          <div v-else-if="error" class="py-10 text-center">
            <p class="text-sm text-danger">{{ error }}</p>
            <button class="mt-3 text-sm text-accent-fg hover:underline" @click="fetchActivity">
              {{ $t('jira.retry') }}
            </button>
          </div>

          <div v-else-if="issues.length === 0" class="py-10 text-center text-sm text-ink-faint">
            {{ $t('jira.no_activity') }}
          </div>

          <template v-else>
            <div v-for="group in filteredGroups" :key="group.project" class="mb-4 last:mb-0">
              <h3 class="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-2">
                {{ group.project }}
              </h3>
              <ul class="space-y-1">
                <li
                  v-for="issue in group.issues"
                  :key="issue.key"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent-soft cursor-pointer transition-colors group"
                  :class="{ 'bg-success-soft': addedKeys.includes(issue.key) }"
                  @click="selectIssue(issue)"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <code class="text-xs font-semibold text-accent-fg">{{ issue.key }}</code>
                      <span class="relative">
                        <button
                          class="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-accent-fg transition-opacity p-0.5"
                          :title="$t('jira.copy_id')"
                          @click.stop="copyToClipboard(issue.key)"
                        >
                          <IconCopy :size="14" />
                        </button>
                        <span
                          v-if="copiedKey === issue.key"
                          class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-card-dim text-ink border border-stroke px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none"
                        >
                          {{ $t('jira.copied') }}
                        </span>
                      </span>
                      <span class="ml-auto text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap" :class="statusClasses(issue.status)">
                        {{ issue.status }}
                      </span>
                    </div>
                    <p class="text-sm text-ink mt-0.5 leading-snug">{{ issue.summary }}</p>
                  </div>
                  <IconCheck v-if="addedKeys.includes(issue.key)" :size="18" class="text-success flex-shrink-0" />
                </li>
              </ul>
            </div>

            <p v-if="filteredGroups.length === 0" class="py-6 text-center text-sm text-ink-faint">
              {{ $t('jira.no_results') }}
            </p>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { IconX, IconCopy, IconCheck } from '@tabler/icons-vue'
import { getJiraActivity } from '~/utils/jira'

const { t: $t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  day: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue', 'select'])

const loading = ref(false)
const error = ref(null)
const issues = ref([])
const searchQuery = ref('')
const copiedKey = ref(null)
const addedKeys = ref([])
const searchInput = ref(null)

const groupedIssues = computed(() => {
  const groups = {}
  for (const issue of issues.value) {
    const project = issue.project || 'Altro'
    if (!groups[project]) groups[project] = []
    groups[project].push(issue)
  }
  return Object.entries(groups)
    .map(([project, items]) => ({ project, issues: items }))
    .sort((a, b) => b.issues.length - a.issues.length)
})

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return groupedIssues.value
  const query = searchQuery.value.toLowerCase()
  return groupedIssues.value
    .map((group) => ({
      project: group.project,
      issues: group.issues.filter((issue) =>
        issue.key.toLowerCase().includes(query) ||
        issue.summary.toLowerCase().includes(query) ||
        issue.status.toLowerCase().includes(query) ||
        (issue.project || '').toLowerCase().includes(query),
      ),
    }))
    .filter((group) => group.issues.length > 0)
})

watch(() => props.modelValue, (open) => {
  if (open) {
    searchQuery.value = ''
    addedKeys.value = []
    fetchActivity()
    nextTick(() => searchInput.value?.focus())
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function close() {
  emit('update:modelValue', false)
}

async function fetchActivity() {
  loading.value = true
  error.value = null
  try {
    issues.value = await getJiraActivity(props.day)
  } catch (err) {
    console.error('Jira fetch failed:', err)
    error.value = err.response?.data?.message || err.message || 'Errore Jira'
  } finally {
    loading.value = false
  }
}

function selectIssue(issue) {
  emit('select', issue)
  if (!addedKeys.value.includes(issue.key)) {
    addedKeys.value.push(issue.key)
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
  copiedKey.value = text
  setTimeout(() => { copiedKey.value = null }, 1500)
}

function statusClasses(status) {
  const lower = (status || '').toLowerCase()
  if (lower.includes('done') || lower.includes('chiuso') || lower.includes('completat')) return 'bg-success-soft text-success-text'
  if (lower.includes('progress') || lower.includes('corso') || lower.includes('review')) return 'bg-accent-soft text-accent-fg'
  if (lower.includes('test')) return 'bg-warning-soft text-warning-text'
  return 'bg-card-hover text-ink-secondary'
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
