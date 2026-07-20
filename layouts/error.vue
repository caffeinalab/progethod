<template>
  <div class="bg-page min-h-screen flex items-center justify-center">
    <div class="text-center max-w-2xl px-4">
      <h1 class="text-6xl font-bold text-ink">{{ error?.statusCode || 500 }}</h1>
      <p class="text-ink-muted mt-4">{{ error?.statusMessage || 'An error occurred' }}</p>
      <pre v-if="errorDetails" class="mt-6 text-left text-xs bg-card border border-stroke rounded-lg p-4 overflow-auto max-h-64 text-ink-muted whitespace-pre-wrap break-words">{{ errorDetails }}</pre>
      <button class="mt-6 px-4 py-2 bg-accent text-ink-inverse rounded-lg hover:bg-accent-hover" @click="handleError">
        {{ $t('back_home') || 'Back to home' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; statusMessage: string; stack?: string; message?: string; cause?: unknown; data?: unknown } }>()

const errorDetails = computed(() => {
  const parts: string[] = []
  if (props.error?.message) parts.push('Message: ' + props.error.message)
  if (props.error?.stack) parts.push('Stack:\n' + props.error.stack)
  if (props.error?.cause) parts.push('Cause: ' + JSON.stringify(props.error.cause, null, 2))
  if (props.error?.data) parts.push('Data: ' + JSON.stringify(props.error.data, null, 2))
  return parts.join('\n\n') || null
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>
