<template>
  <button
    type="button"
    class="icon-btn"
    :class="rootClass"
    :disabled="disabled"
    :title="title"
    :aria-label="ariaLabel || title"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'default' | 'add' | 'danger' | 'submit' | 'gcal' | 'jira' | 'gitlab' | 'ghost' | 'ghost-danger'
  disabled?: boolean
  title?: string
  ariaLabel?: string
}>(), {
  variant: 'default',
  disabled: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const rootClass = computed(() => {
  if (props.variant === 'ghost' || props.variant === 'ghost-danger') {
    return `icon-btn--${props.variant}`
  }
  return [`icon-btn--toolbar`, `icon-btn--${props.variant}`, props.disabled ? 'is-disabled' : '']
})
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

.icon-btn {
  @apply relative flex items-center justify-center transition-all duration-150 ease-in-out cursor-pointer focus:outline-none;
}

.icon-btn--toolbar {
  @apply w-10 h-10 rounded-lg border border-stroke-muted bg-card shadow focus:ring-2 focus:ring-focus-ring focus:ring-offset-1;
  color: var(--color-ink-secondary);
}

.icon-btn--toolbar:not(.is-disabled):hover {
  background-color: var(--color-card-hover);
  border-color: var(--color-stroke);
}

.icon-btn--toolbar.is-disabled {
  background-color: var(--color-card-dim);
  color: var(--color-ink-disabled);
  cursor: default;
}

.icon-btn--add { color: var(--color-accent-fg); }
.icon-btn--danger { color: var(--color-ink-muted); }
.icon-btn--danger:not(.is-disabled):hover { border-color: var(--color-danger); }

.icon-btn--submit:not(.is-disabled) {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-ink-inverse);
}
.icon-btn--submit:not(.is-disabled):hover {
  background-color: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.icon-btn--gcal { color: #4285F4; }
.icon-btn--jira { color: #0052CC; }
.icon-btn--gitlab { color: #FC6D26; }
:global(.dark) .icon-btn--gcal { color: #6ea8ff; }
:global(.dark) .icon-btn--jira { color: #5b9bff; }
:global(.dark) .icon-btn--gitlab { color: #ff8f56; }

.icon-btn--ghost,
.icon-btn--ghost-danger {
  @apply p-1.5 rounded transition-colors cursor-pointer;
  color: var(--color-ink-faint);
  border: none;
  background: transparent;
  box-shadow: none;
  width: auto;
  height: auto;
}
.icon-btn--ghost:hover { color: var(--color-accent-fg); }
.icon-btn--ghost-danger:hover { color: var(--color-danger); }
</style>
