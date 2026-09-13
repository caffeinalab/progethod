<!-- A/B week layout: day rail. Temporary — see README.md -->
<template>
  <div class="pb-28">
    <div class="grid grid-cols-7 gap-1.5 mb-4">
      <button
        v-for="(status, index) in dayStatuses"
        :key="status.dayKey"
        type="button"
        class="flex flex-col overflow-hidden rounded-lg border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-page"
        :class="dayButtonClass(status, index)"
        :aria-current="status.isToday ? 'date' : undefined"
        @click="selectedIndex = index"
      >
        <div class="flex items-center gap-1.5 px-2 pt-1.5">
          <span
            class="min-w-0 truncate text-xs font-semibold uppercase tracking-wide leading-none"
            :class="weekdayClass(status, index)"
          >{{ status.weekdayShort }}</span>
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums leading-none"
            :class="dayNumberClass(status, index)"
          >{{ status.dayOfMonth }}</span>
          <span
            class="ml-auto shrink-0 text-xs font-semibold tabular-nums leading-none"
            :class="hoursClass(status, index)"
          >{{ status.wethodHoursLabel }}</span>
        </div>

        <div class="px-2 pt-0.5 pb-1 text-left">
          <span
            class="block min-h-3 truncate text-xs font-medium leading-none"
            :class="selectedIndex === index ? 'text-accent-fg' : footerClass(status)"
          >{{ footerLabel(status) }}</span>
        </div>

        <div
          class="h-1 w-full"
          :class="status.fillRatio > 0 ? 'bg-stroke-muted' : 'bg-transparent'"
        >
          <div
            class="h-full"
            :class="selectedIndex === index ? 'bg-accent' : fillProgressClass(status)"
            :style="{ width: `${Math.round(status.fillRatio * 100)}%` }"
          />
        </div>
      </button>
    </div>

    <div
      v-if="selectedStatus"
      class="day-card w-full rounded-lg border p-4 shadow-sm"
      :class="selectedStatus.isToday ? 'border-accent bg-accent-soft' : 'border-stroke'"
    >
      <DayInputItem
        :key="selectedStatus.dayKey"
        :ref="(element: any) => { dayRefs[selectedIndex] = element }"
        :day="selectedStatus.day"
        :focused="focused && focusedDayIndex === selectedIndex"
        :wethod-hours="wethodHoursByDay[selectedStatus.dayKey]"
        :leave-hours="leaveHoursByDay[selectedStatus.dayKey]"
        :holiday-name="holidaysByDate[selectedStatus.dayKey]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { format as formatDate, isSameDay } from 'date-fns'
import type { WeekLayoutProps } from './types'
import { buildWeekDayStatus, fillProgressClass, type WeekDayStatus } from './useDayStatus'

const props = defineProps<WeekLayoutProps>()

const dayRefs = ref<Record<number, any>>({})
const selectedIndex = ref(0)

const dayStatuses = computed(() =>
  props.days.map(day => buildWeekDayStatus({
    day,
    today: props.today,
    wethodHours: props.wethodHoursByDay[formatDate(day, 'yyyy-MM-dd')],
    leaveHours: props.leaveHoursByDay[formatDate(day, 'yyyy-MM-dd')],
    holidayName: props.holidaysByDate[formatDate(day, 'yyyy-MM-dd')],
  })),
)

const selectedStatus = computed(() => dayStatuses.value[selectedIndex.value] || null)

function dayButtonClass(status: WeekDayStatus, index: number) {
  if (selectedIndex.value === index) {
    return 'border-accent bg-accent-soft'
  }
  if (status.isToday) {
    return 'border-accent bg-card hover:bg-card-hover'
  }
  return 'border-stroke bg-card hover:bg-card-hover'
}

function weekdayClass(status: WeekDayStatus, index: number) {
  if (selectedIndex.value === index) { return 'text-accent-fg' }
  return 'text-ink-muted'
}

function dayNumberClass(status: WeekDayStatus, index: number) {
  // Today gets a filled accent disc, calendar-style — this replaces the old "oggi" badge.
  if (status.isToday) { return 'bg-accent text-ink-inverse' }
  if (selectedIndex.value === index) { return 'text-accent-fg' }
  if (status.isWeekend) { return 'text-ink-muted' }
  return 'text-ink'
}

function hoursClass(status: WeekDayStatus, index: number) {
  if (selectedIndex.value === index) { return 'text-accent-fg' }
  if (status.health === 'weekend' || status.health === 'empty') { return 'text-ink-muted' }
  return 'text-ink-secondary'
}

function footerLabel(status: WeekDayStatus) {
  if (status.unsyncedCount > 0) { return 'Pending' }
  if (status.holidayName) { return 'Festivo' }
  if (status.leaveHours > 0) { return 'Assenze' }
  if (status.needsAttention) { return 'Non completo' }
  return ''
}

function footerClass(status: WeekDayStatus) {
  if (status.unsyncedCount > 0 || status.needsAttention) { return 'text-warning-text' }
  return 'text-ink-muted'
}

watch(
  () => [props.days, props.today] as const,
  () => {
    const todayIndex = props.days.findIndex(day => isSameDay(day, props.today))
    selectedIndex.value = todayIndex >= 0 ? todayIndex : 0
  },
  { immediate: true },
)

watch(
  () => props.focusedDayIndex,
  (index) => {
    if (typeof index === 'number' && index >= 0) { selectedIndex.value = index }
  },
)

defineExpose({
  dayRefs,
  getDayComponent: (index: number) => dayRefs.value[index],
})
</script>
