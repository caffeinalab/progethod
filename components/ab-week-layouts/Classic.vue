<!-- A/B week layout: classic (all days open). Temporary — see README.md -->
<template>
  <div>
    <div
      v-for="(day, index) of days"
      :key="day.toString()"
      class="day-card w-full rounded-lg border mb-5 p-2 shadow-sm transition-shadow duration-150"
      :class="dayCardClasses(day, index)"
    >
      <DayInputItem
        :ref="(element: any) => { dayRefs[index] = element }"
        :day="day"
        :focused="focused && insideDay && focusedDayIndex === index"
        :wethod-hours="wethodHoursByDay[formatDate(day, 'yyyy-MM-dd')]"
        :leave-hours="leaveHoursByDay[formatDate(day, 'yyyy-MM-dd')]"
        :holiday-name="holidaysByDate[formatDate(day, 'yyyy-MM-dd')]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { format as formatDate, isSameDay } from 'date-fns'
import type { WeekLayoutProps } from './types'

const props = defineProps<WeekLayoutProps>()

const dayRefs = ref<Record<number, any>>({})

function dayCardClasses(day: Date, index: number): string[] {
  const classes: string[] = []
  if (isSameDay(day, props.today)) { classes.push('border-accent bg-accent-soft') }
  else { classes.push('border-stroke') }
  if (props.navigating && props.focusedDayIndex === index && !props.insideDay) {
    classes.push('ring-2 ring-focus-ring ring-offset-2 ring-offset-page')
  }
  return classes
}

defineExpose({
  dayRefs,
  getDayComponent: (index: number) => dayRefs.value[index],
})
</script>
