<template>
  <span class="leave-type-pill" :class="isVacation ? 'pill-ferie' : 'pill-permesso'" :title="title">
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
  @apply text-[10px] font-bold leading-none px-1.5 py-0.5 rounded flex-shrink-0 text-center;
  min-width: 1.25rem;
}

.pill-ferie { background: rgba(245, 158, 11, 0.15); color: #d97706; }
.pill-permesso { background: var(--color-accent); color: #fff; }

:global(.dark) .pill-ferie { background: rgba(251, 191, 36, 0.18); color: #fbbf24; }
:global(.dark) .pill-permesso { color: #1e1b4b; }
</style>
