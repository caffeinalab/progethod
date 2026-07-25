<template>
  <span
    class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
    :class="modelValue ? 'bg-accent-hover' : 'bg-ink-disabled'"
    role="switch"
    :aria-checked="modelValue"
  >
    <span
      class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
      :class="modelValue ? 'translate-x-4' : 'translate-x-0'"
    />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()
</script>

<style scoped>
.toggle-track {
  width: 2.5rem;
  height: 1.5rem;
  padding: 0.1875rem;
}

.toggle-knob {
  width: 1.125rem;
  height: 1.125rem;
}
</style>
