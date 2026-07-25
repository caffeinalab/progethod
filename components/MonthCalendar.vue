<template>
  <div class="relative inline-block">
    <span
      class="stat-label capitalize cursor-pointer transition-colors"
      @click.stop="toggle"
    >
      {{ label }}:
    </span>
    <div
      v-if="open"
      class="absolute left-0 top-full mt-2 z-50 bg-card rounded-lg shadow-xl border border-stroke-muted p-4 w-72"
      @click.stop
    >
      <div class="flex items-center justify-between mb-3">
        <button
          class="p-1 rounded hover:bg-card-hover transition-colors text-ink-muted"
          @click="monthOffset--"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="text-sm font-semibold text-ink capitalize">
          {{ displayedMonthLabel }}
        </div>
        <button
          class="p-1 rounded hover:bg-card-hover transition-colors text-ink-muted"
          @click="monthOffset++"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs">
        <div
          v-for="dayName in weekdayHeaders"
          :key="dayName"
          class="font-semibold text-ink-faint pb-1"
        >
          {{ dayName }}
        </div>
        <template v-for="cell in calendarCells" :key="cell.key">
          <div
            class="w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium mx-auto"
            :class="[cellClasses(cell), isClickable(cell) ? 'cursor-pointer hover:ring-2 hover:ring-focus-ring transition-shadow' : '']"
            :title="cellTitle(cell)"
            @click="onCellClick(cell)"
          >
            <span v-if="cell.dayNumber">{{ cell.dayNumber }}</span>
          </div>
        </template>
      </div>
      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-stroke-muted text-xs text-ink-muted">
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm cal-cell--success" />
          8h
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm cal-cell--warning" />
          &lt; 8h
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm cal-cell--danger" />
          0h
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm cal-cell--none border border-stroke-muted" />
          {{ $t('month_calendar.no_data') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { startOfMonth, endOfMonth, isSameDay, addMonths, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { WEEKDAY_HEADERS_IT, buildMonthGridCells } from '~/utils/calendarGrid'

const { t: $t } = useI18n()
const { today } = useLiveToday()

const props = defineProps({
  referenceDate: { type: Date, required: true },
  trackedHours: { type: Array, default: () => [] },
  holidays: { type: Array, default: () => [] },
  label: { type: String, required: true },
})

const emit = defineEmits(['month-changed', 'day-click'])

const open = ref(false)
const monthOffset = ref(0)

const displayedMonth = computed(() => {
  if (monthOffset.value === 0) return props.referenceDate
  return addMonths(startOfMonth(props.referenceDate), monthOffset.value)
})

const displayedMonthLabel = computed(() => {
  return format(displayedMonth.value, 'MMMM yyyy', { locale: it })
})

const weekdayHeaders = WEEKDAY_HEADERS_IT

const trackedByDate = computed(() => {
  const map = {}
  for (const entry of props.trackedHours) {
    map[entry.date] = entry.value
  }
  return map
})

const holidaysByDate = computed(() => {
  const map = {}
  for (const holiday of props.holidays) {
    map[holiday.date] = holiday.name
  }
  return map
})

const calendarCells = computed(() => {
  return buildMonthGridCells(displayedMonth.value).map((cell) => {
    if (cell.dayNumber === null) {
      return { key: cell.key, dayNumber: null, isWeekend: false, tracked: null }
    }
    const holidayName = holidaysByDate.value[cell.dateKey]
    return {
      key: cell.key,
      dayNumber: cell.dayNumber,
      isWeekend: cell.isWeekend,
      isHoliday: !!holidayName,
      holidayName: holidayName || '',
      isToday: isSameDay(cell.date, today.value),
      isFuture: cell.date > today.value,
      tracked: trackedByDate.value[cell.dateKey] ?? null,
      dateKey: cell.dateKey,
    }
  })
})

watch(monthOffset, () => {
  const month = displayedMonth.value
  emit('month-changed', {
    from: format(startOfMonth(month), 'yyyy-MM-dd'),
    to: format(endOfMonth(month), 'yyyy-MM-dd'),
  })
})

function handleKeydown(event) {
  if (!open.value) return
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      event.stopImmediatePropagation()
      monthOffset.value--
      break
    case 'ArrowRight':
      event.preventDefault()
      event.stopImmediatePropagation()
      monthOffset.value++
      break
    case 'Escape':
      event.preventDefault()
      event.stopImmediatePropagation()
      close()
      break
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown, true)
    document.addEventListener('click', handleOutsideClick)
  } else {
    document.removeEventListener('keydown', handleKeydown, true)
    document.removeEventListener('click', handleOutsideClick)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown, true)
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick() {
  close()
}

function toggle() {
  open.value = !open.value
  if (open.value) monthOffset.value = 0
}

function close() {
  open.value = false
}

function isClickable(cell) {
  return cell.dayNumber && !cell.isWeekend && !cell.isHoliday
}

function onCellClick(cell) {
  if (isClickable(cell)) {
    emit('day-click', cell.dateKey)
    close()
  }
}

function trackedColorClasses(tracked) {
  if (tracked === null || tracked === undefined) return 'cal-cell--none'
  if (tracked === 0) return 'cal-cell--danger'
  if (tracked >= 8) return 'cal-cell--success'
  return 'cal-cell--warning'
}

function cellClasses(cell) {
  if (!cell.dayNumber) return ''
  if (cell.isWeekend || cell.isHoliday) return 'text-ink-disabled'
  if (cell.isFuture) return 'text-ink-faint bg-card-dim'
  if (cell.isToday) {
    return trackedColorClasses(cell.tracked) + ' ring-2 ring-focus-ring ring-offset-1 ring-offset-card'
  }
  return trackedColorClasses(cell.tracked)
}

function cellTitle(cell) {
  if (!cell.dayNumber || cell.isWeekend) return ''
  if (cell.isHoliday) return cell.holidayName
  if (cell.tracked === null || cell.tracked === undefined) return $t('month_calendar.no_data')
  return `${cell.tracked}h`
}

defineExpose({ toggle })
</script>
