<template>
  <div class="mb-3">
    <div class="flex items-center gap-2">
      <IconButton
        variant="ghost"
        :title="$t('activity_picker.previous_day')"
        @click="shift(-1)"
      >
        <IconChevronLeft :size="18" />
      </IconButton>
      <span
        class="flex-1 text-center text-sm font-semibold capitalize"
        :class="isTargetDay ? 'text-ink' : 'text-accent-fg'"
      >
        {{ formatDayLabel(modelValue) }}
      </span>
      <IconButton
        variant="ghost"
        :title="$t('activity_picker.next_day')"
        :disabled="isAtLatestDay"
        @click="shift(1)"
      >
        <IconChevronRight :size="18" />
      </IconButton>
    </div>
    <p v-if="!isTargetDay" class="flex items-center justify-center gap-2 mt-1 text-xs text-ink-secondary">
      <span>{{ $t('activity_picker.adding_to', { day: formatDayLabel(targetDay) }) }}</span>
      <button
        type="button"
        class="min-h-6 px-1.5 rounded font-semibold text-accent-fg hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        @click="emit('update:modelValue', targetDay)"
      >
        {{ $t('activity_picker.back_to_day') }}
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import { addDays, format as formatDate } from 'date-fns'
import { it } from 'date-fns/locale'

const props = defineProps<{
  modelValue: string
  targetDay: string
}>()

const emit = defineEmits<{
  'update:modelValue': [day: string]
}>()

const { today } = useLiveToday()

const isTargetDay = computed(() => props.modelValue === props.targetDay)
// Activity cannot exist in the future, but a future target day must stay reachable
const latestDay = computed(() => {
  const todayId = formatDate(today.value, 'yyyy-MM-dd')
  return props.targetDay > todayId ? props.targetDay : todayId
})
const isAtLatestDay = computed(() => props.modelValue >= latestDay.value)

function parseDay(day: string) {
  return new Date(day + 'T00:00:00')
}

function formatDayLabel(day: string) {
  return formatDate(parseDay(day), 'EEE d MMM', { locale: it })
}

function shift(offset: number) {
  if (offset > 0 && isAtLatestDay.value) return
  emit('update:modelValue', formatDate(addDays(parseDay(props.modelValue), offset), 'yyyy-MM-dd'))
}
</script>
