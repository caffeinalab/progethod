<template>
  <Transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
      <div class="fixed inset-0 bg-black/40" @click="close" />
      <div class="relative bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 class="text-base font-bold text-ink">
            {{ $t('gitlab.modal_title') }}
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
            :placeholder="$t('gitlab.search_placeholder')"
          >
        </div>

        <div class="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          <div v-if="loading" class="py-10 text-center text-sm text-ink-faint">
            <div class="inline-block w-5 h-5 border-2 border-stroke border-t-accent rounded-full animate-spin mb-2" />
            <p>{{ $t('gitlab.loading') }}</p>
          </div>

          <div v-else-if="error" class="py-10 text-center">
            <p class="text-sm text-danger">{{ error }}</p>
            <button class="mt-3 text-sm text-accent-fg hover:underline" @click="fetchActivity">
              {{ $t('gitlab.retry') }}
            </button>
          </div>

          <div v-else-if="commits.length === 0" class="py-10 text-center text-sm text-ink-faint">
            {{ $t('gitlab.no_activity') }}
          </div>

          <template v-else>
            <div v-for="group in filteredGroups" :key="group.name" class="mb-4 last:mb-0">
              <h3 class="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-2">
                {{ group.name }}
              </h3>
              <ul class="space-y-1">
                <li
                  v-for="commit in group.commits"
                  :key="commit.sha"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent-soft cursor-pointer transition-colors group"
                  :class="{ 'bg-success-soft': addedShas.includes(commit.sha) }"
                  @click="selectCommit(commit)"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <code class="text-xs font-semibold text-warning-text flex-shrink-0">{{ commit.shortSha || shortSha(commit.sha) }}</code>
                      <span class="relative flex-shrink-0">
                        <button
                          class="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-accent-fg transition-opacity p-0.5"
                          :title="$t('gitlab.copy_sha')"
                          @click.stop="copyToClipboard(commit.sha)"
                        >
                          <IconCopy :size="14" />
                        </button>
                        <span
                          v-if="copiedSha === commit.sha"
                          class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-card-dim text-ink border border-stroke px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none"
                        >
                          {{ $t('gitlab.copied') }}
                        </span>
                      </span>
                    </div>
                    <p class="text-sm text-ink mt-0.5 leading-snug">{{ commit.title }}</p>
                    <div v-if="commit.branches && commit.branches.length" class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="branch in commit.branches"
                        :key="branch"
                        class="text-xs text-accent-fg bg-accent-soft px-1.5 py-0.5 rounded font-medium"
                      >
                        {{ branch }}
                      </span>
                    </div>
                  </div>
                  <IconCheck v-if="addedShas.includes(commit.sha)" :size="18" class="text-success flex-shrink-0" />
                </li>
              </ul>
            </div>

            <p v-if="filteredGroups.length === 0" class="py-6 text-center text-sm text-ink-faint">
              {{ $t('gitlab.no_results') }}
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
import { getGitlabActivity } from '~/utils/gitlab'

const { t: $t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  day: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue', 'select'])

const loading = ref(false)
const error = ref(null)
const commits = ref([])
const searchQuery = ref('')
const copiedSha = ref(null)
const addedShas = ref([])
const searchInput = ref(null)

const groupedCommits = computed(() => {
  const groups = {}
  for (const commit of commits.value) {
    const projectKey = commit.project || 'altro'
    if (!groups[projectKey]) groups[projectKey] = { name: commit.projectName || projectKey, commits: [] }
    groups[projectKey].commits.push(commit)
  }
  return Object.values(groups).sort((a, b) => b.commits.length - a.commits.length)
})

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return groupedCommits.value
  const query = searchQuery.value.toLowerCase()
  return groupedCommits.value
    .map((group) => ({
      name: group.name,
      commits: group.commits.filter((commit) =>
        (commit.sha || '').toLowerCase().includes(query) ||
        (commit.shortSha || '').toLowerCase().includes(query) ||
        commit.title.toLowerCase().includes(query) ||
        (commit.project || '').toLowerCase().includes(query) ||
        (commit.projectName || '').toLowerCase().includes(query) ||
        (commit.branches || []).some((branch) => branch.toLowerCase().includes(query)),
      ),
    }))
    .filter((group) => group.commits.length > 0)
})

watch(() => props.modelValue, (open) => {
  if (open) {
    searchQuery.value = ''
    addedShas.value = []
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
    commits.value = await getGitlabActivity(props.day)
  } catch (err) {
    console.error('GitLab fetch failed:', err)
    error.value = err.response?.data?.message || err.message || 'Errore GitLab'
  } finally {
    loading.value = false
  }
}

function selectCommit(commit) {
  emit('select', commit)
  if (!addedShas.value.includes(commit.sha)) {
    addedShas.value.push(commit.sha)
  }
}

function shortSha(sha) {
  return sha ? sha.substring(0, 8) : ''
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
  copiedSha.value = text
  setTimeout(() => { copiedSha.value = null }, 1500)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
