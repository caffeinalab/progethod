<template>
  <div v-click-outside="close" class="relative inline-block">
    <button
      class="capitalize hover:text-indigo-600 hover:underline underline-offset-2 cursor-pointer transition-colors"
      @click="open = !open"
    >
      {{ label }}:
    </button>
    <div
      v-if="open"
      class="absolute left-0 top-full mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72"
    >
      <div class="text-sm font-semibold text-gray-700 mb-3 capitalize text-center">
        {{ label }}
      </div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs">
        <div
          v-for="dayName in weekdayHeaders"
          :key="dayName"
          class="font-semibold text-gray-400 pb-1"
        >
          {{ dayName }}
        </div>
        <template v-for="cell in calendarCells">
          <div
            :key="cell.key"
            class="w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium mx-auto"
            :class="cellClasses(cell)"
            :title="cellTitle(cell)"
          >
            <span v-if="cell.dayNumber">{{ cell.dayNumber }}</span>
          </div>
        </template>
      </div>
      <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm bg-green-200 border border-green-300" />
          8h
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm bg-amber-200 border border-amber-300" />
          &lt; 8h
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
          {{ $t('month_calendar.no_data') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { startOfMonth, endOfMonth, getDay, isSameDay } from 'date-fns'

export default {
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
    label: {
      type: String,
      required: true
    }
  },
  data: () => ({
    open: false
  }),
  computed: {
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
    calendarCells () {
      const monthStart = startOfMonth(this.referenceDate)
      const monthEnd = endOfMonth(this.referenceDate)

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
        const isToday = isSameDay(current, new Date())
        const isFuture = current > new Date()

        cells.push({
          key: dateKey,
          dayNumber: current.getDate(),
          isWeekend,
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
  methods: {
    close () {
      this.open = false
    },
    cellClasses (cell) {
      if (!cell.dayNumber) {
        return ''
      }
      if (cell.isWeekend) {
        return 'text-gray-300'
      }
      if (cell.isFuture) {
        return 'text-gray-400 bg-gray-50'
      }
      if (cell.isToday) {
        const base = this.trackedColorClasses(cell.tracked)
        return base + ' ring-2 ring-indigo-400 ring-offset-1'
      }
      return this.trackedColorClasses(cell.tracked)
    },
    trackedColorClasses (tracked) {
      if (tracked === null || tracked === undefined) {
        return 'bg-gray-100 text-gray-500'
      }
      if (tracked >= 8) {
        return 'bg-green-200 text-green-800 font-semibold'
      }
      return 'bg-amber-200 text-amber-800 font-semibold'
    },
    cellTitle (cell) {
      if (!cell.dayNumber || cell.isWeekend) {
        return ''
      }
      if (cell.tracked === null || cell.tracked === undefined) {
        return this.$t('month_calendar.no_data')
      }
      return `${cell.tracked}h`
    }
  }
}
</script>
