<template>
  <div v-if="isDevMode" class="fixed top-20 right-4 z-[9999]">
    <div class="transition-all duration-200">
      <button
        v-if="!expanded"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-warning-soft text-warning-text border border-warning-text/20 hover:bg-warning-text/20 transition-colors shadow-lg"
        @click="expanded = true"
      >
        <IconCode :size="14" />
        {{ $t('dev_bar.label') }}
        <span v-if="hasToken" class="inline-block w-1.5 h-1.5 rounded-full" :class="isTokenExpired ? 'bg-danger' : 'bg-success'" />
      </button>

      <div
        v-else
        class="w-80 rounded-lg bg-card border border-warning-text/30 shadow-xl"
      >
        <div
          class="flex items-center justify-between px-3 py-1.5 bg-warning-soft rounded-t-lg border-b border-warning-text/20 cursor-pointer"
          @click="expanded = false"
        >
          <span class="text-xs font-semibold text-warning-text flex items-center gap-1.5">
            <IconCode :size="14" />
            {{ $t('dev_bar.label') }}
          </span>
          <IconChevronDown :size="14" class="text-warning-text" />
        </div>

        <div class="p-3 space-y-2">
          <div v-if="hasToken" class="flex items-center gap-2 text-xs">
            <span class="inline-block w-2 h-2 rounded-full flex-shrink-0" :class="isTokenExpired ? 'bg-danger' : 'bg-success'" />
            <span class="text-ink-secondary break-all font-mono select-all cursor-text">
              {{ maskedToken }}
            </span>
          </div>
          <div v-else class="text-xs text-ink-muted">
            {{ $t('dev_bar.no_token') }}
          </div>

          <div class="flex gap-2">
            <input
              v-model="tokenValue"
              type="text"
              :placeholder="$t('dev_bar.placeholder')"
              class="flex-1 min-w-0 px-2 py-1.5 text-xs font-mono rounded border border-stroke bg-page text-ink placeholder-ink-muted focus:outline-none focus:border-accent"
              @keydown.enter="applyToken"
            >
            <button
              class="px-3 py-1.5 text-xs font-semibold rounded transition-colors"
              :class="tokenValue.trim()
                ? 'bg-accent text-ink-inverse hover:bg-accent-hover'
                : 'bg-card-hover text-ink-disabled cursor-not-allowed'"
              :disabled="!tokenValue.trim() || loading"
              @click="applyToken"
            >
              <IconLoader v-if="loading" :size="14" class="animate-spin" />
              <template v-else>
                {{ $t('dev_bar.apply') }}
              </template>
            </button>
          </div>

          <p v-if="error" class="text-xs text-danger">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconChevronDown, IconCode, IconLoader } from '@tabler/icons-vue'

const { t: $t } = useI18n()
const config = useRuntimeConfig()
const userStore = useUserStore()
const api = useApi()

const expanded = ref(false)
const tokenValue = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const isDevMode = computed(() => import.meta.dev)
const hasToken = computed(() => !!userStore.authToken)
const isTokenExpired = computed(() => userStore.isTokenExpired)
const maskedToken = computed(() => userStore.authToken || '')

async function applyToken() {
  const token = tokenValue.value.trim()
  if (!token) return

  loading.value = true
  error.value = null

  try {
    const data = await api.$get('me', {
      headers: { 'x-sf-sess-id': token }
    })

    userStore.setToken(token)
    userStore.updateInfo(data.data ?? data)
    tokenValue.value = ''
    expanded.value = false

    window.location.reload()
  } catch (err: any) {
    const status = err.response?.status || err.statusCode
    error.value = status === 401
      ? $t('dev_bar.error_invalid')
      : $t('dev_bar.error_generic', { status: status || 'network' })
  } finally {
    loading.value = false
  }
}
</script>
