<template>
  <div>
    <div class="flex gap-2">
      <button
        v-for="option in presetOptions"
        :key="option"
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
        :class="hours === option && customHours === null
          ? 'border-accent bg-accent-soft text-accent-fg'
          : 'border-stroke-muted text-ink-muted hover:bg-card-hover'"
        @click="selectPreset(option)"
      >
        {{ option }}h
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
        :class="customHours !== null
          ? 'border-accent bg-accent-soft text-accent-fg'
          : 'border-stroke-muted text-ink-muted hover:bg-card-hover'"
        @click="enableCustom"
      >
        {{ customLabel }}
      </button>
    </div>
    <div v-if="customHours !== null" class="mt-2 flex items-center gap-2">
      <div class="inline-flex items-stretch rounded-lg border border-stroke overflow-hidden">
        <button
          type="button"
          class="px-2.5 flex items-center text-ink-muted hover:bg-card-hover hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="customHours <= min"
          @click="nudge(-step)"
        >
          <IconMinus :size="14" />
        </button>
        <input
          :value="customHours"
          type="number"
          :min="min"
          :max="max"
          :step="step"
          class="custom-hours-input w-12 text-center text-sm font-medium bg-input text-ink py-2 border-x border-stroke focus:outline-none"
          @input="onCustomInput"
        >
        <button
          type="button"
          class="px-2.5 flex items-center text-ink-muted hover:bg-card-hover hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="customHours >= max"
          @click="nudge(step)"
        >
          <IconPlus :size="14" />
        </button>
      </div>
      <span v-if="customHint" class="text-xs text-ink-muted">{{ customHint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconMinus, IconPlus } from '@tabler/icons-vue'

const props = withDefaults(defineProps<{
  hours: number | null
  customHours: number | null
  customLabel: string
  customHint?: string
  presetOptions?: number[]
  min?: number
  max?: number
  step?: number
}>(), {
  presetOptions: () => [4, 8],
  min: 0.5,
  max: 8,
  step: 0.5,
})

const emit = defineEmits<{
  'update:hours': [value: number]
  'update:customHours': [value: number | null]
}>()

function selectPreset(option: number) {
  emit('update:customHours', null)
  emit('update:hours', option)
}

function enableCustom() {
  const next = props.customHours ?? 1
  emit('update:customHours', next)
  emit('update:hours', next)
}

function nudge(delta: number) {
  if (props.customHours === null) return
  const next = Math.min(props.max, Math.max(props.min, props.customHours + delta))
  emit('update:customHours', next)
  emit('update:hours', next)
}

function onCustomInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update:customHours', value)
  emit('update:hours', value)
}
</script>

<style scoped>
.custom-hours-input::-webkit-inner-spin-button,
.custom-hours-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.custom-hours-input { -moz-appearance: textfield; appearance: textfield; }
</style>
