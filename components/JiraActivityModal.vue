<template>
  <transition name="fade">
    <div v-if="value" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
      <div class="fixed inset-0 bg-black bg-opacity-40" @click="close" />
      <div class="relative bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 class="text-base font-bold text-ink">
            {{ $t('jira.modal_title') }}
          </h2>
          <button class="text-ink-faint hover:text-ink-secondary p-1" @click="close">
            <x-icon size="20" />
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
            <p class="text-sm text-danger">
              {{ error }}
            </p>
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
                          <copy-icon size="14" />
                        </button>
                        <span
                          v-if="copiedKey === issue.key"
                          class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-card-dim text-ink border border-stroke px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none"
                        >
                          {{ $t('jira.copied') }}
                        </span>
                      </span>
                      <span
                        class="ml-auto text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        :class="statusClasses(issue.status)"
                      >
                        {{ issue.status }}
                      </span>
                    </div>
                    <p class="text-sm text-ink mt-0.5 leading-snug">
                      {{ issue.summary }}
                    </p>
                  </div>
                  <check-icon
                    v-if="addedKeys.includes(issue.key)"
                    size="18"
                    class="text-success flex-shrink-0"
                  />
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
  </transition>
</template>

<script>
import { XIcon, CopyIcon, CheckIcon } from 'vue-tabler-icons'
import { getJiraActivity } from '~/utils/jira'

export default {
  components: { XIcon, CopyIcon, CheckIcon },
  props: {
    value: {
      type: Boolean,
      default: false
    },
    day: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      loading: false,
      error: null,
      issues: [],
      searchQuery: '',
      copiedKey: null,
      addedKeys: []
    }
  },
  computed: {
    groupedIssues () {
      const groups = {}
      for (const issue of this.issues) {
        const project = issue.project || 'Altro'
        if (!groups[project]) {
          groups[project] = []
        }
        groups[project].push(issue)
      }
      return Object.entries(groups)
        .map(([project, issues]) => ({ project, issues }))
        .sort((a, b) => b.issues.length - a.issues.length)
    },
    filteredGroups () {
      if (!this.searchQuery.trim()) {
        return this.groupedIssues
      }
      const query = this.searchQuery.toLowerCase()
      return this.groupedIssues
        .map(group => ({
          project: group.project,
          issues: group.issues.filter(issue =>
            issue.key.toLowerCase().includes(query) ||
            issue.summary.toLowerCase().includes(query) ||
            issue.status.toLowerCase().includes(query) ||
            (issue.project || '').toLowerCase().includes(query)
          )
        }))
        .filter(group => group.issues.length > 0)
    }
  },
  watch: {
    value (open) {
      if (open) {
        this.searchQuery = ''
        this.addedKeys = []
        this.fetchActivity()
        this.$nextTick(() => {
          this.$refs.searchInput?.focus()
        })
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
  },
  beforeDestroy () {
    document.body.style.overflow = ''
  },
  methods: {
    close () {
      this.$emit('input', false)
    },
    async fetchActivity () {
      this.loading = true
      this.error = null
      try {
        this.issues = await getJiraActivity(this.day)
      } catch (err) {
        console.error('Jira fetch failed:', err)
        this.error = err.response?.data?.message || err.message || 'Errore Jira'
      } finally {
        this.loading = false
      }
    },
    selectIssue (issue) {
      this.$emit('select', issue)
      if (!this.addedKeys.includes(issue.key)) {
        this.addedKeys.push(issue.key)
      }
    },
    async copyToClipboard (text) {
      try {
        await navigator.clipboard.writeText(text)
        this.copiedKey = text
        setTimeout(() => { this.copiedKey = null }, 1500)
      } catch {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.copiedKey = text
        setTimeout(() => { this.copiedKey = null }, 1500)
      }
    },
    statusClasses (status) {
      const lower = (status || '').toLowerCase()
      if (lower.includes('done') || lower.includes('chiuso') || lower.includes('completat')) {
        return 'bg-success-soft text-success-text'
      }
      if (lower.includes('progress') || lower.includes('corso') || lower.includes('review')) {
        return 'bg-accent-soft text-accent-fg'
      }
      if (lower.includes('test')) {
        return 'bg-warning-soft text-warning-text'
      }
      return 'bg-card-hover text-ink-secondary'
    }
  }
}
</script>
