<template>
  <Modal :model-value="modelValue" confirmable @update:model-value="close" @confirm="applyToken">
    <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-soft border border-accent/20">
      <IconKey :size="24" class="text-accent-fg" />
    </div>
    <p class="text-lg font-semibold mt-4 text-ink text-center">
      {{ $t('session_token.title') }}
    </p>
    <p class="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-muted text-center">
      {{ $t('session_token.description') }}
    </p>

    <form class="w-full mt-5 space-y-4" @submit.prevent="applyToken">
      <input
        ref="inputRef"
        v-model="tokenValue"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :aria-label="$t('session_token.title')"
        :placeholder="$t('session_token.placeholder')"
        class="w-full h-10 px-3 text-sm font-mono rounded-lg border border-stroke bg-page text-ink placeholder-ink-muted shadow focus:outline-none focus:border-accent"
      >
      <Alert v-if="error" level="error" :message="error" />
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex-1 px-4 py-2.5 rounded-lg border border-stroke bg-card text-sm font-medium text-ink hover:bg-card-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          @click="close"
        >
          {{ $t('calendar_page.cancel') }}
        </button>
        <button
          type="submit"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          :class="canApply
            ? 'bg-accent text-ink-inverse hover:bg-accent-hover'
            : 'bg-card-hover text-ink-disabled cursor-not-allowed'"
          :disabled="!canApply"
        >
          <IconLoader v-if="loading" :size="16" class="animate-spin" />
          {{ $t('session_token.apply') }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { IconKey, IconLoader } from '@tabler/icons-vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t: $t } = useI18n()
const userStore = useUserStore()
const api = useApi()
const route = useRoute()

const inputRef = ref<HTMLInputElement | null>(null)
const tokenValue = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const canApply = computed(() => tokenValue.value.trim().length > 0 && !loading.value)

watch(() => props.modelValue, async (open) => {
  if (!open) { return }
  tokenValue.value = ''
  error.value = null
  // Modal focuses its overlay after a nextTick on open; a macrotask runs after that.
  setTimeout(() => inputRef.value?.focus(), 0)
})

function close() {
  if (loading.value) { return }
  emit('update:modelValue', false)
}

async function applyToken() {
  const token = tokenValue.value.trim()
  if (!token || loading.value) { return }

  loading.value = true
  error.value = null

  try {
    const response = await api.$get<{ data?: any }>('me', { headers: { 'x-sf-sess-id': token } })
    userStore.setToken(token)
    userStore.updateInfo(response?.data ?? response)
    // Full reload so every store and page refetches with the new session.
    if (route.path === '/login') {
      window.location.assign('/')
    } else {
      window.location.reload()
    }
  } catch (requestError: any) {
    const status = requestError?.response?.status || requestError?.statusCode
    error.value = status === 401
      ? $t('session_token.error_invalid')
      : $t('session_token.error_generic', { status: status || 'network' })
    loading.value = false
  }
}
</script>
