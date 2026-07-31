<!-- A/B week layout: accordion. Temporary — see README.md -->
<template>
  <div class="space-y-2 pb-28">
    <div
      v-for="(status, index) in dayStatuses"
      :key="status.dayKey"
      class="rounded-lg border shadow-sm transition-all duration-200 overflow-hidden"
      :class="dayCardClass(status, index)"
    >
      <button
        v-if="expandedIndex !== index"
        type="button"
        class="w-full flex items-center gap-3 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
        @click="expandedIndex = index"
      >
        <span
          class="w-1.5 self-stretch rounded-full shrink-0"
          :class="tone(status).bar"
          aria-hidden="true"
        />
        <div class="w-28 shrink-0">
          <div class="text-sm font-semibold capitalize text-ink leading-tight">
            {{ status.weekdayShort }}
            <span class="text-ink-muted font-medium">{{ status.dayOfMonth }}</span>
            <span
              v-if="status.isToday"
              class="ml-1 text-xs text-accent-fg font-semibold"
            >oggi</span>
          </div>
        </div>

        <div class="flex-1 min-w-0 flex items-center gap-2">
          <div class="w-28 h-1.5 rounded-full bg-stroke-muted overflow-hidden shrink-0">
            <div
              class="h-full rounded-full transition-all"
              :class="fillProgressClass(status)"
              :style="{ width: `${Math.round(status.fillRatio * 100)}%` }"
            />
          </div>
          <span class="text-sm font-semibold tabular-nums text-ink shrink-0">
            {{ status.localHoursLabel }}
          </span>
          <span class="text-xs text-ink-muted tabular-nums shrink-0">
            · W {{ status.wethodHoursLabel }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <span
            v-if="status.holidayName"
            class="text-xs px-2 py-0.5 rounded border border-success text-success-text bg-success-soft"
          >Festivo</span>
          <span
            v-else-if="status.leaveHours > 0"
            class="text-xs px-2 py-0.5 rounded border border-accent text-accent-fg bg-accent-soft"
          >Assenze {{ status.leaveHoursLabel }}</span>
          <span
            v-if="status.unsyncedCount > 0"
            class="text-xs px-2 py-0.5 rounded border border-warning text-warning-text bg-warning-soft font-semibold"
          >Pending</span>
          <span
            v-if="status.needsAttention"
            class="text-xs px-2 py-0.5 rounded border border-warning text-warning-text bg-warning-soft"
          >Non completo</span>
        </div>
      </button>

      <div v-else class="p-2">
        <div class="mb-2 flex items-center justify-between gap-2">
          <span
            v-if="status.isToday"
            class="text-xs font-semibold text-accent-fg"
          >oggi</span>
          <span v-else />
          <button
            type="button"
            class="text-xs text-accent-fg hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
            @click="expandedIndex = -1"
          >
            Comprimi giorno
          </button>
        </div>
        <DayInputItem
          :ref="(element: any) => { dayRefs[index] = element }"
          :day="status.day"
          :focused="focused && focusedDayIndex === index"
          :wethod-hours="wethodHoursByDay[status.dayKey]"
          :leave-hours="leaveHoursByDay[status.dayKey]"
          :holiday-name="holidaysByDate[status.dayKey]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format as formatDate, isSameDay } from 'date-fns'
import type { WeekLayoutProps } from './types'
import { buildWeekDayStatus, fillProgressClass, healthToneClasses, type WeekDayStatus } from './useDayStatus'

const props = defineProps<WeekLayoutProps>()

const dayRefs = ref<Record<number, any>>({})
const expandedIndex = ref(0)

const dayStatuses = computed(() =>
  props.days.map(day => buildWeekDayStatus({
    day,
    today: props.today,
    wethodHours: props.wethodHoursByDay[formatDate(day, 'yyyy-MM-dd')],
    leaveHours: props.leaveHoursByDay[formatDate(day, 'yyyy-MM-dd')],
    holidayName: props.holidaysByDate[formatDate(day, 'yyyy-MM-dd')],
  })),
)

function tone(status: WeekDayStatus) {
  return healthToneClasses(status.health, status.needsAttention)
}

function dayCardClass(status: WeekDayStatus, index: number) {
  if (expandedIndex.value === index) {
    return 'border-accent bg-accent-soft day-card'
  }
  if (status.isToday) {
    return 'border-accent bg-card hover:bg-card-hover cursor-pointer'
  }
  return [tone(status).border, 'bg-card hover:bg-card-hover cursor-pointer']
}

watch(
  () => [props.days, props.today] as const,
  () => {
    const todayIndex = props.days.findIndex(day => isSameDay(day, props.today))
    expandedIndex.value = todayIndex >= 0 ? todayIndex : 0
  },
  { immediate: true },
)

defineExpose({
  dayRefs,
  getDayComponent: (index: number) => dayRefs.value[index],
})
</script>
