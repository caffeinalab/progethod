<template>
  <div class="pt-20">
    <!-- Page title starts -->

    <alert v-if="isTokenExpired" :message="$t('session_expired')" level="warning" />
    <div class="my-6 lg:my-12 container px-6 mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-gray-300">
      <div>
        <div class="flex items-center gap-3">
          <button
            class="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
            :title="$t('previous_week')"
            @click="weekOffset--"
          >
            <chevron-left-icon size="24" />
          </button>
          <h4 class="text-2xl font-bold leading-tight text-gray-800">
            {{ weekLabel }}
          </h4>
          <button
            class="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
            :title="$t('next_week')"
            @click="weekOffset++"
          >
            <chevron-right-icon size="24" />
          </button>
          <button
            v-if="weekOffset !== 0"
            class="ml-1 px-3 py-1 text-sm rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
            @click="weekOffset = 0"
          >
            {{ $t('current_week') }}
          </button>
        </div>
        <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <template v-if="trackedHoursLoading">
            <span class="inline-block w-32 h-4 bg-gray-200 rounded animate-pulse" />
          </template>
          <template v-else>
            <span>{{ $t('week_short') }} <strong class="text-gray-700">{{ weekTrackedHours.length ? weekTrackedTotal + '/' + weekExpectedHours + 'h' : '–' }}</strong></span>
            <span class="text-gray-300">|</span>
            <month-calendar
              :reference-date="days[0]"
              :tracked-hours="calendarTrackedHours"
              :label="monthLabel"
              @day-click="onCalendarDayClick"
              @month-changed="onCalendarMonthChanged"
            />
            <strong class="text-gray-700">{{ monthTrackedHours.length ? monthTrackedTotal + '/' + monthExpectedHours + 'h' : '–' }}</strong>
          </template>
        </div>
      </div>
      <div class="mt-6 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <business-unit-filter v-if="businessUnitsEnabled" />
        <div class="flex justify-between items-center">
          <div class="">
            <label for="toggleConfirmRequired" class="text-sm font-bold text-gray-800 dark:text-gray-100 mr-5">{{ $t('require_confirm_on_submit') }}</label>
          </div>
          <div class="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
            <input
              id="toggleConfirmRequired"
              :checked="isConfirmOnSubmitRequired"
              type="checkbox"
              class="focus:outline-none checkbox w-6 h-6 rounded-full bg-indigo-700 dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto"
              @input="setRequireSubmitConfirmation($event.target.checked)"
            >
            <label for="toggleConfirmRequired" class="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
    <!-- Page title ends -->
    <div class="container mx-auto px-6">
      <!-- Remove class [ h-64 ] when adding a card block -->
      <!-- Remove class [ border-dashed border-2 border-gray-300 ] to remove dotted border -->
      <div
        v-for="(day, index) of days"
        :key="day.toString()"
        class="w-full rounded border-2 mb-5 p-2 transition-shadow duration-150"
        :class="dayCardClasses(day, index)"
      >
        <day-input-item
          :ref="'day-' + index"
          :day="day"
          :focused="navigating && insideDay && focusedDayIndex === index"
          :wethod-hours="trackedHoursByDay[$dateFns.format(day, 'yyyy-MM-dd')]"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeftIcon, ChevronRightIcon } from 'vue-tabler-icons'
import { isSameDay, startOfMonth, endOfMonth } from 'date-fns'
import { mapGetters, mapMutations } from 'vuex'
import DayInputItem from '~/components/DayInputItem'
import BusinessUnitFilter from '~/components/BusinessUnitFilter'

