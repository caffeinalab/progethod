<!-- A/B week layout: day rail. Temporary — see README.md -->
<template>
  <div class="pb-28">
    <div class="grid grid-cols-7 gap-1.5 mb-4">
      <button
        v-for="(status, index) in dayStatuses"
        :key="status.dayKey"
        type="button"
        class="flex flex-col gap-1 rounded-lg border px-2 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-page"
        :class="dayButtonClass(status, index)"
        @click="selectedIndex = index"
      >
        <div class="flex items-baseline gap-1 min-w-0">
          <span
            class="min-w-0 truncate text-sm font-semibold leading-none tracking-tight"
            :class="titleClass(status, index)"
          >
            <span class="capitalize font-medium" :class="weekdayClass(index)">{{ status.weekdayShort }}</span>
            {{ status.dayOfMonth }}
          </span>
          <span
            v-if="status.isToday"
            class="shrink-0 text-xs font-semibold text-accent-fg leading-none"
          >oggi</span>
          <span
            class="ml-auto shrink-0 text-xs font-semibold tabular-nums leading-none"
            :class="selectedIndex === index ? 'text-accent-fg' : 'text-ink-secondary'"
          >
            {{ status.wethodHoursLabel }}
          </span>
        </div>

        <div class="h-1 w-full rounded-full bg-stroke-muted overflow-hidden">
          <div
            class="h-full rounded-full"
            :class="selectedIndex === index ? 'bg-accent' : fillProgressClass(status)"
            :style="{ width: `${Math.round(status.fillRatio * 100)}%` }"
          />
        </div>

        <div
          v-if="footerLabel(status)"
          class="text-xs font-medium leading-none"
          :class="selectedIndex === index ? 'text-accent-fg' : footerClass(status)"
        >
          {{ footerLabel(status) }}
        </div>
      </button>
    </div>

    <div
      v-if="selectedStatus"
      class="day-card w-full rounded-lg border p-2 shadow-sm"
      :class="selectedStatus.isToday ? 'border-accent bg-accent-soft' : 'border-stroke'"
    >
      <DayInputItem
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

function titleClass(status: WeekDayStatus, index: number) {
  if (selectedIndex.value === index) { return 'text-accent-fg' }
  if (status.isWeekend) { return 'text-ink-muted' }
  return 'text-ink'
}

function weekdayClass(index: number) {
  if (selectedIndex.value === index) { return 'text-accent-fg' }
  return 'text-ink-muted'
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
