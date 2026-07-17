<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-6xl px-6">
      <div class="flex gap-6 items-start">
        <!-- Calendar panel -->
        <div class="flex-1 min-w-0 bg-card shadow rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-bold text-ink">
              {{ $t('calendar_page.title') }}
            </h1>
            <div class="flex items-center gap-3">
              <button
                v-if="exportableEvents.length"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-soft text-accent-fg hover:bg-accent border border-accent hover:text-ink-inverse transition-colors"
                @click="showExportModal = true"
              >
                <icons-google-calendar-icon :size="14" />
                {{ $t('calendar_page.export_month') }}
              </button>
              <button
                v-if="monthOffset !== 0"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-soft text-accent-fg hover:bg-accent-soft transition-colors border border-accent"
                @click="monthOffset = 0"
              >
                {{ $t('calendar_page.current_month') }}
              </button>
              <div class="inline-flex items-center bg-card border border-stroke-muted rounded-lg shadow">
                <button
                  class="p-2 text-ink-muted hover:text-ink hover:bg-card-hover rounded-l-lg transition-colors focus:outline-none"
                  @click="monthOffset--"
                >
                  <chevron-left-icon size="18" />
                </button>
                <span class="px-4 py-1.5 text-sm font-semibold text-ink border-l border-r border-stroke-muted select-none capitalize">
                  {{ displayedMonthLabel }}
                </span>
                <button
                  class="p-2 text-ink-muted hover:text-ink hover:bg-card-hover rounded-r-lg transition-colors focus:outline-none"
                  @click="monthOffset++"
                >
                  <chevron-right-icon size="18" />
                </button>
              </div>
            </div>
          </div>

          <!-- Export result feedback -->
          <div
            v-if="exportResult"
            class="mb-4 p-3 rounded-lg border text-xs font-medium"
            :class="exportResult.success ? 'border-vacation bg-vacation-soft text-vacation-text' : 'border-danger bg-danger-soft text-danger-text'"
          >
            {{ exportResult.message }}
          </div>

          <div class="grid grid-cols-7 gap-1 select-none">
            <div
              v-for="dayName in weekdayHeaders"
              :key="dayName"
              class="text-center text-xs font-semibold text-ink-faint py-2"
            >
              {{ dayName }}
            </div>

            <div
              v-for="cell in calendarCells"
              :key="cell.key"
              class="rounded-lg border p-2 min-h-[4.5rem] transition-colors"
              :class="cellClasses(cell)"
              @mousedown="onCellMouseDown(cell, $event)"
              @mouseenter="onCellMouseEnter(cell)"
            >
              <template v-if="cell.dayNumber">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold" :class="cell.isToday ? 'text-accent-fg' : ''">
                    {{ cell.dayNumber }}
                  </span>
                  <button
                    v-if="(cell.vacation > 0 || cell.leaves > 0) && !cell.isWeekend && !cell.isHoliday"
                    class="text-ink-faint hover:text-ink transition-colors disabled:opacity-30"
                    :disabled="createdDates.has(cell.dateKey)"
                    :title="createdDates.has(cell.dateKey) ? $t('calendar_page.already_added') : $t('calendar_page.add_to_gcal')"
                    @mousedown.stop
                    @click.stop="addDayToCalendar(cell)"
                  >
                    <check-icon v-if="createdDates.has(cell.dateKey)" :size="14" class="text-vacation" />
                    <icons-google-calendar-icon v-else :size="14" />
                  </button>
                </div>
                <div v-if="cell.isHoliday" class="text-[10px] font-medium text-ink-faint truncate" :title="cell.holidayName">
                  {{ cell.holidayName }}
                </div>
                <div v-if="cell.vacation > 0" class="text-xs font-medium" :class="cell.vacationPending ? 'text-pending-text' : 'text-vacation-text'">
                  {{ $t('calendar_page.vacation_label') }} {{ formatHours(cell.vacation) }}
                </div>
                <div v-if="cell.leaves > 0" class="text-xs font-medium mt-0.5" :class="cell.leavesPending ? 'text-pending-text' : 'text-vacation-text'">
                  {{ $t('calendar_page.leaves_label') }} {{ formatHours(cell.leaves) }}
                </div>
              </template>
            </div>
          </div>

          <div class="flex items-center gap-4 mt-4 pt-4 border-t border-stroke-muted text-xs text-ink-muted">
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-3 h-3 rounded-sm bg-vacation-soft border border-vacation" />
              {{ $t('calendar_page.approved') }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-3 h-3 rounded-sm bg-pending-soft border-2 border-pending" />
              {{ $t('calendar_page.pending') }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-3 h-3 rounded-sm bg-card-dim border border-stroke-muted" />
              {{ $t('calendar_page.holiday_label') }}
            </span>
          </div>

          <div class="mt-4 pt-4 border-t border-stroke-muted">
            <div class="flex items-center gap-6 text-sm text-ink-secondary">
              <div>
                <span class="font-semibold text-ink">{{ monthVacationTotal }}</span> {{ $t('calendar_page.vacation_label').toLowerCase() }}
              </div>
              <div>
                <span class="font-semibold text-ink">{{ monthLeavesTotal }}</span> {{ $t('calendar_page.leaves_label').toLowerCase() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming requests sidebar -->
        <div class="w-80 shrink-0 bg-card shadow rounded-lg p-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
          <h2 class="text-sm font-bold text-ink mb-3">
            {{ $t('calendar_page.requests_upcoming') }}
          </h2>

          <div v-if="requestsLoading" class="space-y-3">
            <div v-for="skeleton in 5" :key="skeleton" class="animate-pulse">
              <span class="inline-block w-full h-10 bg-stroke-muted rounded" />
            </div>
          </div>

          <div v-else-if="upcomingRequests.length === 0" class="text-xs text-ink-muted py-4 text-center">
            {{ $t('calendar_page.requests_empty') }}
          </div>

          <div v-else class="space-y-0.5">
            <div
              v-for="request in upcomingRequests"
              :key="request.id"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors group"
              :class="requestClasses(request)"
            >
              <component
                :is="statusIcon(request.status)"
                :size="14"
                class="shrink-0"
                :class="statusIconClasses(request.status)"
                :title="statusLabel(request.status)"
              />
              <button class="flex-1 min-w-0 text-left" @click="navigateToRequest(request)">
                <span class="text-xs font-semibold text-ink">{{ request.typeLabel }}</span>
                <span class="text-[10px] text-ink-muted ml-1">{{ request.dateRangeShort }}</span>
                <span class="text-[10px] text-ink-faint ml-0.5">{{ request.totalHoursLabel }}</span>
              </button>
              <div class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="p-1 rounded text-ink-faint hover:text-accent-fg hover:bg-card-hover transition-colors"
                  :title="$t('edit')"
                  @click="openEditFromRequest(request)"
                >
                  <edit-icon :size="13" />
                </button>
                <button
                  class="p-1 rounded text-ink-faint hover:text-danger hover:bg-danger-soft transition-colors"
                  :title="$t('delete')"
                  @click="deleteRequestDirect(request)"
                >
                  <trash-icon :size="13" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Past requests history -->
      <div class="mt-6 bg-card shadow rounded-lg p-6">
        <h2 class="text-sm font-bold text-ink mb-3">
          {{ $t('calendar_page.history_title') }}
        </h2>

        <div v-if="requestsLoading" class="space-y-3">
          <div v-for="skeleton in 3" :key="skeleton" class="animate-pulse">
            <span class="inline-block w-full h-10 bg-stroke-muted rounded" />
          </div>
        </div>

        <div v-else-if="pastRequests.length === 0" class="text-xs text-ink-muted py-4 text-center">
          {{ $t('calendar_page.no_past_requests') }}
        </div>

        <template v-else>
          <div class="space-y-0.5">
            <div
              v-for="request in pastRequests"
              :key="request.id"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors hover:bg-card-hover"
              :class="requestClasses(request)"
            >
              <component
                :is="statusIcon(request.status)"
                :size="14"
                class="shrink-0"
                :class="statusIconClasses(request.status)"
                :title="statusLabel(request.status)"
              />
              <button class="flex-1 min-w-0 text-left" @click="navigateToRequest(request)">
                <span class="text-xs font-semibold text-ink">{{ request.typeLabel }}</span>
                <span class="text-[10px] text-ink-muted ml-1">{{ request.dateRangeShort }}</span>
                <span class="text-[10px] text-ink-faint ml-0.5">{{ request.totalHoursLabel }}</span>
              </button>
            </div>
          </div>

          <button
            v-if="hasMorePast"
            class="w-full text-center text-xs text-accent-fg hover:underline py-2 mt-2"
            @click="loadMorePast"
          >
            {{ $t('calendar_page.load_more') }}
          </button>
        </template>
      </div>
    </div>

    <!-- Export confirmation modal -->
    <modal v-model="showExportModal">
      <h3 class="text-lg font-bold text-ink mb-2">
        {{ $t('calendar_page.export_confirm_title') }}
      </h3>
      <p class="text-sm text-ink-muted mb-4 text-center">
        {{ $t('calendar_page.export_confirm_description') }}
      </p>
      <ul class="w-full space-y-1 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
        <li
          v-for="event in exportableEvents"
          :key="event.date + event.type"
          class="flex items-center justify-between text-xs px-3 py-1.5 rounded bg-card-hover"
        >
          <span class="font-medium text-ink capitalize">{{ event.dateLabel }}</span>
          <span class="text-ink-muted">{{ event.typeLabel }} {{ event.hoursLabel }}</span>
        </li>
      </ul>
      <div class="flex gap-3">
        <button
          class="px-4 py-2 text-sm rounded-lg border border-stroke text-ink-secondary hover:bg-card-hover transition-colors"
          @click="showExportModal = false"
        >
          {{ $t('calendar_page.cancel') }}
        </button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-ink-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          :disabled="exporting"
          @click="confirmExport"
        >
          <template v-if="exporting">
            {{ $t('calendar_page.exporting') }}
          </template>
          <template v-else>
            {{ $t('calendar_page.export_confirm_button') }}
          </template>
        </button>
      </div>
    </modal>

    <!-- Create / Edit request modal -->
    <modal v-model="showRequestModal">
      <h3 class="text-lg font-bold text-ink mb-1">
        {{ requestModalMode === 'create' ? $t('calendar_page.create_request_title') : $t('calendar_page.edit_request_title') }}
      </h3>
      <p v-if="requestModalMode === 'edit' && editingRequest" class="text-xs text-ink-muted mb-4">
        <span
          class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
          :class="statusBadgeClasses(editingRequest.status)"
        >
          {{ statusLabel(editingRequest.status) }}
        </span>
      </p>

      <div
        v-if="requestError"
        class="w-full mb-4 p-3 rounded-lg border border-danger bg-danger-soft text-danger-text text-xs font-medium"
      >
        {{ requestError }}
      </div>

      <!-- Type selector -->
      <div class="w-full mb-4">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">
          {{ $t('calendar_page.request_type') }}
        </label>
        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
            :class="modalProjectId === vacationProjectId ? 'border-vacation bg-vacation-soft text-vacation-text' : 'border-stroke-muted text-ink-muted hover:bg-card-hover'"
            @click="modalProjectId = vacationProjectId"
          >
            {{ $t('calendar_page.vacation_label') }}
          </button>
          <button
            class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
            :class="modalProjectId === leavesProjectId ? 'border-vacation bg-vacation-soft text-vacation-text' : 'border-stroke-muted text-ink-muted hover:bg-card-hover'"
            @click="modalProjectId = leavesProjectId"
          >
            {{ $t('calendar_page.leaves_label') }}
          </button>
        </div>
      </div>

      <!-- Selected days with removable chips -->
      <div class="w-full mb-4">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">
          {{ $t('calendar_page.selected_days') }}
        </label>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(dateStr, dateIndex) in modalDates"
            :key="dateStr"
            class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-card-hover text-ink capitalize"
          >
            {{ formatDateChip(dateStr) }}
            <button
              v-if="requestModalMode === 'create' && modalDates.length > 1"
              class="text-ink-faint hover:text-danger transition-colors ml-0.5"
              @click="removeModalDate(dateIndex)"
            >
              <x-icon :size="12" />
            </button>
          </span>
        </div>
      </div>

      <!-- Hours per day (create only) -->
      <div v-if="requestModalMode === 'create'" class="w-full mb-4">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">
          {{ $t('calendar_page.hours_per_day') }}
        </label>
        <div class="flex gap-2">
          <button
            v-for="option in [4, 8]"
            :key="option"
            class="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
            :class="modalHoursPerDay === option ? 'border-accent bg-accent-soft text-accent-fg' : 'border-stroke-muted text-ink-muted hover:bg-card-hover'"
            @click="modalHoursPerDay = option"
          >
            {{ option }}h
          </button>
        </div>
      </div>

      <!-- Notes -->
      <div class="w-full mb-6">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">
          {{ $t('notes') }}
        </label>
        <input
          v-model="modalNotes"
          type="text"
          class="w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-input text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-focus-ring"
          :placeholder="$t('calendar_page.notes_placeholder')"
        >
      </div>

      <!-- Actions -->
      <div class="flex w-full gap-3">
        <button
          v-if="requestModalMode === 'edit'"
          class="px-4 py-2 text-sm font-medium rounded-lg border-2 border-danger text-danger hover:bg-danger hover:text-ink-inverse transition-colors disabled:opacity-50"
          :disabled="requestDeleting || requestSaving"
          @click="deleteRequest"
        >
          {{ requestDeleting ? $t('calendar_page.request_deleting') : $t('calendar_page.delete_request') }}
        </button>
        <div class="flex-1" />
        <button
          class="px-4 py-2 text-sm rounded-lg border border-stroke text-ink-secondary hover:bg-card-hover transition-colors"
          @click="showRequestModal = false"
        >
          {{ $t('calendar_page.cancel') }}
        </button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-ink-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          :disabled="requestSaving || requestDeleting || (requestModalMode === 'create' && modalDates.length === 0)"
          @click="submitRequest"
        >
          <template v-if="requestModalMode === 'create'">
            {{ requestSaving ? $t('calendar_page.request_creating') : $t('calendar_page.create_request') }}
          </template>
          <template v-else>
            {{ requestSaving ? $t('calendar_page.request_saving') : $t('calendar_page.save_changes') }}
          </template>
        </button>
      </div>
    </modal>
  </div>
</template>

<script>
import { startOfMonth, endOfMonth, getDay, differenceInCalendarMonths } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, XIcon, EditIcon, TrashIcon, ClockIcon, CircleCheckIcon, CircleXIcon } from 'vue-tabler-icons'
import Modal from '~/components/Modal'
import liveToday from '~/mixins/liveToday'
import { createOutOfOfficeEvent } from '~/utils/gCal'

const VACATION_PROJECT_ID = 83
const LEAVES_PROJECT_ID = 90
const REQUESTS_PAGE_SIZE = 50
const SYSTEM_NOTE_PATTERN = /^Allocation request imported on /i

export default {
  components: { ChevronLeftIcon, ChevronRightIcon, CheckIcon, XIcon, EditIcon, TrashIcon, ClockIcon, CircleCheckIcon, CircleXIcon, Modal },
  mixins: [liveToday],
  middleware: 'auth',
  data: () => ({
    monthOffset: 0,
    plannings: [],
    holidays: [],
    exporting: false,
    exportResult: null,
    createdDates: new Set(),
    showExportModal: false,
    allRequests: [],
    requestsLoading: false,

    dragStartDate: null,
    dragEndDate: null,
    isDragging: false,

    showRequestModal: false,
    requestModalMode: 'create',
    editingRequest: null,
    modalProjectId: VACATION_PROJECT_ID,
    modalHoursPerDay: 8,
    modalNotes: '',
    modalDates: [],
    requestSaving: false,
    requestDeleting: false,
    requestError: null,
    pastVisibleCount: 10
  }),
  computed: {
    vacationProjectId () { return VACATION_PROJECT_ID },
    leavesProjectId () { return LEAVES_PROJECT_ID },
    displayedMonth () {
      if (this.monthOffset === 0) {
        return this.today
      }
      return this.$dateFns.addMonths(startOfMonth(this.today), this.monthOffset)
    },
    displayedMonthLabel () {
      return this.$dateFns.format(this.displayedMonth, 'MMMM yyyy')
    },
    monthFrom () {
      return this.$dateFns.format(startOfMonth(this.displayedMonth), 'yyyy-MM-dd')
    },
    monthTo () {
      return this.$dateFns.format(endOfMonth(this.displayedMonth), 'yyyy-MM-dd')
    },
    weekdayHeaders () {
      return ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']
    },
    todayStr () {
      return this.$dateFns.format(this.today, 'yyyy-MM-dd')
    },
    holidaysByDate () {
      const map = {}
      for (const holiday of this.holidays) {
        map[holiday.date] = holiday.name
      }
      return map
    },
    upcomingRequests () {
      return this.allRequests
        .filter(request => request.lastDate && request.lastDate >= this.todayStr)
        .sort((first, second) => first.firstDate.localeCompare(second.firstDate))
    },
    allPastRequests () {
      return this.allRequests
        .filter(request => !request.lastDate || request.lastDate < this.todayStr)
        .sort((first, second) => (second.firstDate || '').localeCompare(first.firstDate || ''))
    },
    pastRequests () {
      return this.allPastRequests.slice(0, this.pastVisibleCount)
    },
    hasMorePast () {
      return this.pastVisibleCount < this.allPastRequests.length
    },
    selectedDates () {
      if (!this.dragStartDate) { return new Set() }
      const end = this.dragEndDate || this.dragStartDate
      const startStr = this.dragStartDate < end ? this.dragStartDate : end
      const finishStr = this.dragStartDate < end ? end : this.dragStartDate
      const dates = new Set()
      let current = new Date(startStr + 'T00:00:00')
      const endDate = new Date(finishStr + 'T00:00:00')
      while (current <= endDate) {
        const dow = getDay(current)
        const dateKey = this.$dateFns.format(current, 'yyyy-MM-dd')
        if (dow !== 0 && dow !== 6 && !this.holidaysByDate[dateKey]) {
          dates.add(dateKey)
        }
        current = this.$dateFns.addDays(current, 1)
      }
      return dates
    },
    planningsByDate () {
      const map = {}
      const employeeId = this.$store.getters['user/info']?.employee_id
      for (const planning of this.plannings) {
        if (planning.employee_id !== employeeId) { continue }
        if (planning.project_id !== VACATION_PROJECT_ID && planning.project_id !== LEAVES_PROJECT_ID) { continue }
        if (!map[planning.day]) {
          map[planning.day] = { vacation: 0, leaves: 0, vacationPending: false, leavesPending: false, requestIds: [] }
        }
        if (planning.project_id === VACATION_PROJECT_ID) {
          map[planning.day].vacation += planning.amount
          if (planning.is_pending) { map[planning.day].vacationPending = true }
        } else {
          map[planning.day].leaves += planning.amount
          if (planning.is_pending) { map[planning.day].leavesPending = true }
        }
        if (planning.allocation_request_id && !map[planning.day].requestIds.includes(planning.allocation_request_id)) {
          map[planning.day].requestIds.push(planning.allocation_request_id)
        }
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
        cells.push({ key: `blank-${blank}`, dayNumber: null })
      }

      let current = new Date(monthStart)
      while (current <= monthEnd) {
        const dow = getDay(current)
        const isWeekend = dow === 0 || dow === 6
        const dateKey = this.$dateFns.format(current, 'yyyy-MM-dd')
        const dayData = this.planningsByDate[dateKey] || { vacation: 0, leaves: 0, vacationPending: false, leavesPending: false, requestIds: [] }
        const holidayName = this.holidaysByDate[dateKey]

        cells.push({
          key: dateKey,
          dayNumber: current.getDate(),
          isWeekend,
          isHoliday: !!holidayName,
          holidayName: holidayName || '',
          isToday: dateKey === this.todayStr,
          vacation: dayData.vacation,
          leaves: dayData.leaves,
          vacationPending: dayData.vacationPending,
          leavesPending: dayData.leavesPending,
          requestIds: dayData.requestIds,
          dateKey
        })
        current = this.$dateFns.addDays(current, 1)
      }
      return cells
    },
    uniqueExportDates () {
      const dates = new Set()
      for (const cell of this.calendarCells) {
        if (!cell.dayNumber || cell.isWeekend || cell.isHoliday) { continue }
        if (cell.vacation > 0 || cell.leaves > 0) {
          dates.add(cell.dateKey)
        }
      }
      return dates
    },
    exportableEvents () {
      const events = []
      for (const cell of this.calendarCells) {
        if (!cell.dayNumber || cell.isWeekend || cell.isHoliday) { continue }
        if (cell.vacation > 0) {
          events.push({
            date: cell.dateKey,
            dateLabel: this.$dateFns.format(new Date(cell.dateKey + 'T00:00:00'), 'EEEE d MMMM'),
            type: 'vacation',
            typeLabel: this.$t('calendar_page.vacation_label'),
            hours: cell.vacation,
            hoursLabel: this.formatHours(cell.vacation),
            pending: cell.vacationPending
          })
        }
        if (cell.leaves > 0) {
          events.push({
            date: cell.dateKey,
            dateLabel: this.$dateFns.format(new Date(cell.dateKey + 'T00:00:00'), 'EEEE d MMMM'),
            type: 'leaves',
            typeLabel: this.$t('calendar_page.leaves_label'),
            hours: cell.leaves,
            hoursLabel: this.formatHours(cell.leaves),
            pending: cell.leavesPending
          })
        }
      }
      return events
    },
    monthVacationTotal () {
      let total = 0
      for (const day of Object.values(this.planningsByDate)) {
        total += day.vacation
      }
      return this.formatHours(total)
    },
    monthLeavesTotal () {
      let total = 0
      for (const day of Object.values(this.planningsByDate)) {
        total += day.leaves
      }
      return this.formatHours(total)
    }
  },
  watch: {
    monthOffset () {
      this.fetchPlannings()
      this.createdDates = new Set()
      this.exportResult = null
    }
  },
  mounted () {
    this.fetchPlannings()
    this.fetchRequests()
    this.fetchHolidays()
  },
  beforeDestroy () {
    document.removeEventListener('mouseup', this.onDocumentMouseUp)
  },
  methods: {
    async fetchPlannings () {
      if (!this.$store.getters['user/canMakeRequests']) {
        return
      }
      try {
        const response = await this.$axios.$get('planningboard', {
          params: { from: this.monthFrom, to: this.monthTo }
        })
        const plannings = response?.data?.plannings || {}
        const flat = []
        for (const group of Object.values(plannings)) {
          if (Array.isArray(group)) {
            flat.push(...group)
          }
        }
        this.plannings = flat
      } catch {
        this.plannings = []
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
    async fetchRequests () {
      if (!this.$store.getters['user/canMakeRequests']) {
        return
      }
      this.requestsLoading = true
      try {
        let offset = 0
        const allRaw = []

        while (true) {
          const response = await this.$axios.$get('allocation-request', {
            params: {
              offset,
              limit: REQUESTS_PAGE_SIZE,
              ownership: 'mine',
              search: '',
              order: 'status',
              sort: 'desc'
            }
          })

          const page = Array.isArray(response?.data) ? response.data : []
          if (page.length === 0) { break }

          allRaw.push(...page)
          offset += page.length

          if (page.length < REQUESTS_PAGE_SIZE) { break }
        }

        this.allRequests = allRaw.map(raw => this.mapRequest(raw))
      } catch {
        this.allRequests = []
      } finally {
        this.requestsLoading = false
      }
    },
    mapRequest (raw) {
      const isVacation = raw.project?.id === VACATION_PROJECT_ID
      const typeLabel = isVacation
        ? this.$t('calendar_page.vacation_label')
        : this.$t('calendar_page.leaves_label')

      const days = raw.days || []
      const sortedDates = days.map(dayEntry => dayEntry.date || dayEntry.day).filter(Boolean).sort()

      let firstDate = sortedDates[0]
      let lastDate = sortedDates[sortedDates.length - 1]

      if (!firstDate) {
        firstDate = raw.from || raw.date_from || raw.start_date || ''
        lastDate = raw.to || raw.date_to || raw.end_date || firstDate
      }

      let dateRange = ''
      let dateRangeShort = ''
      if (firstDate) {
        if (firstDate === lastDate) {
          dateRange = this.$dateFns.format(new Date(firstDate + 'T00:00:00'), 'd MMM yyyy')
          dateRangeShort = this.$dateFns.format(new Date(firstDate + 'T00:00:00'), 'dd/MM/yy')
        } else {
          const start = this.$dateFns.format(new Date(firstDate + 'T00:00:00'), 'd MMM')
          const end = this.$dateFns.format(new Date(lastDate + 'T00:00:00'), 'd MMM yyyy')
          dateRange = `${start} – ${end}`
          const startShort = this.$dateFns.format(new Date(firstDate + 'T00:00:00'), 'dd/MM/yy')
          const endShort = this.$dateFns.format(new Date(lastDate + 'T00:00:00'), 'dd/MM/yy')
          dateRangeShort = `${startShort} – ${endShort}`
        }
      }

      const totalHours = days.reduce((sum, dayEntry) => sum + (dayEntry.hours || 0), 0)

      const rawNotes = raw.notes || ''
      const userNotes = SYSTEM_NOTE_PATTERN.test(rawNotes) ? '' : rawNotes

      return {
        id: raw.id,
        projectId: raw.project?.id,
        typeLabel,
        status: raw.status,
        dateRange,
        dateRangeShort,
        totalHoursLabel: this.formatHours(totalHours || raw.hours || 0),
        firstDate,
        lastDate,
        notes: userNotes,
        days
      }
    },
    navigateToRequest (request) {
      if (!request.firstDate) { return }
      const targetDate = new Date(request.firstDate + 'T00:00:00')
      const todayMonth = startOfMonth(this.today)
      this.monthOffset = differenceInCalendarMonths(targetDate, todayMonth)
    },
    requestClasses (request) {
      if (request.status === 'pending') {
        return 'border-pending'
      }
      return 'border-stroke-muted'
    },
    statusBadgeClasses (status) {
      if (status === 'pending') {
        return 'bg-pending-soft text-pending-text'
      }
      if (status === 'approved') {
        return 'bg-vacation-soft text-vacation-text'
      }
      return 'bg-card-hover text-ink-muted'
    },
    statusLabel (status) {
      if (status === 'pending') { return this.$t('calendar_page.pending') }
      if (status === 'approved') { return this.$t('calendar_page.approved') }
      return status
    },
    statusIcon (status) {
      if (status === 'approved') { return 'circle-check-icon' }
      if (status === 'pending') { return 'clock-icon' }
      return 'circle-x-icon'
    },
    statusIconClasses (status) {
      if (status === 'approved') { return 'text-vacation-text' }
      if (status === 'pending') { return 'text-pending-text' }
      return 'text-ink-muted'
    },
    formatHours (value) {
      if (!value) { return '0h' }
      let hours = Math.floor(value)
      let minutes = Math.round((value - hours) * 60)
      if (minutes >= 60) { hours += 1; minutes = 0 }
      if (minutes === 0) { return `${hours}h` }
      return `${hours}h ${minutes}m`
    },
    formatDateChip (dateStr) {
      return this.$dateFns.format(new Date(dateStr + 'T00:00:00'), 'EEE d MMM')
    },
    cellClasses (cell) {
      if (!cell.dayNumber) {
        return 'border-transparent'
      }
      if (cell.isWeekend || cell.isHoliday) {
        return 'border-transparent bg-card-dim text-ink-disabled'
      }

      const isSelected = this.selectedDates.has(cell.dateKey)
      if (isSelected) {
        return 'ring-2 ring-accent bg-accent-soft border-accent cursor-pointer'
      }

      const hasAny = cell.vacation > 0 || cell.leaves > 0
      if (!hasAny) {
        if (cell.isToday) {
          return 'border-accent bg-card cursor-pointer'
        }
        return 'border-stroke-muted bg-card cursor-pointer hover:bg-card-hover'
      }

      const anyPending = (cell.vacation > 0 && cell.vacationPending) || (cell.leaves > 0 && cell.leavesPending)
      if (anyPending) {
        return 'border-2 border-pending bg-pending-soft cursor-pointer'
      }
      return 'border-vacation bg-vacation-soft cursor-pointer'
    },

    onCellMouseDown (cell, event) {
      if (!cell.dayNumber || cell.isWeekend || cell.isHoliday) { return }
      event.preventDefault()
      this.isDragging = true
      this.dragStartDate = cell.dateKey
      this.dragEndDate = cell.dateKey
      document.addEventListener('mouseup', this.onDocumentMouseUp)
    },
    onCellMouseEnter (cell) {
      if (!this.isDragging || !cell.dayNumber) { return }
      this.dragEndDate = cell.dateKey
    },
    onDocumentMouseUp () {
      document.removeEventListener('mouseup', this.onDocumentMouseUp)
      if (!this.isDragging) { return }
      this.isDragging = false

      const dates = [...this.selectedDates].sort()
      this.dragStartDate = null
      this.dragEndDate = null

      if (dates.length === 0) { return }

      if (dates.length === 1) {
        const dayData = this.planningsByDate[dates[0]]
        if (dayData && (dayData.vacation > 0 || dayData.leaves > 0)) {
          this.openEditModal(dates[0], dayData)
          return
        }
      }

      const emptyDates = dates.filter((dateStr) => {
        const dayData = this.planningsByDate[dateStr]
        return !dayData || (dayData.vacation === 0 && dayData.leaves === 0)
      })

      if (emptyDates.length === 0) { return }

      this.openCreateModal(emptyDates)
    },

    openCreateModal (dates) {
      this.requestModalMode = 'create'
      this.editingRequest = null
      this.modalProjectId = VACATION_PROJECT_ID
      this.modalHoursPerDay = 8
      this.modalNotes = ''
      this.modalDates = dates
      this.requestError = null
      this.showRequestModal = true
    },
    openEditModal (dateKey, dayData) {
      const requestIds = dayData.requestIds || []
      if (requestIds.length === 0) { return }

      const request = this.allRequests.find(candidate => requestIds.includes(candidate.id))
      if (!request) { return }

      this.openEditFromRequest(request)
    },
    openEditFromRequest (request) {
      this.requestModalMode = 'edit'
      this.editingRequest = request
      this.modalProjectId = request.projectId
      this.modalNotes = request.notes
      this.modalDates = request.days.map(dayEntry => dayEntry.date || dayEntry.day).filter(Boolean).sort()
      this.modalHoursPerDay = request.days[0]?.hours || 8
      this.requestError = null
      this.showRequestModal = true
    },
    removeModalDate (dateIndex) {
      this.modalDates = this.modalDates.filter((_, filterIndex) => filterIndex !== dateIndex)
    },
    async submitRequest () {
      this.requestSaving = true
      this.requestError = null
      try {
        if (this.requestModalMode === 'create') {
          await this.$axios.$post('allocation-request', {
            notes: this.modalNotes,
            days: this.modalDates.map(date => ({ date, hours: this.modalHoursPerDay })),
            project: this.modalProjectId
          })
        } else {
          await this.$axios.$patch(`allocation-request/${this.editingRequest.id}`, {
            notes: this.modalNotes,
            project: this.modalProjectId
          })
        }
        this.showRequestModal = false
        await this.refreshData()
      } catch (error) {
        this.requestError = error.response?.data?.message || this.$t('calendar_page.request_error')
      } finally {
        this.requestSaving = false
      }
    },
    async deleteRequest () {
      if (!window.confirm(this.$t('calendar_page.delete_confirm_message'))) { return }
      this.requestDeleting = true
      this.requestError = null
      try {
        await this.$axios.$delete(`allocation-request/${this.editingRequest.id}`)
        this.showRequestModal = false
        await this.refreshData()
      } catch (error) {
        this.requestError = error.response?.data?.message || this.$t('calendar_page.request_error')
      } finally {
        this.requestDeleting = false
      }
    },
    async deleteRequestDirect (request) {
      if (!window.confirm(this.$t('calendar_page.delete_confirm_message'))) { return }
      try {
        await this.$axios.$delete(`allocation-request/${request.id}`)
        await this.refreshData()
      } catch {
        // silently fail
      }
    },
    async refreshData () {
      this.pastVisibleCount = 10
      await Promise.all([this.fetchPlannings(), this.fetchRequests()])
    },
    loadMorePast () {
      this.pastVisibleCount += 10
    },

    async addDayToCalendar (cell) {
      if (this.createdDates.has(cell.dateKey)) { return }
      try {
        const nextDay = this.$dateFns.format(
          this.$dateFns.addDays(new Date(cell.dateKey + 'T00:00:00'), 1),
          'yyyy-MM-dd'
        )
        await createOutOfOfficeEvent(cell.dateKey, nextDay)
        this.createdDates = new Set([...this.createdDates, cell.dateKey])
      } catch (error) {
        console.error('Failed to create GCal event:', error)
        this.exportResult = {
          success: false,
          message: this.$t('error') + ': ' + (error.message || 'Google Calendar non raggiungibile')
        }
      }
    },
    async confirmExport () {
      this.exporting = true
      this.exportResult = null
      let created = 0
      try {
        for (const dateStr of this.uniqueExportDates) {
          if (this.createdDates.has(dateStr)) { continue }
          const nextDay = this.$dateFns.format(
            this.$dateFns.addDays(new Date(dateStr + 'T00:00:00'), 1),
            'yyyy-MM-dd'
          )
          await createOutOfOfficeEvent(dateStr, nextDay)
          this.createdDates = new Set([...this.createdDates, dateStr])
          created++
        }
        this.exportResult = {
          success: true,
          message: this.$t('calendar_page.export_success', { count: created })
        }
      } catch (error) {
        console.error('Failed to create GCal events:', error)
        this.exportResult = {
          success: false,
          message: this.$t('error') + ': ' + (error.message || 'Google Calendar non raggiungibile')
        }
      } finally {
        this.exporting = false
        this.showExportModal = false
      }
    }
  }
}
</script>
