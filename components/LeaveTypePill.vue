<template>
  <span class="leave-type-pill" :title="title">
    {{ resolvedShortLabel }}
  </span>
</template>

<script setup lang="ts">
const VACATION_PROJECT_ID = 83

const props = defineProps<{
  projectId: number
  title?: string
  shortLabel?: string
}>()

const isVacation = computed(() => props.projectId === VACATION_PROJECT_ID)

const resolvedShortLabel = computed(() => {
  if (props.shortLabel) return props.shortLabel
  return isVacation.value ? 'F' : 'P'
})
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

.leave-type-pill {
  @apply text-xs font-semibold leading-none tracking-wide px-2 py-1 rounded flex-shrink-0 text-center bg-accent text-ink-inverse;
  min-width: 1.5rem;
}
</style>
