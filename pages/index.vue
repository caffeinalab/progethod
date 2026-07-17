<template>
  <div class="pt-20">
    <!-- Page title starts -->

    <div v-if="isTokenExpired" class="container px-6 mx-auto mt-4 mb-4">
      <div class="bg-warning-soft border border-warning rounded-lg p-4">
        <div class="flex items-start gap-2">
          <alert-triangle-icon class="text-warning flex-shrink-0 mt-0.5" size="20" />
          <div class="flex-1">
            <p class="text-base font-bold text-warning-text">
              {{ $t('session_expired') }}
            </p>
            <p class="text-sm text-warning-text mt-1">
              {{ $t('session_expired_hint') }}
            </p>
            <button
              class="text-sm text-warning-text underline mt-2 hover:opacity-80 transition-opacity"
              @click="showExtensionGuide = !showExtensionGuide"
            >
              {{ showExtensionGuide ? $t('calendar_page.cancel') : $t('login_instructions') }}
            </button>
            <ol v-if="showExtensionGuide" class="list-decimal list-inside space-y-2 mt-3 text-sm text-warning-text">
              <li>
                {{ $t('login_tutorial.step_1') }}<a class="underline font-semibold" target="_blank" :href="loginExtensionUrl">{{ $t('login_tutorial.step_1_cta_store') }}</a>{{ $t('login_tutorial.step_1_alt') }}<a class="underline font-semibold" href="/progethod-extension.zip" download>{{ $t('login_tutorial.step_1_cta_download') }}</a>
              </li>
              <li>
                {{ $t('login_tutorial.step_2') }}
                <ol class="list-[lower-alpha] list-inside ml-4 mt-1 space-y-1">
                  <li>{{ $t('login_tutorial.step_2a') }}</li>
                  <li v-html="$t('login_tutorial.step_2b')" />
                  <li v-html="$t('login_tutorial.step_2c')" />
                </ol>
              </li>
              <li>{{ $t('login_tutorial.step_3') }}</li>
              <li>{{ $t('login_tutorial.step_4') }}</li>
              <li>{{ $t('login_tutorial.step_5') }}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
    <alert v-if="showMonthEndReminder && !monthEndReminderDismissed" :message="$t('month_end_reminder')" level="warning" dismissable @dismiss="dismissMonthEndReminder" />
    <div class="my-6 lg:my-12 container px-6 mx-auto pb-4 border-b border-stroke">
      <div class="flex items-center gap-3">
        <div class="inline-flex items-center bg-card border border-stroke-muted rounded-lg shadow">
          <button
            class="p-2.5 text-ink-muted hover:bg-card-hover rounded-l-lg transition-colors focus:outline-none"
            :title="$t('previous_week')"
            @click="weekOffset--"
          >
            <chevron-left-icon size="18" />
          </button>
          <span
            class="px-4 py-2 text-sm font-semibold text-ink border-l border-r border-stroke-muted select-none cursor-pointer hover:bg-card-hover transition-colors"
            @click.stop="$refs.monthCalendar.toggle()"
          >
            {{ weekLabel }}
          </span>
          <button
            class="p-2.5 text-ink-muted hover:bg-card-hover rounded-r-lg transition-colors focus:outline-none"
            :title="$t('next_week')"
            @click="weekOffset++"
          >
            <chevron-right-icon size="18" />
          </button>
        </div>
        <button
          v-if="weekOffset !== 0"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-soft text-accent-fg hover:bg-accent-soft transition-colors border border-accent"
          @click="weekOffset = 0"
        >
          {{ $t('current_week') }}
        </button>
      </div>

      <div class="flex items-stretch gap-3 mt-4">
        <template v-if="trackedHoursLoading">
          <div class="stat-card animate-pulse">
            <span class="inline-block w-20 h-4 bg-stroke-muted rounded" />
          </div>
          <div class="stat-card animate-pulse">
            <span class="inline-block w-20 h-4 bg-stroke-muted rounded" />
          </div>
        </template>
        <template v-else>
          <!-- Week stat -->
          <div class="stat-card">
            <span class="stat-label">{{ $t('week_short') }}</span>
            <span class="stat-value">{{ weekTrackedTotal + '/' + weekExpectedHours + 'h' }}</span>
          </div>

          <!-- Month stat -->
          <div class="stat-card cursor-pointer hover:bg-card-hover hover:border-stroke transition-colors" @click.stop="$refs.monthCalendar.toggle()">
            <month-calendar
              ref="monthCalendar"
              :reference-date="weekAnchor"
              :tracked-hours="calendarTrackedHours"
              :holidays="holidays"
              :label="monthLabel"
              @day-click="onCalendarDayClick"
              @month-changed="onCalendarMonthChanged"
            />
            <span class="stat-value">{{ monthTrackedDays + '/' + monthWorkingDays }}</span>
          </div>

          <!-- Office days stat -->
          <div class="stat-card">
            <span class="stat-label inline-flex items-center gap-1">
              <building-icon size="14" class="text-accent" />
              {{ $t('office_days_label') }}
            </span>
            <span class="stat-value">{{ officeDaysInMonth }}</span>
          </div>
        </template>

        <business-unit-filter v-if="businessUnitsEnabled" class="ml-auto" />
      </div>
    </div>
    <!-- Page title ends -->
    <div class="container mx-auto px-6">
      <!-- Remove class [ h-64 ] when adding a card block -->
      <!-- Remove class [ border-dashed border-2 border-gray-300 ] to remove dotted border -->
      <div
        v-for="(day, index) of days"
        :key="day.toString()"
        class="day-card w-full rounded-lg border mb-5 p-2 shadow-sm transition-shadow duration-150"
        :class="dayCardClasses(day, index)"
      >
        <day-input-item
          :ref="'day-' + index"
          :day="day"
          :focused="navigating && insideDay && focusedDayIndex === index"
          :wethod-hours="trackedHoursByDay[$dateFns.format(day, 'yyyy-MM-dd')]"
          :leave-hours="leaveHoursByDay[$dateFns.format(day, 'yyyy-MM-dd')]"
          :holiday-name="holidaysByDate[$dateFns.format(day, 'yyyy-MM-dd')]"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { AlertTriangleIcon, ChevronLeftIcon, ChevronRightIcon, BuildingIcon } from 'vue-tabler-icons'
