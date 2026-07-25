<template>
  <div class="flex gap-2">
    <button
      type="button"
      class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
      :class="modelValue === vacationId
        ? 'border-vacation bg-vacation-soft text-vacation-text'
        : 'border-stroke-muted text-ink-muted hover:bg-card-hover'"
      @click="emit('update:modelValue', vacationId)"
    >
      {{ vacationLabel }}
    </button>
    <button
      type="button"
      class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
      :class="modelValue === leavesId
        ? 'border-vacation bg-vacation-soft text-vacation-text'
        : 'border-stroke-muted text-ink-muted hover:bg-card-hover'"
      @click="emit('update:modelValue', leavesId)"
    >
      {{ leavesLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: number | null
  vacationId?: number
  leavesId?: number
  vacationLabel: string
  leavesLabel: string
}>(), {
  vacationId: 83,
  leavesId: 90,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()
</script>
