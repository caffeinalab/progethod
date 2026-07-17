<template>
  <div v-click-outside="close" class="relative inline-block">
    <span
      class="stat-label capitalize cursor-pointer hover:text-accent-fg transition-colors"
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
          class="p-1 rounded hover:bg-card-hover transition-colors text-ink-muted hover:text-ink"
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
          class="p-1 rounded hover:bg-card-hover transition-colors text-ink-muted hover:text-ink"
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
        <template v-for="cell in calendarCells">
          <div
            :key="cell.key"
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

<script>
import { startOfMonth, endOfMonth, getDay, isSameDay } from 'date-fns'
import liveToday from '~/mixins/liveToday'

export default {
  mixins: [liveToday],
  directives: {
    clickOutside: {
      bind (element, binding) {
        element._clickOutsideHandler = (event) => {
          if (!element.contains(event.target)) {
            binding.value(event)
          }
        }
        setTimeout(() => {
          document.addEventListener('click', element._clickOutsideHandler)
        }, 0)
      },
      unbind (element) {
        document.removeEventListener('click', element._clickOutsideHandler)
      }
    }
  },
  props: {
    referenceDate: {
      type: Date,
      required: true
    },
    trackedHours: {
      type: Array,
      default: () => []
    },
    holidays: {
      type: Array,
      default: () => []
    },
    label: {
      type: String,
      required: true
    }
  },
  data: () => ({
    open: false,
    monthOffset: 0
  }),
  computed: {
    displayedMonth () {
      if (this.monthOffset === 0) {
        return this.referenceDate
      }
      return this.$dateFns.addMonths(startOfMonth(this.referenceDate), this.monthOffset)
    },
    displayedMonthLabel () {
      return this.$dateFns.format(this.displayedMonth, 'MMMM yyyy')
    },
    weekdayHeaders () {
      return ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']
    },
    trackedByDate () {
      const map = {}
      for (const entry of this.trackedHours) {
        map[entry.date] = entry.value
      }
      return map
    },
    holidaysByDate () {
      const map = {}
      for (const holiday of this.holidays) {
        map[holiday.date] = holiday.name
      }
      return map
    },
    calendarCells () {
      const monthStart = startOfMonth(this.displayedMonth)
      const monthEnd = endOfMonth(this.displayedMonth)

      const startDow = getDay(monthStart)
      const leadingBlanks = startDow === 0 ? 6 : startDow - 1

      const cells = []

      for (let blank = 0; blank < leadingBlanks; blank++) {
        cells.push({ key: `blank-${blank}`, dayNumber: null, isWeekend: false, tracked: null })
      }

      let current = new Date(monthStart)
      while (current <= monthEnd) {
        const dow = getDay(current)
        const isWeekend = dow === 0 || dow === 6
        const dateKey = this.$dateFns.format(current, 'yyyy-MM-dd')
        const isToday = isSameDay(current, this.today)
        const isFuture = current > this.today
        const holidayName = this.holidaysByDate[dateKey]

        cells.push({
          key: dateKey,
          dayNumber: current.getDate(),
          isWeekend,
          isHoliday: !!holidayName,
          holidayName: holidayName || '',
          isToday,
          isFuture,
          tracked: this.trackedByDate[dateKey] ?? null,
          dateKey
        })

        current = this.$dateFns.addDays(current, 1)
      }

      return cells
    }
  },
  watch: {
    monthOffset () {
      const month = this.displayedMonth
      this.$emit('month-changed', {
        from: this.$dateFns.format(startOfMonth(month), 'yyyy-MM-dd'),
        to: this.$dateFns.format(endOfMonth(month), 'yyyy-MM-dd')
      })
    },
    open (isOpen) {
      if (isOpen) {
        document.addEventListener('keydown', this.handleKeydown, true)
      } else {
        document.removeEventListener('keydown', this.handleKeydown, true)
      }
    }
  },
  beforeDestroy () {
    document.removeEventListener('keydown', this.handleKeydown, true)
  },
  methods: {
    handleKeydown (event) {
      if (!this.open) { return }
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          event.stopImmediatePropagation()
          this.monthOffset--
          break
        case 'ArrowRight':
          event.preventDefault()
          event.stopImmediatePropagation()
          this.monthOffset++
          break
        case 'Escape':
          event.preventDefault()
          event.stopImmediatePropagation()
          this.close()
          break
      }
    },
    toggle () {
      this.open = !this.open
      if (this.open) {
        this.monthOffset = 0
      }
    },
    close () {
      this.open = false
    },
    isClickable (cell) {
      return cell.dayNumber && !cell.isWeekend && !cell.isHoliday
    },
    onCellClick (cell) {
      if (this.isClickable(cell)) {
        this.$emit('day-click', cell.dateKey)
        this.close()
      }
    },
    cellClasses (cell) {
      if (!cell.dayNumber) {
        return ''
      }
      if (cell.isWeekend || cell.isHoliday) {
        return 'text-ink-disabled'
      }
      if (cell.isFuture) {
        return 'text-ink-faint bg-card-dim'
      }
      if (cell.isToday) {
        const base = this.trackedColorClasses(cell.tracked)
        return base + ' ring-2 ring-focus-ring ring-offset-1 ring-offset-card'
      }
      return this.trackedColorClasses(cell.tracked)
    },
    trackedColorClasses (tracked) {
      if (tracked === null || tracked === undefined) {
        return 'cal-cell--none'
      }
      if (tracked === 0) {
        return 'cal-cell--danger'
      }
      if (tracked >= 8) {
        return 'cal-cell--success'
      }
      return 'cal-cell--warning'
    },
    cellTitle (cell) {
      if (!cell.dayNumber || cell.isWeekend) {
        return ''
      }
      if (cell.isHoliday) {
        return cell.holidayName
      }
      if (cell.tracked === null || cell.tracked === undefined) {
        return this.$t('month_calendar.no_data')
      }
      return `${cell.tracked}h`
    }
  }
}
</script>
