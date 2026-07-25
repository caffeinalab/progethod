<template>
  <div class="text-center" :class="resolvedWrapperClass">
    <div class="inline-block rounded-full animate-spin" :class="spinnerClass" />
    <p v-if="message" :class="resolvedMessageClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  message?: string
  /** Preset spinner styles matching existing call sites. */
  variant?: 'panel' | 'modal'
  wrapperClass?: string
  messageClass?: string
}>(), {
  variant: 'modal',
})

// Keep exact spinner looks:
// - panel (Jira/GitLab): w-5, border-stroke + accent tip, py-10, text-ink-faint
// - modal (Wethod/Office): w-6, border-accent + transparent tip, py-8, text-ink-muted
const spinnerClass = computed(() => {
  if (props.variant === 'panel') {
    return 'w-5 h-5 border-2 border-stroke border-t-accent mb-2'
  }
  return 'w-6 h-6 border-2 border-accent border-t-transparent'
})

const resolvedWrapperClass = computed(() => {
  if (props.wrapperClass) return props.wrapperClass
  return props.variant === 'panel'
    ? 'py-10 text-sm text-ink-faint'
    : 'flex flex-col items-center py-8'
})

const resolvedMessageClass = computed(() => {
  if (props.messageClass) return props.messageClass
  return props.variant === 'panel' ? '' : 'text-sm text-ink-muted mt-3'
})
</script>
