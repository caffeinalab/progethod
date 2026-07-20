<template>
  <div class="bg-page min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-ink">{{ error?.statusCode || 500 }}</h1>
      <p class="text-ink-muted mt-4">{{ error?.statusMessage || 'An error occurred' }}</p>
      <button class="mt-6 px-4 py-2 bg-accent text-ink-inverse rounded-lg hover:bg-accent-hover" @click="handleError">
        Back to home
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ error: { statusCode: number; statusMessage: string } }>()

function handleError() {
  clearError({ redirect: '/' })
}
</script>
