<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    class="day-stat-box"
    :class="[
      variantClass,
      clickable ? 'day-stat-box--clickable' : '',
    ]"
    :title="title"
    @click="clickable ? $emit('click') : undefined"
  >
    <span class="day-stat-label">{{ label }}</span>
    <span class="day-stat-value" :class="compactValue ? 'day-stat-value--compact' : ''">{{ value }}</span>
  </component>
</template>

<script setup lang="ts">
export type DayStatVariant = 'default' | 'success' | 'warning' | 'vacation' | 'holiday'

const props = withDefaults(defineProps<{
  label: string
  value: string
  variant?: DayStatVariant
  clickable?: boolean
  title?: string
}>(), {
  variant: 'default',
  clickable: false,
})

defineEmits<{
  click: []
}>()

const compactValue = computed(() => props.variant === 'holiday')

const variantClass = computed(() => {
  switch (props.variant) {
    case 'success': return 'day-stat-box--success'
    case 'warning': return 'day-stat-box--warning'
    case 'vacation': return 'day-stat-box--vacation'
    case 'holiday': return 'day-stat-box--holiday'
    default: return ''
  }
})
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

/* Variants tint the border only — background stays card, text stays ink. */
.day-stat-box { @apply flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg border border-stroke-muted shadow text-sm; }
.day-stat-box--clickable { @apply cursor-pointer transition-colors; }
.day-stat-box--clickable:hover { background-color: var(--color-card-hover); border-color: var(--color-stroke); }
.day-stat-box--clickable:focus { @apply outline-none ring-2 ring-focus-ring; }
.day-stat-box--success { border-color: var(--color-success); }
.day-stat-box--warning { border-color: var(--color-warning); }
.day-stat-box--vacation { border-color: var(--color-vacation); }
.day-stat-box--holiday { border-color: var(--color-success); }
.day-stat-label { @apply text-ink-secondary text-xs font-medium; }
.day-stat-value { @apply text-ink font-bold tabular-nums; }
.day-stat-value--compact { @apply text-xs font-medium; }
</style>
