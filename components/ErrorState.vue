<template>
  <div class="text-center" :class="wrapperClass">
    <p class="text-sm text-danger">{{ message }}</p>
    <button
      v-if="retryLabel"
      type="button"
      :class="retryClass"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  message: string
  retryLabel?: string
  /** Preset spacing/retry styles matching existing call sites. */
  variant?: 'panel' | 'modal'
  wrapperClass?: string
}>(), {
  variant: 'modal',
})

defineEmits<{
  retry: []
}>()

const wrapperClass = computed(() => {
  if (props.wrapperClass) return props.wrapperClass
  return props.variant === 'panel' ? 'py-10' : 'py-6'
})

const retryClass = computed(() => {
  if (props.variant === 'panel') {
    return 'mt-3 text-sm text-accent-fg hover:underline'
  }
  return 'mt-3 text-sm text-accent-fg hover:text-accent-hover font-medium'
})
</script>
