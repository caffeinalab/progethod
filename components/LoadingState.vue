<template>
  <div class="flex flex-col items-center text-center py-8">
    <div class="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    <p v-if="message" class="text-sm text-ink-muted mt-3">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>
