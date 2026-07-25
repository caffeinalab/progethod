<template>
  <span
    class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
    :class="modelValue ? 'bg-accent-hover' : 'bg-ink-disabled'"
    role="switch"
    :aria-checked="modelValue"
  >
    <span
      class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
      :class="modelValue ? 'translate-x-3' : 'translate-x-0'"
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
  width: 1.75rem;
  height: 1rem;
  padding: 0.125rem;
}

.toggle-knob {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
