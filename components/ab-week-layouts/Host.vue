<!-- A/B week layouts host. Temporary — see README.md -->
<template>
  <AbWeekLayoutsClassic
    v-if="layout === 'classic'"
    ref="activeLayoutRef"
    v-bind="layoutProps"
  />
  <AbWeekLayoutsAccordion
    v-else-if="layout === 'accordion'"
    ref="activeLayoutRef"
    v-bind="layoutProps"
  />
  <AbWeekLayoutsRail
    v-else-if="layout === 'rail'"
    ref="activeLayoutRef"
    v-bind="layoutProps"
  />
  <AbWeekLayoutsSplit
    v-else
    ref="activeLayoutRef"
    v-bind="layoutProps"
  />
</template>

<script setup lang="ts">
import type { WeekLayoutKey, WeekLayoutProps } from './types'

const props = defineProps<WeekLayoutProps & { layout: WeekLayoutKey }>()

const activeLayoutRef = ref<{ getDayComponent?: (index: number) => any } | null>(null)

const layoutProps = computed(() => ({
  days: props.days,
  today: props.today,
  wethodHoursByDay: props.wethodHoursByDay,
  leaveHoursByDay: props.leaveHoursByDay,
  holidaysByDate: props.holidaysByDate,
  focused: props.focused,
  focusedDayIndex: props.focusedDayIndex,
  navigating: props.navigating,
  insideDay: props.insideDay,
}))

defineExpose({
  getDayComponent: (index: number) => activeLayoutRef.value?.getDayComponent?.(index),
})
</script>
