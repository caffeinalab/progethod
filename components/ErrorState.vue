<template>
  <div class="text-center py-6">
    <p class="text-sm text-danger">{{ message }}</p>
    <div class="mt-3 flex items-center justify-center gap-4">
      <button
        v-if="retryLabel"
        type="button"
        class="text-sm text-accent-fg hover:text-accent-hover font-medium"
        @click="$emit('retry')"
      >
        {{ retryLabel }}
      </button>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  retryLabel?: string
}>()

defineEmits<{
  retry: []
}>()
</script>
