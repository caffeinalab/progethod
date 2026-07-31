<!-- A/B week layout: split pane. Temporary — see README.md -->
<template>
  <div class="pb-28">
    <div class="flex flex-col lg:flex-row gap-4 items-start">
      <aside class="w-full lg:w-64 shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto space-y-1">
        <button
          v-for="(status, index) in dayStatuses"
          :key="status.dayKey"
          type="button"
          class="w-full flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          :class="dayButtonClass(status, index)"
          @click="selectedIndex = index"
        >
          <div
            class="relative w-9 h-9 shrink-0 rounded-full p-[2.5px]"
            :style="ringStyle(status, index)"
            aria-hidden="true"
          >
            <span
              class="flex h-full w-full items-center justify-center rounded-full text-xs font-semibold tabular-nums leading-none"
              :class="ringInnerClass(status, index)"
            >
              {{ status.dayOfMonth }}
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-semibold capitalize text-ink truncate">
                {{ status.weekdayShort }}
              </span>
              <span
                v-if="status.isToday"
                class="text-xs font-semibold text-accent-fg shrink-0"
              >oggi</span>
            </div>
            <div class="text-xs truncate" :class="sideLabelClass(status)">
              {{ sideLabel(status) }}
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-sm font-semibold tabular-nums text-ink">
              {{ primaryHours(status) }}
            </div>
            <div
              v-if="status.unsyncedCount > 0"
              class="text-xs font-semibold text-warning-text"
            >
              Pending
            </div>
          </div>
        </button>
      </aside>

      <div
        v-if="selectedStatus"
        class="day-card flex-1 w-full min-w-0 rounded-lg border p-2 shadow-sm"
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
  </div>
</template>

<script setup lang="ts">
import { format as formatDate, isSameDay } from 'date-fns'
import type { WeekLayoutProps } from './types'
import { buildWeekDayStatus, fillProgressColor, type WeekDayStatus } from './useDayStatus'

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
    return 'border-accent bg-accent-soft shadow-sm'
  }
  if (status.isToday) {
    return 'border-accent bg-card hover:bg-card-hover'
  }
  if (status.needsAttention) {
    return 'border-transparent bg-warning-soft hover:bg-card-hover'
  }
  return 'border-transparent bg-card hover:bg-card-hover'
}

function ringInnerClass(status: WeekDayStatus, index: number) {
  // Soft washes are translucent — they let the progress ring bleed under the day number.
  if (selectedIndex.value === index) { return 'bg-accent text-ink-inverse' }
  if (status.needsAttention) { return 'bg-card text-ink' }
  return 'bg-card text-ink'
}

function ringStyle(status: WeekDayStatus, index: number) {
  // Selected day already uses a solid accent disc — skip the progress ring outline.
  if (selectedIndex.value === index) {
    return { background: 'var(--color-accent)' }
  }
  const fillDegrees = Math.round(status.fillRatio * 360)
  const color = fillProgressColor(status)
  return {
    background: `conic-gradient(from -90deg, ${color} 0deg ${fillDegrees}deg, var(--color-stroke-muted) ${fillDegrees}deg 360deg)`,
  }
}

function primaryHours(status: WeekDayStatus) {
  if (status.leaveHours >= 8) { return status.leaveHoursLabel }
  if (status.holidayName) { return '8h' }
  return status.localHoursLabel
}

function sideLabel(status: WeekDayStatus) {
  // Pending is shown under the hours column — avoid duplicating it here
  if (status.holidayName) { return status.holidayName }
  if (status.leaveHours > 0) { return `Assenze ${status.leaveHoursLabel}` }
  if (status.unsyncedCount > 0) {
    return status.needsAttention ? 'Non completo' : ''
  }
  return status.statusLabel
}

/** Match the Pending column: warning when unsynced/incomplete, otherwise muted. */
function sideLabelClass(status: WeekDayStatus) {
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