export default {
  components: {
    ChevronLeftIcon,
    ChevronRightIcon,
    DayInputItem,
    BusinessUnitFilter
  },
  middleware: 'auth',
  data () {
    const queryWeek = parseInt(this.$route.query.week, 10)
    return {
      weekOffset: Number.isFinite(queryWeek) ? queryWeek : 0,
      weekTrackedHours: [],
      monthTrackedHours: [],
      calendarTrackedHours: [],
      trackedHoursLoading: false,
      focusedDayIndex: null,
      insideDay: false,
      navigating: false
    }
  },
  computed: {
    ...mapGetters({
      isTokenExpired: 'user/isTokenExpired',
      isConfirmOnSubmitRequired: 'preferences/isConfirmOnSubmitRequired',
      businessUnitsEnabled: 'user/businessUnitsEnabled'
    }),
    weekAnchor () {
      const today = new Date()
      return this.$dateFns.addWeeks(today, this.weekOffset)
    },
    days () {
      const monday = this.$dateFns.startOfWeek(this.weekAnchor, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, index) => this.$dateFns.addDays(monday, index))
    },
    weekLabel () {
      const monday = this.days[0]
      const sunday = this.days[6]
      const start = this.$dateFns.format(monday, 'd MMM')
      const end = this.$dateFns.format(sunday, 'd MMM yyyy')
      return `${start} – ${end}`
    },
    weekFrom () {
      return this.$dateFns.format(this.days[0], 'yyyy-MM-dd')
    },
    weekTo () {
      return this.$dateFns.format(this.days[6], 'yyyy-MM-dd')
    },
    monthFrom () {
      return this.$dateFns.format(startOfMonth(this.days[0]), 'yyyy-MM-dd')
    },
    monthTo () {
      return this.$dateFns.format(endOfMonth(this.days[0]), 'yyyy-MM-dd')
    },
    weekTrackedTotal () {
      return this.weekTrackedHours.reduce((sum, entry) => sum + (entry.value || 0), 0)
    },
    monthTrackedTotal () {
      return this.monthTrackedHours.reduce((sum, entry) => sum + (entry.value || 0), 0)
    },
    weekExpectedHours () {
      return 40
    },
    monthExpectedHours () {
      let workingDays = 0
      let current = startOfMonth(this.days[0])
      const end = endOfMonth(this.days[0])
      while (current <= end) {
        const dayOfWeek = current.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++
        }
        current = this.$dateFns.addDays(current, 1)
      }
      return workingDays * 8
    },
    monthLabel () {
      return this.$dateFns.format(this.days[0], 'MMMM yyyy')
    },
    trackedHoursByDay () {
      const map = {}
      for (const entry of this.weekTrackedHours) {
        map[entry.date] = entry.value
      }
      return map
    }
  },
  watch: {
    weekOffset (value) {
      const query = value === 0 ? {} : { week: String(value) }
      if (this.$route.query.week !== query.week) {
        this.$router.replace({ query })
      }
      this.fetchTrackedHours()
    }
  },
  mounted () {
    this.fetchTrackedHours()
    this.$nuxt.$on('tracked-hours:refresh', this.debouncedRefresh)
    this.$nuxt.$on('shortcut:prev-week', this.prevWeek)
    this.$nuxt.$on('shortcut:next-week', this.nextWeek)
    this.$nuxt.$on('shortcut:current-week', this.goCurrentWeek)
    this.$nuxt.$on('shortcut:focus-prev', this.focusPrev)
    this.$nuxt.$on('shortcut:focus-next', this.focusNext)
    this.$nuxt.$on('shortcut:add-entry', this.addEntryToFocused)
    this.$nuxt.$on('shortcut:import-gcal', this.importGcalToFocused)
    this.$nuxt.$on('shortcut:enter-day', this.enterDay)
    this.$nuxt.$on('shortcut:exit-day', this.exitDay)
    document.addEventListener('mousedown', this.deactivateNav)
  },
  beforeDestroy () {
    this.$nuxt.$off('tracked-hours:refresh', this.debouncedRefresh)
    this.$nuxt.$off('shortcut:prev-week', this.prevWeek)
    this.$nuxt.$off('shortcut:next-week', this.nextWeek)
    this.$nuxt.$off('shortcut:current-week', this.goCurrentWeek)
    this.$nuxt.$off('shortcut:focus-prev', this.focusPrev)
    this.$nuxt.$off('shortcut:focus-next', this.focusNext)
    this.$nuxt.$off('shortcut:add-entry', this.addEntryToFocused)
    this.$nuxt.$off('shortcut:import-gcal', this.importGcalToFocused)
    this.$nuxt.$off('shortcut:enter-day', this.enterDay)
    this.$nuxt.$off('shortcut:exit-day', this.exitDay)
    document.removeEventListener('mousedown', this.deactivateNav)
  },
  methods: {
    isToday (day) {
      return isSameDay(day, new Date())
    },
    dayCardClasses (day, index) {
      const classes = []
      if (this.isToday(day)) {
        classes.push('border-indigo-400 bg-indigo-50')
      } else {
        classes.push('border-gray-300')
      }
      if (this.navigating && this.focusedDayIndex === index && !this.insideDay) {
        classes.push('ring-2 ring-indigo-500 ring-offset-2')
      }
      return classes
    },
    deactivateNav () {
      this.navigating = false
      this.insideDay = false
    },
    activateNav () {
      this.navigating = true
      if (this.focusedDayIndex === null) { this.focusedDayIndex = 0 }
    },
    prevWeek () {
      this.weekOffset--
    },
    nextWeek () {
      this.weekOffset++
    },
    goCurrentWeek () {
      this.weekOffset = 0
    },
    enterDay () {
      this.activateNav()
      if (!this.insideDay) {
        this.insideDay = true
        const dayComponent = this.getFocusedDayComponent()
        if (dayComponent) { dayComponent.focusFirstEntry() }
      } else {
        const dayComponent = this.getFocusedDayComponent()
        if (dayComponent) { dayComponent.editCurrentEntry() }
      }
    },
    exitDay () {
      if (this.insideDay) {
        this.insideDay = false
        document.activeElement?.blur()
      } else {
        this.navigating = false
      }
    },
    focusPrev () {
      this.activateNav()
      if (this.insideDay) {
        const dayComponent = this.getFocusedDayComponent()
        if (dayComponent) { dayComponent.focusPrevEntry() }
        return
      }
      if (this.focusedDayIndex > 0) {
        this.focusedDayIndex--
      }
      this.scrollFocusedIntoView()
    },
    focusNext () {
      this.activateNav()
      if (this.insideDay) {
        const dayComponent = this.getFocusedDayComponent()
        if (dayComponent) { dayComponent.focusNextEntry() }
        return
      }
      if (this.focusedDayIndex < this.days.length - 1) {
        this.focusedDayIndex++
      }
      this.scrollFocusedIntoView()
    },
    scrollFocusedIntoView () {
      this.$nextTick(() => {
        const ref = this.$refs['day-' + this.focusedDayIndex]
        const element = Array.isArray(ref) ? ref[0]?.$el : ref?.$el
        if (!element) { return }
        const navHeight = 64
        const rect = element.getBoundingClientRect()
        if (rect.top < navHeight) {
          window.scrollBy({ top: rect.top - navHeight - 8, behavior: 'smooth' })
        } else if (rect.bottom > window.innerHeight) {
          element.scrollIntoView({ block: 'end', behavior: 'smooth' })
        }
      })
    },
    addEntryToFocused () {
      const dayComponent = this.getFocusedDayComponent()
      if (dayComponent) { dayComponent.addEntry() }
    },
    importGcalToFocused () {
      const dayComponent = this.getFocusedDayComponent()
      if (dayComponent) { dayComponent.fetchGCal() }
    },
    getFocusedDayComponent () {
      if (this.focusedDayIndex === null) { this.focusedDayIndex = 0 }
      const ref = this.$refs['day-' + this.focusedDayIndex]
      return Array.isArray(ref) ? ref[0] : ref
    },
    async fetchTrackedHours () {
      if (!this.$store.getters['user/canMakeRequests']) {
        return
      }
      const snapshotOffset = this.weekOffset
      this.trackedHoursLoading = true
      try {
        const employeeId = this.$store.getters['user/info'].employee_id || ''
        const [weekResponse, monthResponse] = await Promise.all([
          this.$axios.$get('tracked-hours', {
            params: { from: this.weekFrom, to: this.weekTo, employeeId }
          }),
          this.$axios.$get('tracked-hours', {
            params: { from: this.monthFrom, to: this.monthTo, employeeId }
          })
        ])
        if (this.weekOffset !== snapshotOffset) {
          return
        }
        if (Array.isArray(weekResponse?.data)) {
          this.weekTrackedHours = weekResponse.data
        }
        if (Array.isArray(monthResponse?.data)) {
          this.monthTrackedHours = monthResponse.data
          this.calendarTrackedHours = monthResponse.data
        }
      } catch {
        // API unreachable — tracked hours will remain empty
      } finally {
        if (this.weekOffset === snapshotOffset) {
          this.trackedHoursLoading = false
        }
      }
    },
    debouncedRefresh () {
      setTimeout(() => this.fetchTrackedHours(), 800)
    },
    onCalendarDayClick (dateKey) {
      const targetDate = new Date(dateKey)
      const targetMonday = this.$dateFns.startOfWeek(targetDate, { weekStartsOn: 1 })
      const todayMonday = this.$dateFns.startOfWeek(new Date(), { weekStartsOn: 1 })
      const diffMs = targetMonday.getTime() - todayMonday.getTime()
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
      this.weekOffset = diffWeeks
    },
    async onCalendarMonthChanged ({ from, to }) {
      if (from === this.monthFrom && to === this.monthTo) {
        this.calendarTrackedHours = this.monthTrackedHours
        return
      }
      if (!this.$store.getters['user/canMakeRequests']) {
        this.calendarTrackedHours = []
        return
      }
      try {
        const employeeId = this.$store.getters['user/info'].employee_id || ''
        const response = await this.$axios.$get('tracked-hours', {
          params: { from, to, employeeId }
        })
        if (Array.isArray(response?.data)) {
          this.calendarTrackedHours = response.data
        }
      } catch {
        this.calendarTrackedHours = []
      }
    },
    ...mapMutations({
      setRequireSubmitConfirmation: 'preferences/setRequireSubmitConfirmation'
    })
  }
}
</script>

<style lang="postcss">

</style>
