<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-6xl px-6">
      <div class="flex gap-6 items-start">
        <!-- Calendar panel -->
        <div ref="calendarPanel" class="flex-1 min-w-0 bg-card shadow rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-bold text-ink">
              {{ $t('calendar_page.title') }}
            </h1>
            <div class="flex items-center gap-3">
              <button
                v-if="exportableEvents.length"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg gcal-btn transition-colors"
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
                  class="p-2 text-ink-muted hover:bg-card-hover rounded-l-lg transition-colors focus:outline-none"
                  @click="monthOffset--"
                >
                  <chevron-left-icon size="18" />
                </button>
                <span class="px-4 py-1.5 text-sm font-semibold text-ink border-l border-r border-stroke-muted select-none capitalize">
                  {{ displayedMonthLabel }}
                </span>
                <button
                  class="p-2 text-ink-muted hover:bg-card-hover rounded-r-lg transition-colors focus:outline-none"
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
                  <span class="text-sm font-semibold text-ink" :class="cell.isToday ? 'text-accent-fg' : ''">
                    {{ cell.dayNumber }}
                  </span>
                  <button
                    v-if="(cell.vacation > 0 || cell.leaves > 0) && !cell.isWeekend && !cell.isHoliday"
                    class="gcal-icon hover:opacity-70 transition-opacity disabled:opacity-30"
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
        <div class="w-72 shrink-0 sticky top-20 flex flex-col" :style="{ maxHeight: sidebarMaxHeight }">
          <div class="bg-card shadow rounded-lg p-3 flex flex-col min-h-0 flex-1 overflow-hidden">
            <h2 class="text-xs font-bold text-ink-muted uppercase tracking-wide mb-2 px-1">
              {{ $t('calendar_page.requests_upcoming') }}
            </h2>

            <div v-if="requestsLoading" class="space-y-2 px-1">
              <div v-for="skeleton in 4" :key="skeleton" class="animate-pulse">
                <span class="inline-block w-full h-6 bg-stroke-muted rounded" />
              </div>
            </div>

            <div v-else-if="upcomingRequests.length === 0" class="text-xs text-ink-muted py-4 text-center">
              {{ $t('calendar_page.requests_empty') }}
            </div>

            <div v-else class="overflow-y-auto custom-scrollbar min-h-0">
              <div v-for="group in upcomingByMonth" :key="group.monthKey" class="mb-2 last:mb-0">
                <div class="text-[10px] font-semibold text-ink-faint uppercase tracking-wide px-1 py-1 capitalize">
                  {{ group.label }}
                </div>
                <div>
                  <div
                    v-for="request in group.requests"
                    :key="request.id"
                    class="sidebar-request-row group"
                  >
                    <button class="sidebar-request-btn" @click="navigateToRequest(request)">
                      <span class="sidebar-date">{{ request.dateDayOnly }}</span>
                      <span class="sidebar-hours">{{ request.totalHoursLabel }}</span>
                      <span
                        class="sidebar-type"
                        :class="request.projectId === vacationProjectId ? 'pill-ferie' : 'pill-permesso'"
                        :title="request.typeLabel"
                      >{{ request.typeShort }}</span>
                      <component
                        :is="statusIcon(request.status)"
                        :size="15"
                        :class="statusIconClasses(request.status)"
                        :title="statusLabel(request.status)"
                        class="shrink-0"
                      />
                    </button>
                    <div class="sidebar-actions">
                      <button
                        class="p-0.5 rounded text-ink-faint hover:text-accent-fg transition-colors"
                        :title="$t('edit')"
                        @click="openEditFromRequest(request)"
                      >
                        <edit-icon :size="14" />
                      </button>
                      <button
                        class="p-0.5 rounded text-ink-faint hover:text-danger transition-colors"
                        :title="$t('delete')"
                        @click="deleteRequestDirect(request)"
                      >
                        <trash-icon :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Past requests history -->
      <div class="mt-6 bg-card shadow rounded-lg p-4">
        <div class="flex items-center justify-between mb-2 px-1">
          <h2 class="text-xs font-bold text-ink-muted uppercase tracking-wide">
            {{ $t('calendar_page.history_title') }}
          </h2>
          <input
            v-model="historySearch"
            type="text"
            class="w-40 px-2 py-1 text-xs rounded border border-stroke bg-card-hover text-ink placeholder-ink-faint focus:outline-none focus:ring-1 focus:ring-focus-ring"
            :placeholder="$t('calendar_page.history_search_placeholder')"
          >
        </div>

        <div v-if="requestsLoading" class="space-y-2 px-1">
          <div v-for="skeleton in 3" :key="skeleton" class="animate-pulse">
            <span class="inline-block w-full h-6 bg-stroke-muted rounded" />
          </div>
        </div>

        <div v-else-if="pastRequests.length === 0" class="text-xs text-ink-muted py-4 text-center">
          {{ $t('calendar_page.no_past_requests') }}
        </div>

        <div v-else ref="historyScroll" class="max-h-96 overflow-y-auto custom-scrollbar" @scroll="onHistoryScroll">
          <div v-for="group in pastByMonth" :key="group.monthKey" class="mb-2 last:mb-0">
            <div class="text-[10px] font-semibold text-ink-faint uppercase tracking-wide px-1 py-1 capitalize">
              {{ group.label }}
            </div>
            <div>
              <div
                v-for="request in group.requests"
                :key="request.id"
                class="sidebar-request-row group"
              >
                <button class="sidebar-request-btn" @click="navigateToRequest(request)">
                  <span class="sidebar-date">{{ request.dateDayOnly }}</span>
                  <span class="sidebar-hours">{{ request.totalHoursLabel }}</span>
                  <span
                    class="sidebar-type"
                    :class="request.projectId === vacationProjectId ? 'pill-ferie' : 'pill-permesso'"
                    :title="request.typeLabel"
                  >{{ request.typeShort }}</span>
                  <component
                    :is="statusIcon(request.status)"
                    :size="15"
                    :class="statusIconClasses(request.status)"
                    :title="statusLabel(request.status)"
                    class="shrink-0"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
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

    <!-- Time picker modal for GCal export -->
    <modal v-model="showTimePickModal">
      <h3 class="text-lg font-bold text-ink mb-1">
        {{ $t('calendar_page.time_pick_title') }}
      </h3>
      <p class="text-sm text-ink-muted mb-4 text-center">
        {{ $t('calendar_page.time_pick_description') }}
      </p>

      <template v-if="currentTimePick">
        <!-- Progress -->
        <p v-if="timePickEvents.length > 1" class="text-xs text-ink-faint mb-3 tabular-nums">
          {{ timePickIndex + 1 }} / {{ timePickEvents.length }}
        </p>

        <!-- Day label -->
        <div class="w-full rounded-lg bg-card-hover px-4 py-3 mb-4">
          <span class="text-sm font-semibold text-ink capitalize">{{ currentTimePick.dateLabel }}</span>
          <span class="text-xs text-ink-muted ml-2">{{ currentTimePick.hoursLabel }}</span>
        </div>

        <!-- Presets (only for 4h) -->
        <div v-if="currentTimePick.hours === 4" class="w-full flex gap-2 mb-3">
          <button
            class="flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors text-center"
            :class="timePickMode === 'morning' ? 'time-pick-active' : 'time-pick-inactive'"
            @click="timePickMode = 'morning'; timePickCustomStart = '09:00'; timePickCustomEnd = '13:00'"
          >
            <span class="block text-sm font-medium">{{ $t('calendar_page.time_pick_morning') }}</span>
            <span class="block text-xs opacity-70 mt-0.5">{{ $t('calendar_page.time_pick_morning_range') }}</span>
          </button>
          <button
            class="flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors text-center"
            :class="timePickMode === 'afternoon' ? 'time-pick-active' : 'time-pick-inactive'"
            @click="timePickMode = 'afternoon'; timePickCustomStart = '14:00'; timePickCustomEnd = '18:00'"
          >
            <span class="block text-sm font-medium">{{ $t('calendar_page.time_pick_afternoon') }}</span>
            <span class="block text-xs opacity-70 mt-0.5">{{ $t('calendar_page.time_pick_afternoon_range') }}</span>
          </button>
          <button
            class="flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors text-center"
            :class="timePickMode === 'custom' ? 'time-pick-active' : 'time-pick-inactive'"
            @click="timePickMode = 'custom'"
          >
            <span class="block text-sm font-medium">{{ $t('calendar_page.time_pick_custom') }}</span>
          </button>
        </div>

        <!-- Custom time inputs (shown for non-4h always, for 4h only when custom selected) -->
        <div v-if="currentTimePick.hours !== 4 || timePickMode === 'custom'" class="w-full flex items-center gap-3 mb-4">
          <label class="text-xs text-ink-muted whitespace-nowrap">{{ $t('calendar_page.time_pick_start') }}</label>
          <input
            v-model="timePickCustomStart"
            type="time"
            class="time-pick-input"
          >
          <label class="text-xs text-ink-muted whitespace-nowrap">{{ $t('calendar_page.time_pick_end') }}</label>
          <input
            v-model="timePickCustomEnd"
            type="time"
            class="time-pick-input"
          >
        </div>

        <!-- Actions -->
        <div class="flex gap-2 w-full">
          <button
            v-if="timePickEvents.length > 1"
            class="px-3 py-2 text-xs font-medium rounded-lg gcal-btn transition-colors"
            @click="applyTimePickToAll"
          >
            {{ $t('calendar_page.time_pick_apply_all') }}
          </button>
          <div class="flex-1" />
          <button
            class="px-4 py-2 text-sm rounded-lg border border-stroke text-ink-secondary hover:bg-card-hover transition-colors"
            @click="showTimePickModal = false"
          >
            {{ $t('calendar_page.cancel') }}
          </button>
          <button
            class="px-4 py-2 text-sm font-medium rounded-lg gcal-btn transition-colors disabled:opacity-50"
            :disabled="exporting"
            @click="confirmTimePick"
          >
            {{ timePickIndex < timePickEvents.length - 1 ? $t('calendar_page.time_pick_next') : $t('calendar_page.time_pick_confirm') }}
          </button>
        </div>
      </template>
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
    pastVisibleCount: 10,
    calendarHeight: 0,
    historySearch: '',

    showTimePickModal: false,
    timePickEvents: [],
    timePickIndex: 0,
    timePickChoices: {},
    timePickMode: 'morning',
    timePickCustomStart: '09:00',
    timePickCustomEnd: '13:00',
    timePickSingleCell: null
  }),
  computed: {
    vacationProjectId () { return VACATION_PROJECT_ID },
    leavesProjectId () { return LEAVES_PROJECT_ID },
    sidebarMaxHeight () {
      return this.calendarHeight ? `${this.calendarHeight}px` : 'none'
    },
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
    upcomingByMonth () {
      const groups = []
      let currentKey = ''
      for (const request of this.upcomingRequests) {
        if (!request.firstDate) { continue }
        const monthKey = request.firstDate.substring(0, 7)
        if (monthKey !== currentKey) {
          currentKey = monthKey
          const label = this.$dateFns.format(new Date(request.firstDate + 'T00:00:00'), 'MMMM yyyy')
          groups.push({ monthKey, label, requests: [] })
        }
        groups[groups.length - 1].requests.push(request)
      }
      return groups
    },
    allPastRequests () {
      return this.allRequests
        .filter(request => !request.lastDate || request.lastDate < this.todayStr)
        .sort((first, second) => (second.firstDate || '').localeCompare(first.firstDate || ''))
    },
    filteredPastRequests () {
      const query = this.historySearch.trim().toLowerCase()
      if (!query) { return this.allPastRequests }
      const queryWords = query.split(/\s+/).filter(Boolean)
      return this.allPastRequests.filter((request) => {
        if (!request.firstDate) { return false }
        const date = new Date(request.firstDate + 'T00:00:00')
        const fullMonth = this.$dateFns.format(date, 'MMMM yyyy').toLowerCase()
        const shortMonth = this.$dateFns.format(date, 'MMM yyyy').toLowerCase()
        const numericMonth = this.$dateFns.format(date, 'MM/yy')
        const numericMonthFull = this.$dateFns.format(date, 'MM/yyyy')
        const yearOnly = this.$dateFns.format(date, 'yyyy')
        const haystack = `${fullMonth} ${shortMonth} ${numericMonth} ${numericMonthFull} ${yearOnly}`
        return queryWords.every(word => haystack.includes(word))
      })
    },
    pastRequests () {
      return this.filteredPastRequests.slice(0, this.pastVisibleCount)
    },
    hasMorePast () {
      return this.pastVisibleCount < this.filteredPastRequests.length
    },
    pastByMonth () {
      const groups = []
      let currentKey = ''
      for (const request of this.pastRequests) {
        if (!request.firstDate) { continue }
        const monthKey = request.firstDate.substring(0, 7)
        if (monthKey !== currentKey) {
          currentKey = monthKey
          const label = this.$dateFns.format(new Date(request.firstDate + 'T00:00:00'), 'MMMM yyyy')
          groups.push({ monthKey, label, requests: [] })
        }
        groups[groups.length - 1].requests.push(request)
      }
      return groups
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
    },
    currentTimePick () {
      return this.timePickEvents[this.timePickIndex] || null
    }
  },
  watch: {
    monthOffset () {
      this.fetchPlannings()
      this.createdDates = new Set()
      this.exportResult = null
    },
    historySearch () {
      this.pastVisibleCount = 10
    },
    showTimePickModal (visible) {
      if (!visible) {
        this.timePickSingleCell = null
      }
    }
  },
  mounted () {
    this.fetchPlannings()
    this.fetchRequests()
    this.fetchHolidays()
    this.$nextTick(() => this.measureCalendar())
  },
  updated () {
    this.measureCalendar()
  },
  beforeDestroy () {
    document.removeEventListener('mouseup', this.onDocumentMouseUp)
  },
  methods: {
    measureCalendar () {
      const panel = this.$refs.calendarPanel
      if (panel) {
        this.calendarHeight = panel.offsetHeight
      }
    },
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
      let dateDayOnly = ''
      if (firstDate) {
        const startDate = new Date(firstDate + 'T00:00:00')
        if (firstDate === lastDate) {
          dateRange = this.$dateFns.format(startDate, 'd MMM yyyy')
          dateRangeShort = this.$dateFns.format(startDate, 'dd/MM/yy')
          dateDayOnly = String(startDate.getDate())
        } else {
          const endDate = new Date(lastDate + 'T00:00:00')
          const start = this.$dateFns.format(startDate, 'd MMM')
          const end = this.$dateFns.format(endDate, 'd MMM yyyy')
          dateRange = `${start} – ${end}`
          const sameMonth = firstDate.substring(0, 7) === lastDate.substring(0, 7)
          if (sameMonth) {
            dateRangeShort = `${startDate.getDate()}–${endDate.getDate()}/${this.$dateFns.format(endDate, 'MM/yy')}`
            dateDayOnly = `${startDate.getDate()}–${endDate.getDate()}`
          } else {
            dateRangeShort = `${startDate.getDate()}/${this.$dateFns.format(startDate, 'MM')}–${endDate.getDate()}/${this.$dateFns.format(endDate, 'MM/yy')}`
            dateDayOnly = `${startDate.getDate()}/${this.$dateFns.format(startDate, 'MM')}–${endDate.getDate()}/${this.$dateFns.format(endDate, 'MM')}`
          }
        }
      }

      const totalHours = days.reduce((sum, dayEntry) => sum + (dayEntry.hours || 0), 0)

      const rawNotes = raw.notes || ''
      const userNotes = SYSTEM_NOTE_PATTERN.test(rawNotes) ? '' : rawNotes

      const typeShort = isVacation ? 'F' : 'P'

      return {
        id: raw.id,
        projectId: raw.project?.id,
        typeLabel,
        typeShort,
        status: raw.status,
        dateRange,
        dateRangeShort,
        dateDayOnly,
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
      if (status === 'rejected') { return this.$t('calendar_page.rejected') }
      if (status === 'conflict') { return this.$t('calendar_page.conflict') }
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
      if (status === 'rejected' || status === 'conflict') { return 'text-danger' }
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
    onHistoryScroll () {
      if (!this.hasMorePast) { return }
      const container = this.$refs.historyScroll
      if (!container) { return }
      const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 40
      if (nearBottom) {
        this.loadMorePast()
      }
    },

    addDayToCalendar (cell) {
      if (this.createdDates.has(cell.dateKey)) { return }
      const totalHours = (cell.vacation || 0) + (cell.leaves || 0)
      const event = {
        date: cell.dateKey,
        dateLabel: this.$dateFns.format(new Date(cell.dateKey + 'T00:00:00'), 'EEEE d MMMM'),
        hours: totalHours,
        hoursLabel: this.formatHours(totalHours)
      }
      this.timePickSingleCell = cell
      if (totalHours >= 8) {
        this.executeGCalExport([event])
        this.timePickSingleCell = null
      } else {
        this.timePickChoices = {}
        this.openTimePicker([event])
      }
    },
    confirmExport () {
      const events = this.exportableEvents
        .filter(event => !this.createdDates.has(event.date))
      this.showExportModal = false
      this.startGCalFlow(events)
    },
    aggregateByDate (events) {
      const byDate = {}
      for (const event of events) {
        if (!byDate[event.date]) {
          byDate[event.date] = { ...event, hours: 0 }
        }
        byDate[event.date].hours += event.hours
        byDate[event.date].hoursLabel = this.formatHours(byDate[event.date].hours)
      }
      return Object.values(byDate)
    },
    startGCalFlow (events) {
      const aggregated = this.aggregateByDate(events)
      const needsTime = aggregated.filter(event => event.hours < 8)
      const fullDay = aggregated.filter(event => event.hours >= 8)

      const choices = {}
      for (const event of fullDay) {
        choices[event.date] = { allDay: true }
      }
      this.timePickChoices = choices

      if (needsTime.length === 0) {
        this.executeGCalExport(aggregated)
      } else {
        this.openTimePicker(needsTime)
      }
    },
    openTimePicker (needsTime) {
      this.timePickEvents = needsTime
      this.timePickIndex = 0
      this.timePickMode = needsTime[0]?.hours === 4 ? 'morning' : 'custom'
      this.timePickCustomStart = '09:00'
      this.timePickCustomEnd = '13:00'
      this.showTimePickModal = true
    },
    confirmTimePick () {
      const event = this.currentTimePick
      let startTime, endTime
      if (this.timePickMode === 'morning') {
        startTime = '09:00'
        endTime = '13:00'
      } else if (this.timePickMode === 'afternoon') {
        startTime = '14:00'
        endTime = '18:00'
      } else {
        startTime = this.timePickCustomStart
        endTime = this.timePickCustomEnd
      }
      this.timePickChoices = {
        ...this.timePickChoices,
        [event.date]: { startTime, endTime }
      }

      if (this.timePickIndex < this.timePickEvents.length - 1) {
        this.timePickIndex++
        const nextEvent = this.timePickEvents[this.timePickIndex]
        this.timePickMode = nextEvent.hours === 4 ? 'morning' : 'custom'
        this.timePickCustomStart = '09:00'
        this.timePickCustomEnd = '13:00'
      } else {
        this.showTimePickModal = false
        this.finishTimePickFlow()
      }
    },
    applyTimePickToAll () {
      let startTime, endTime
      if (this.timePickMode === 'morning') {
        startTime = '09:00'
        endTime = '13:00'
      } else if (this.timePickMode === 'afternoon') {
        startTime = '14:00'
        endTime = '18:00'
      } else {
        startTime = this.timePickCustomStart
        endTime = this.timePickCustomEnd
      }

      const updatedChoices = { ...this.timePickChoices }
      for (let eventIndex = this.timePickIndex; eventIndex < this.timePickEvents.length; eventIndex++) {
        updatedChoices[this.timePickEvents[eventIndex].date] = { startTime, endTime }
      }
      this.timePickChoices = updatedChoices

      this.showTimePickModal = false
      this.finishTimePickFlow()
    },
    finishTimePickFlow () {
      const allDates = Object.keys(this.timePickChoices)
      const events = allDates.map(date => ({ date }))
      this.executeGCalExport(events)
      this.timePickSingleCell = null
    },
    async executeGCalExport (events) {
      this.exporting = true
      this.exportResult = null
      let created = 0
      try {
        const dedupedDates = [...new Set(events.map(event => event.date))]
        for (const dateStr of dedupedDates) {
          if (this.createdDates.has(dateStr)) { continue }
          const nextDay = this.$dateFns.format(
            this.$dateFns.addDays(new Date(dateStr + 'T00:00:00'), 1),
            'yyyy-MM-dd'
          )
          const choice = this.timePickChoices[dateStr]
          const options = choice && !choice.allDay ? { startTime: choice.startTime, endTime: choice.endTime } : {}
          await createOutOfOfficeEvent(dateStr, nextDay, options)
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

<style scoped>
  .sidebar-request-row {
    @apply flex items-center rounded transition-colors px-2;
    gap: 0.75rem;
    min-height: 2.25rem;
  }

  .sidebar-request-row:hover {
    @apply bg-card-hover;
  }

  .sidebar-request-btn {
    @apply flex-1 min-w-0 flex items-center text-left;
    gap: 0.75rem;
  }

  .sidebar-date {
    @apply text-sm font-semibold text-ink tabular-nums whitespace-nowrap;
    width: 3rem;
    flex-shrink: 0;
  }

  .sidebar-hours {
    @apply text-xs text-ink-muted whitespace-nowrap tabular-nums;
    width: 2rem;
    flex-shrink: 0;
  }

  .sidebar-type {
    @apply text-[10px] font-bold leading-none px-1.5 py-0.5 rounded;
    flex-shrink: 0;
    min-width: 1.25rem;
    text-align: center;
  }

  .sidebar-actions {
    @apply flex items-center shrink-0 opacity-0 transition-opacity;
    gap: 0.25rem;
  }

  .sidebar-request-row:hover .sidebar-actions {
    @apply opacity-100;
  }

  /* F/P type pills */
  .pill-ferie {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
  }
  .pill-permesso {
    background: var(--color-accent);
    color: #fff;
  }

  /* GCal icon on calendar cells */
  .gcal-icon {
    color: #4285F4;
  }

  /* GCal "Aggiungi tutto al calendario" button */
  .gcal-btn {
    background: rgba(66, 133, 244, 0.12);
    color: #4285F4;
    border: 1px solid rgba(66, 133, 244, 0.3);
  }
  .gcal-btn:hover {
    background: #4285F4;
    color: #fff;
  }

  /* Time picker preset buttons */
  .time-pick-active {
    border-color: #4285F4;
    background: rgba(66, 133, 244, 0.12);
    color: #4285F4;
  }
  .time-pick-inactive {
    border-color: var(--color-stroke);
    color: var(--color-ink-muted);
    background: transparent;
  }
  .time-pick-inactive:hover {
    background: var(--color-card-hover);
  }

  /* Time inputs */
  .time-pick-input {
    @apply flex-1 px-3 py-2 text-sm rounded-lg border border-stroke text-ink;
    background: var(--color-card-hover);
    color-scheme: light;
  }
  .time-pick-input:focus {
    @apply outline-none ring-1 ring-focus-ring;
  }
</style>

<style>
  .dark .pill-ferie {
    background: rgba(251, 191, 36, 0.18);
    color: #fbbf24;
  }
  .dark .pill-permesso {
    color: #1e1b4b;
  }
  .dark .gcal-icon {
    color: #6ea8ff;
  }
  .dark .gcal-btn {
    background: rgba(110, 168, 255, 0.15);
    color: #6ea8ff;
    border-color: rgba(110, 168, 255, 0.35);
  }
  .dark .gcal-btn:hover {
    background: #6ea8ff;
    color: #1a1a2e;
  }
  .dark .time-pick-active {
    border-color: #6ea8ff;
    background: rgba(110, 168, 255, 0.15);
    color: #6ea8ff;
  }
  .dark .time-pick-input {
    color-scheme: dark;
  }
</style>