import { isSameDay, startOfMonth, endOfMonth, subDays, getDay, isAfter, isBefore } from 'date-fns'
import { mapGetters } from 'vuex'
import DayInputItem from '~/components/DayInputItem'
import BusinessUnitFilter from '~/components/BusinessUnitFilter'
import liveToday from '~/mixins/liveToday'

export default {
  components: {
    AlertTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    BuildingIcon,
    DayInputItem,
    BusinessUnitFilter
  },
  mixins: [liveToday],
  middleware: 'auth',
  data () {
    const queryWeek = parseInt(this.$route.query.week, 10)
    const dismissedAt = localStorage.getItem('monthEndReminderDismissedAt')
    const isDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < 24 * 60 * 60 * 1000
    return {
      weekOffset: Number.isFinite(queryWeek) ? queryWeek : 0,
      weekTrackedHours: [],
      monthTrackedHours: [],
      calendarTrackedHours: [],
      trackedHoursLoading: false,
      officeDaysFromApi: [],
      weekVacationHours: [],
      holidays: [],
      focusedDayIndex: null,
      insideDay: false,
      navigating: false,
      monthEndReminderDismissed: !!isDismissed,
      showExtensionGuide: false,
      loginExtensionUrl: process.env.loginExtensionUrl
    }
  },
  computed: {
    ...mapGetters({
      isTokenExpired: 'user/isTokenExpired',
      businessUnitsEnabled: 'user/businessUnitsEnabled'
    }),
    weekAnchor () {
      return this.$dateFns.addWeeks(this.today, this.weekOffset)
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
      return this.$dateFns.format(startOfMonth(this.weekAnchor), 'yyyy-MM-dd')
    },
    monthTo () {
      return this.$dateFns.format(endOfMonth(this.weekAnchor), 'yyyy-MM-dd')
    },
    weekTrackedTotal () {
      return this.weekTrackedHours.reduce((sum, entry) => sum + (entry.value || 0), 0)
    },
    monthTrackedDays () {
      return this.monthTrackedHours.filter(entry => entry.value >= 8).length
    },
    weekExpectedHours () {
      return 40
    },
    monthWorkingDays () {
      let workingDays = 0
      let current = startOfMonth(this.weekAnchor)
      const end = endOfMonth(this.weekAnchor)
      while (current <= end) {
        const dayOfWeek = current.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++
        }
        current = this.$dateFns.addDays(current, 1)
      }
      return workingDays
    },
    monthLabel () {
      return this.$dateFns.format(this.weekAnchor, 'MMMM yyyy')
    },
    officeDaysInMonth () {
      return this.officeDaysFromApi.length
    },
    trackedHoursByDay () {
      const map = {}
      for (const entry of this.weekTrackedHours) {
        map[entry.date] = entry.value
      }
      return map
    },
    leaveHoursByDay () {
      const map = {}
      for (const entry of this.weekVacationHours) {
        if (entry.projectId === 83 || entry.projectId === 90) {
          map[entry.date] = (map[entry.date] || 0) + entry.amount
        }
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
    showMonthEndReminder () {
      const monthEnd = endOfMonth(this.today)
      let cursor = new Date(monthEnd)
      const lastWorkingDays = []

      while (lastWorkingDays.length < 2) {
        const dow = getDay(cursor)
        if (dow !== 0 && dow !== 6) {
          lastWorkingDays.push(cursor)
        }
        cursor = subDays(cursor, 1)
      }

      const rangeStart = lastWorkingDays[lastWorkingDays.length - 1]
      return !isBefore(this.today, rangeStart) && !isAfter(this.today, monthEnd)
    }
  },
  watch: {
    weekOffset (value) {
      const query = value === 0 ? {} : { week: String(value) }
      if (this.$route.query.week !== query.week) {
        this.$router.replace({ query })
      }
      this.fetchTrackedHours()
      this.fetchOfficeDays()
      this.fetchVacationHours()
    }
  },
  mounted () {
    this.fetchTrackedHours()
    this.fetchOfficeDays()
    this.fetchVacationHours()
    this.fetchHolidays()
    this.scrollToToday()
    this.$nuxt.$on('tracked-hours:refresh', this.debouncedRefresh)
    this.$nuxt.$on('shortcut:prev-week', this.prevWeek)
    this.$nuxt.$on('shortcut:next-week', this.nextWeek)
    this.$nuxt.$on('shortcut:current-week', this.goCurrentWeek)
    this.$nuxt.$on('shortcut:focus-prev', this.focusPrev)
    this.$nuxt.$on('shortcut:focus-next', this.focusNext)
    this.$nuxt.$on('shortcut:add-entry', this.addEntryToFocused)
    this.$nuxt.$on('shortcut:import-gcal', this.importGcalToFocused)
    this.$nuxt.$on('shortcut:import-jira', this.importJiraToFocused)
    this.$nuxt.$on('shortcut:import-gitlab', this.importGitlabToFocused)
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
    this.$nuxt.$off('shortcut:import-jira', this.importJiraToFocused)
    this.$nuxt.$off('shortcut:import-gitlab', this.importGitlabToFocused)
    this.$nuxt.$off('shortcut:enter-day', this.enterDay)
    this.$nuxt.$off('shortcut:exit-day', this.exitDay)
    document.removeEventListener('mousedown', this.deactivateNav)
  },
  methods: {
    isToday (day) {
      return isSameDay(day, this.today)
    },
    dayCardClasses (day, index) {
      const classes = []
      if (this.isToday(day)) {
        classes.push('border-accent bg-accent-soft')
      } else {
        classes.push('border-stroke')
      }
      if (this.navigating && this.focusedDayIndex === index && !this.insideDay) {
        classes.push('ring-2 ring-focus-ring ring-offset-2 ring-offset-page')
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
    importJiraToFocused () {
      const dayComponent = this.getFocusedDayComponent()
      if (dayComponent) { dayComponent.handleJiraClick() }
    },
    importGitlabToFocused () {
      const dayComponent = this.getFocusedDayComponent()
      if (dayComponent) { dayComponent.handleGitlabClick() }
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
    async fetchOfficeDays () {
      if (!this.$store.getters['user/canMakeRequests']) {
        return
      }
      try {
        const response = await this.$axios.$get('office-days', {
          params: { from: this.monthFrom, to: this.monthTo }
        })
        if (Array.isArray(response?.data)) {
          this.officeDaysFromApi = response.data
        }
      } catch {
        // API unreachable — office days will remain empty
      }
    },
    async fetchVacationHours () {
      if (!this.$store.getters['user/canMakeRequests']) {
        return
      }
      const snapshotOffset = this.weekOffset
      try {
        const employeeId = this.$store.getters['user/info'].employee_id
        const response = await this.$axios.$get('planningboard', {
          params: { from: this.weekFrom, to: this.weekTo }
        })
        if (this.weekOffset !== snapshotOffset) {
          return
        }
        const plannings = response?.data?.plannings || {}
        const entries = []
        for (const group of Object.values(plannings)) {
          if (!Array.isArray(group)) { continue }
          for (const planning of group) {
            if (
              planning.employee_id === employeeId &&
              (planning.project_id === 83 || planning.project_id === 90)
            ) {
              entries.push({ date: planning.day, amount: planning.amount, projectId: planning.project_id })
            }
          }
        }
        this.weekVacationHours = entries
      } catch {
        // API unreachable — vacation hours will remain empty
      }
    },
    async fetchHolidays () {
      try {
        const response = await this.$axios.$get('holidays')
        this.holidays = response?.data || []
      } catch {
        this.holidays = []
      }
    },
    debouncedRefresh () {
      setTimeout(() => {
        this.fetchTrackedHours()
        this.fetchOfficeDays()
        this.fetchVacationHours()
      }, 800)
    },
    onCalendarDayClick (dateKey) {
      const targetDate = new Date(dateKey)
      const targetMonday = this.$dateFns.startOfWeek(targetDate, { weekStartsOn: 1 })
      const todayMonday = this.$dateFns.startOfWeek(this.today, { weekStartsOn: 1 })
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
    dismissMonthEndReminder () {
      this.monthEndReminderDismissed = true
      localStorage.setItem('monthEndReminderDismissedAt', String(Date.now()))
    },
    scrollToToday () {
      if (this.weekOffset !== 0) { return }
      const todayIndex = this.days.findIndex(day => isSameDay(day, this.today))
      if (todayIndex < 0) { return }
      this.$nextTick(() => {
        const ref = this.$refs['day-' + todayIndex]
        const element = Array.isArray(ref) ? ref[0]?.$el : ref?.$el
        if (element) {
          element.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      })
    }
  }
}
</script>

<style lang="postcss">
  .stat-card {
    @apply flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-stroke-muted shadow text-sm;
  }

  .stat-label {
    @apply text-ink-muted font-medium;
  }

  .stat-value {
    @apply text-ink font-bold tabular-nums;
  }
</style>
