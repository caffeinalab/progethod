<template>
  <div class="text-center py-6">
    <p class="text-sm text-danger">{{ message }}</p>
    <button
      v-if="retryLabel"
      type="button"
      class="mt-3 text-sm text-accent-fg hover:text-accent-hover font-medium"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </button>
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
