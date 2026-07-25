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
  @apply text-[10px] font-bold leading-none px-1.5 py-0.5 rounded flex-shrink-0 text-center bg-accent text-ink-inverse;
  min-width: 1.25rem;
}
</style>
