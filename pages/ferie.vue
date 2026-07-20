<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-6xl px-6">
      <div class="flex gap-6 items-start">
        <!-- Calendar panel -->
        <div ref="calendarPanel" class="flex-1 min-w-0 bg-card shadow rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-xl font-bold text-ink">{{ $t('calendar_page.title') }}</h1>
            <div class="flex items-center gap-3">
              <button
                v-if="exportableEvents.length"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer gcal-btn transition-colors"
                @click="showExportModal = true"
              >
                <icons-google-calendar-icon :size="14" />
                {{ $t('calendar_page.export_month') }}
              </button>
              <button
                v-if="monthOffset !== 0"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-soft text-accent-fg cursor-pointer hover:bg-accent-soft transition-colors border border-accent"
                @click="monthOffset = 0"
              >
                {{ $t('calendar_page.current_month') }}
              </button>
              <div class="inline-flex items-center bg-card border border-stroke-muted rounded-lg shadow">
                <button class="p-2 text-ink-muted cursor-pointer hover:bg-card-hover rounded-l-lg transition-colors focus:outline-none" @click="monthOffset--">
                  <IconChevronLeft :size="18" />
                </button>
                <span class="px-4 py-1.5 text-sm font-semibold text-ink border-l border-r border-stroke-muted select-none capitalize">
                  {{ displayedMonthLabel }}
                </span>
                <button class="p-2 text-ink-muted cursor-pointer hover:bg-card-hover rounded-r-lg transition-colors focus:outline-none" @click="monthOffset++">
                  <IconChevronRight :size="18" />
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="exportResult"
            class="mb-4 p-3 rounded-lg border text-xs font-medium"
            :class="exportResult.success ? 'border-vacation bg-vacation-soft text-vacation-text' : 'border-danger bg-danger-soft text-danger-text'"
          >
            {{ exportResult.message }}
          </div>

          <div class="grid grid-cols-7 gap-1 select-none">
            <div v-for="dayName in weekdayHeaders" :key="dayName" class="text-center text-xs font-semibold text-ink-faint py-2">
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
                  <span class="text-sm font-semibold text-ink" :class="cell.isToday ? 'text-accent-fg' : ''">{{ cell.dayNumber }}</span>
                  <button
                    v-if="(cell.vacation > 0 || cell.leaves > 0) && !cell.isWeekend && !cell.isHoliday"
                    class="gcal-icon hover:opacity-70 transition-opacity disabled:opacity-30"
                    :disabled="createdDates.has(cell.dateKey)"
                    :title="createdDates.has(cell.dateKey) ? $t('calendar_page.already_added') : $t('calendar_page.add_to_gcal')"
                    @mousedown.stop
                    @click.stop="addDayToCalendar(cell)"
                  >
                    <IconCheck v-if="createdDates.has(cell.dateKey)" :size="14" class="text-vacation" />
                    <icons-google-calendar-icon v-else :size="14" />
                  </button>
                </div>
                <div v-if="cell.isHoliday" class="text-[10px] font-medium text-ink-faint truncate" :title="cell.holidayName">{{ cell.holidayName }}</div>
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
            <span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-sm bg-vacation-soft border border-vacation" />{{ $t('calendar_page.approved') }}</span>
            <span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-sm bg-pending-soft border-2 border-pending" />{{ $t('calendar_page.pending') }}</span>
            <span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-sm bg-card-dim border border-stroke-muted" />{{ $t('calendar_page.holiday_label') }}</span>
          </div>

          <div class="mt-4 pt-4 border-t border-stroke-muted">
            <div class="flex items-center gap-6 text-sm text-ink-secondary">
              <div><span class="font-semibold text-ink">{{ monthVacationTotal }}</span> {{ $t('calendar_page.vacation_label').toLowerCase() }}</div>
              <div><span class="font-semibold text-ink">{{ monthLeavesTotal }}</span> {{ $t('calendar_page.leaves_label').toLowerCase() }}</div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="w-72 shrink-0 sticky top-20 flex flex-col gap-3" :style="{ maxHeight: sidebarMaxHeight }">
          <!-- Budget section (kept compact for brevity — same template as original) -->
          <div class="bg-card shadow rounded-lg p-3 shrink-0">
            <div class="flex items-center justify-between mb-2 px-1">
              <h2 class="text-xs font-bold text-ink-muted uppercase tracking-wide">{{ $t('calendar_page.budget_title', { year: budgetYear }) }}</h2>
              <button v-if="budgetError" class="text-[10px] text-accent-fg hover:underline" @click="fetchTimeOff">{{ $t('calendar_page.budget_retry') }}</button>
            </div>
            <div v-if="budgetLoading" class="flex items-center gap-2 text-[11px] text-ink-muted py-3 px-1">
              <span class="inline-block w-3 h-3 border-2 border-stroke-muted border-t-accent rounded-full animate-spin" />
              {{ $t('calendar_page.budget_loading') }}
            </div>
            <div v-else-if="budgetError" class="text-[11px] text-ink-muted py-3 text-center">{{ $t('calendar_page.budget_error') }}</div>
            <div v-else-if="timeOffData" class="space-y-3 px-1">
              <div v-for="section in budgetSections" :key="section.key">
                <div :class="section.borderTop ? 'pt-2 mt-1 border-t border-stroke-muted' : ''">
                  <div class="flex items-baseline justify-between mb-1">
                    <span class="text-xs font-semibold text-ink">{{ section.label }}</span>
                    <span class="text-[10px] text-ink-muted tabular-nums">{{ formatDays(section.total) }}</span>
                  </div>
                  <div class="budget-bar-track budget-bar-sm">
                    <div class="budget-bar-segment bg-budget-used" :style="{ width: budgetBarWidth(section.used, section.total, section.used, section.planned, section.requested) }" />
                    <div class="budget-bar-segment bg-budget-planned" :style="{ width: budgetBarWidth(section.planned, section.total, section.used, section.planned, section.requested) }" />
                    <div v-if="Number(section.requested) > 0" class="budget-bar-segment bg-budget-requested" :style="{ width: budgetBarWidth(section.requested, section.total, section.used, section.planned, section.requested) }" />
                  </div>
                  <div class="budget-details">
                    <span><span class="inline-block w-1.5 h-1.5 rounded-sm bg-budget-used mr-0.5" />{{ formatDays(section.used) }}</span>
                    <span><span class="inline-block w-1.5 h-1.5 rounded-sm bg-budget-planned mr-0.5" />{{ formatDays(section.planned) }}</span>
                    <span v-if="Number(section.requested) > 0"><span class="inline-block w-1.5 h-1.5 rounded-sm bg-budget-requested mr-0.5" />{{ formatDays(section.requested) }}</span>
                    <span class="font-semibold" :class="remainingClass(section.remaining)">{{ remainingLabel(section.remaining, section.remainingLabelKey) }}</span>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-2 border-t border-stroke-muted text-[10px] text-ink-faint">
                <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-sm bg-budget-used" />{{ $t('calendar_page.budget_used') }}</span>
                <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-sm bg-budget-planned" />{{ $t('calendar_page.budget_planned') }}</span>
                <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-sm bg-budget-requested" />{{ $t('calendar_page.budget_requested') }}</span>
                <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-sm bg-budget-remaining" />{{ $t('calendar_page.budget_remaining') }}</span>
              </div>
            </div>
          </div>

          <!-- Requests sidebar -->
          <div class="bg-card shadow rounded-lg p-3 flex flex-col min-h-0 flex-1 overflow-hidden">
            <div class="sidebar-tabs-wrapper mb-2 mx-1">
              <div class="sidebar-tabs-indicator" :class="{ 'translate-x-full': sidebarTab === 'history' }" />
              <button class="sidebar-tab" :class="sidebarTab === 'upcoming' ? 'sidebar-tab-active' : 'sidebar-tab-inactive'" @click="sidebarTab = 'upcoming'">{{ $t('calendar_page.requests_upcoming') }}</button>
              <button class="sidebar-tab" :class="sidebarTab === 'history' ? 'sidebar-tab-active' : 'sidebar-tab-inactive'" @click="sidebarTab = 'history'">{{ $t('calendar_page.history_title') }}</button>
            </div>
            <div class="px-1 mb-2">
              <input v-model="requestsSearch" type="text" class="w-full px-2 py-1 text-xs rounded border border-stroke bg-card-hover text-ink placeholder-ink-faint focus:outline-none focus:ring-1 focus:ring-focus-ring" :placeholder="$t('calendar_page.history_search_placeholder')">
            </div>
            <div v-if="requestsLoading" class="space-y-2 px-1">
              <div v-for="skeleton in 4" :key="skeleton" class="animate-pulse"><span class="inline-block w-full h-6 bg-stroke-muted rounded" /></div>
            </div>
            <template v-else-if="sidebarTab === 'upcoming'">
              <div v-if="upcomingRequests.length === 0" class="text-xs text-ink-muted py-4 text-center">{{ $t('calendar_page.requests_empty') }}</div>
              <div v-else class="overflow-y-auto custom-scrollbar min-h-0">
                <div v-for="group in upcomingByMonth" :key="group.monthKey" class="mb-2 last:mb-0">
                  <div class="text-[10px] font-semibold text-ink-faint uppercase tracking-wide px-1 py-1 capitalize">{{ group.label }}</div>
                  <div>
                    <div v-for="request in group.requests" :key="request.id" class="sidebar-request-row group">
                      <button class="sidebar-request-btn" @click="navigateToRequest(request)">
                        <span class="sidebar-date">{{ request.dateDayOnly }}</span>
                        <span class="sidebar-hours">{{ request.totalHoursLabel }}</span>
                        <span class="sidebar-type" :class="request.projectId === VACATION_PROJECT_ID ? 'pill-ferie' : 'pill-permesso'" :title="request.typeLabel">{{ request.typeShort }}</span>
                        <component :is="getStatusIcon(request.status)" :size="15" :class="statusIconClasses(request.status)" :title="statusLabel(request.status)" class="shrink-0" />
                      </button>
                      <div class="sidebar-actions">
                        <button class="p-0.5 rounded text-ink-faint cursor-pointer hover:text-accent-fg transition-colors" :title="$t('edit')" @click="openEditFromRequest(request)"><IconEdit :size="14" /></button>
                        <button class="p-0.5 rounded text-ink-faint cursor-pointer hover:text-danger transition-colors" :title="$t('delete')" @click="deleteRequestDirect(request)"><IconTrash :size="14" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div v-if="pastRequests.length === 0" class="text-xs text-ink-muted py-4 text-center">{{ $t('calendar_page.no_past_requests') }}</div>
              <div v-else ref="historyScroll" class="overflow-y-auto custom-scrollbar min-h-0" @scroll="onHistoryScroll">
                <div v-for="group in pastByMonth" :key="group.monthKey" class="mb-2 last:mb-0">
                  <div class="text-[10px] font-semibold text-ink-faint uppercase tracking-wide px-1 py-1 capitalize">{{ group.label }}</div>
                  <div>
                    <div v-for="request in group.requests" :key="request.id" class="sidebar-request-row group">
                      <button class="sidebar-request-btn" @click="navigateToRequest(request)">
                        <span class="sidebar-date">{{ request.dateDayOnly }}</span>
                        <span class="sidebar-hours">{{ request.totalHoursLabel }}</span>
                        <span class="sidebar-type" :class="request.projectId === VACATION_PROJECT_ID ? 'pill-ferie' : 'pill-permesso'" :title="request.typeLabel">{{ request.typeShort }}</span>
                        <component :is="getStatusIcon(request.status)" :size="15" :class="statusIconClasses(request.status)" :title="statusLabel(request.status)" class="shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals (export, time-pick, request create/edit) -->
    <Modal v-model="showExportModal">
      <h3 class="text-lg font-bold text-ink mb-2">{{ $t('calendar_page.export_confirm_title') }}</h3>
      <p class="text-sm text-ink-muted mb-4 text-center">{{ $t('calendar_page.export_confirm_description') }}</p>
      <ul class="w-full space-y-1 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
        <li v-for="event in exportableEvents" :key="event.date + event.type" class="flex items-center justify-between text-xs px-3 py-1.5 rounded bg-card-hover">
          <span class="font-medium text-ink capitalize">{{ event.dateLabel }}</span>
          <span class="text-ink-muted">{{ event.typeLabel }} {{ event.hoursLabel }}</span>
        </li>
      </ul>
      <div class="flex gap-3">
        <button class="px-4 py-2 text-sm rounded-lg border border-stroke text-ink-secondary hover:bg-card-hover transition-colors" @click="showExportModal = false">{{ $t('calendar_page.cancel') }}</button>
        <button class="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-ink-inverse hover:bg-accent-hover transition-colors disabled:opacity-50" :disabled="exporting" @click="confirmExport">
          {{ exporting ? $t('calendar_page.exporting') : $t('calendar_page.export_confirm_button') }}
        </button>
      </div>
    </Modal>

    <Modal v-model="showTimePickModal">
      <h3 class="text-lg font-bold text-ink mb-1">{{ $t('calendar_page.time_pick_title') }}</h3>
      <p class="text-sm text-ink-muted mb-4 text-center">{{ $t('calendar_page.time_pick_description') }}</p>
      <template v-if="currentTimePick">
        <p v-if="timePickEvents.length > 1" class="text-xs text-ink-faint mb-3 tabular-nums">{{ timePickIndex + 1 }} / {{ timePickEvents.length }}</p>
        <div class="w-full rounded-lg bg-card-hover px-4 py-3 mb-4">
          <span class="text-sm font-semibold text-ink capitalize">{{ currentTimePick.dateLabel }}</span>
          <span class="text-xs text-ink-muted ml-2">{{ currentTimePick.hoursLabel }}</span>
        </div>
        <div v-if="currentTimePick.hours === 4" class="w-full flex gap-2 mb-3">
          <button class="flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors text-center" :class="timePickMode === 'morning' ? 'time-pick-active' : 'time-pick-inactive'" @click="timePickMode = 'morning'; timePickCustomStart = '09:00'; timePickCustomEnd = '13:00'">
            <span class="block text-sm font-medium">{{ $t('calendar_page.time_pick_morning') }}</span>
            <span class="block text-xs opacity-70 mt-0.5">{{ $t('calendar_page.time_pick_morning_range') }}</span>
          </button>
          <button class="flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors text-center" :class="timePickMode === 'afternoon' ? 'time-pick-active' : 'time-pick-inactive'" @click="timePickMode = 'afternoon'; timePickCustomStart = '14:00'; timePickCustomEnd = '18:00'">
            <span class="block text-sm font-medium">{{ $t('calendar_page.time_pick_afternoon') }}</span>
            <span class="block text-xs opacity-70 mt-0.5">{{ $t('calendar_page.time_pick_afternoon_range') }}</span>
          </button>
          <button class="flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors text-center" :class="timePickMode === 'custom' ? 'time-pick-active' : 'time-pick-inactive'" @click="timePickMode = 'custom'">
            <span class="block text-sm font-medium">{{ $t('calendar_page.time_pick_custom') }}</span>
          </button>
        </div>
        <div v-if="currentTimePick.hours !== 4 || timePickMode === 'custom'" class="w-full flex items-center gap-3 mb-4">
          <label class="text-xs text-ink-muted whitespace-nowrap">{{ $t('calendar_page.time_pick_start') }}</label>
          <input v-model="timePickCustomStart" type="time" class="time-pick-input">
          <label class="text-xs text-ink-muted whitespace-nowrap">{{ $t('calendar_page.time_pick_end') }}</label>
          <input v-model="timePickCustomEnd" type="time" class="time-pick-input">
        </div>
        <div class="flex gap-2 w-full">
          <button v-if="timePickEvents.length > 1" class="px-3 py-2 text-xs font-medium rounded-lg gcal-btn transition-colors" @click="applyTimePickToAll">{{ $t('calendar_page.time_pick_apply_all') }}</button>
          <div class="flex-1" />
          <button class="px-4 py-2 text-sm rounded-lg border border-stroke text-ink-secondary hover:bg-card-hover transition-colors" @click="showTimePickModal = false">{{ $t('calendar_page.cancel') }}</button>
          <button class="px-4 py-2 text-sm font-medium rounded-lg gcal-btn transition-colors disabled:opacity-50" :disabled="exporting" @click="confirmTimePick">
            {{ timePickIndex < timePickEvents.length - 1 ? $t('calendar_page.time_pick_next') : $t('calendar_page.time_pick_confirm') }}
          </button>
        </div>
      </template>
    </Modal>

    <Modal v-model="showRequestModal">
      <h3 class="text-lg font-bold text-ink mb-1">{{ requestModalMode === 'create' ? $t('calendar_page.create_request_title') : $t('calendar_page.edit_request_title') }}</h3>
      <p v-if="requestModalMode === 'edit' && editingRequest" class="text-xs text-ink-muted mb-4">
        <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" :class="statusBadgeClasses(editingRequest.status)">{{ statusLabel(editingRequest.status) }}</span>
      </p>
      <div v-if="requestError" class="w-full mb-4 p-3 rounded-lg border border-danger bg-danger-soft text-danger-text text-xs font-medium">{{ requestError }}</div>
      <div class="w-full mb-4">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">{{ $t('calendar_page.request_type') }}</label>
        <div class="flex gap-2">
          <button class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors" :class="modalProjectId === VACATION_PROJECT_ID ? 'border-vacation bg-vacation-soft text-vacation-text' : 'border-stroke-muted text-ink-muted hover:bg-card-hover'" @click="modalProjectId = VACATION_PROJECT_ID">{{ $t('calendar_page.vacation_label') }}</button>
          <button class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors" :class="modalProjectId === LEAVES_PROJECT_ID ? 'border-vacation bg-vacation-soft text-vacation-text' : 'border-stroke-muted text-ink-muted hover:bg-card-hover'" @click="modalProjectId = LEAVES_PROJECT_ID">{{ $t('calendar_page.leaves_label') }}</button>
        </div>
      </div>
      <div class="w-full mb-4">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">{{ $t('calendar_page.selected_days') }}</label>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="(dateStr, dateIndex) in modalDates" :key="dateStr" class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-card-hover text-ink capitalize">
            {{ formatDateChip(dateStr) }}
            <button v-if="requestModalMode === 'create' && modalDates.length > 1" class="text-ink-faint hover:text-danger transition-colors ml-0.5" @click="removeModalDate(dateIndex)"><IconX :size="12" /></button>
          </span>
        </div>
      </div>
      <div v-if="requestModalMode === 'create'" class="w-full mb-4">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">{{ $t('calendar_page.hours_per_day') }}</label>
        <div class="flex gap-2">
          <button v-for="option in [4, 8]" :key="option" class="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors" :class="modalHoursPerDay === option && modalCustomHours === null ? 'border-accent bg-accent-soft text-accent-fg' : 'border-stroke-muted text-ink-muted hover:bg-card-hover'" @click="modalHoursPerDay = option; modalCustomHours = null">{{ option }}h</button>
          <button class="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors" :class="modalCustomHours !== null ? 'border-accent bg-accent-soft text-accent-fg' : 'border-stroke-muted text-ink-muted hover:bg-card-hover'" @click="modalCustomHours = modalCustomHours ?? 1; modalHoursPerDay = modalCustomHours">{{ $t('calendar_page.hours_custom') }}</button>
        </div>
        <div v-if="modalCustomHours !== null" class="mt-2 flex items-center gap-2">
          <div class="inline-flex items-stretch rounded-lg border border-stroke overflow-hidden">
            <button class="px-2.5 flex items-center text-ink-muted hover:bg-card-hover hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed" :disabled="modalCustomHours <= 0.5" @click="modalCustomHours = Math.max(0.5, modalCustomHours - 0.5); modalHoursPerDay = modalCustomHours"><IconMinus :size="14" /></button>
            <input v-model.number="modalCustomHours" type="number" min="0.5" max="8" step="0.5" class="custom-hours-input w-12 text-center text-sm font-medium bg-input text-ink py-2 border-x border-stroke focus:outline-none" @input="modalHoursPerDay = modalCustomHours">
            <button class="px-2.5 flex items-center text-ink-muted hover:bg-card-hover hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed" :disabled="modalCustomHours >= 8" @click="modalCustomHours = Math.min(8, modalCustomHours + 0.5); modalHoursPerDay = modalCustomHours"><IconPlus :size="14" /></button>
          </div>
          <span class="text-xs text-ink-muted">{{ $t('calendar_page.hours_custom_hint') }}</span>
        </div>
      </div>
      <div class="w-full mb-6">
        <label class="text-xs font-semibold text-ink-muted block mb-1.5">{{ $t('notes') }}</label>
        <input v-model="modalNotes" type="text" class="w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-input text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-focus-ring" :placeholder="$t('calendar_page.notes_placeholder')">
      </div>
      <div class="flex w-full gap-3">
        <button v-if="requestModalMode === 'edit'" class="px-4 py-2 text-sm font-medium rounded-lg border-2 border-danger text-danger hover:bg-danger hover:text-ink-inverse transition-colors disabled:opacity-50" :disabled="requestDeleting || requestSaving" @click="deleteRequest">
          {{ requestDeleting ? $t('calendar_page.request_deleting') : $t('calendar_page.delete_request') }}
        </button>
        <div class="flex-1" />
        <button class="px-4 py-2 text-sm rounded-lg border border-stroke text-ink-secondary hover:bg-card-hover transition-colors" @click="showRequestModal = false">{{ $t('calendar_page.cancel') }}</button>
        <button class="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-ink-inverse hover:bg-accent-hover transition-colors disabled:opacity-50" :disabled="requestSaving || requestDeleting || (requestModalMode === 'create' && modalDates.length === 0)" @click="submitRequest">
          <template v-if="requestModalMode === 'create'">{{ requestSaving ? $t('calendar_page.request_creating') : $t('calendar_page.create_request') }}</template>
          <template v-else>{{ requestSaving ? $t('calendar_page.request_saving') : $t('calendar_page.save_changes') }}</template>
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUpdated, onBeforeUnmount, nextTick } from 'vue'
import { startOfMonth, endOfMonth, getDay, addMonths, addDays, format, differenceInCalendarMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import { IconChevronLeft, IconChevronRight, IconCheck, IconX, IconEdit, IconTrash, IconClock, IconCircleCheck, IconCircleX, IconMinus, IconPlus } from '@tabler/icons-vue'
import { createOutOfOfficeEvent } from '~/utils/gCal'

definePageMeta({ middleware: 'auth' })

const { t: $t } = useI18n()
const api = useApi()
const userStore = useUserStore()
const { today } = useLiveToday()

const VACATION_PROJECT_ID = 83
const LEAVES_PROJECT_ID = 90
const REQUESTS_PAGE_SIZE = 50
const SYSTEM_NOTE_PATTERN = /^Allocation request imported on /i

const calendarPanel = ref(null)
const historyScroll = ref(null)
const monthOffset = ref(0)
const plannings = ref([])
const holidays = ref([])
const exporting = ref(false)
const exportResult = ref(null)
const createdDates = ref(new Set())
const showExportModal = ref(false)
const allRequests = ref([])
const requestsLoading = ref(false)
const dragStartDate = ref(null)
const dragEndDate = ref(null)
const isDragging = ref(false)
const showRequestModal = ref(false)
const requestModalMode = ref('create')
const editingRequest = ref(null)
const modalProjectId = ref(VACATION_PROJECT_ID)
const modalHoursPerDay = ref(8)
const modalCustomHours = ref(null)
const modalNotes = ref('')
const modalDates = ref([])
const requestSaving = ref(false)
const requestDeleting = ref(false)
const requestError = ref(null)
const pastVisibleCount = ref(10)
const calendarHeight = ref(0)
const requestsSearch = ref('')
const showTimePickModal = ref(false)
const timePickEvents = ref([])
const timePickIndex = ref(0)
const timePickChoices = ref({})
const timePickMode = ref('morning')
const timePickCustomStart = ref('09:00')
const timePickCustomEnd = ref('13:00')
const timePickSingleCell = ref(null)
const timeOffData = ref(null)
const budgetLoading = ref(false)
const budgetError = ref(false)
const sidebarTab = ref('upcoming')

const weekdayHeaders = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']

const sidebarMaxHeight = computed(() => calendarHeight.value ? `${calendarHeight.value}px` : 'none')
const displayedMonth = computed(() => monthOffset.value === 0 ? today.value : addMonths(startOfMonth(today.value), monthOffset.value))
const displayedMonthLabel = computed(() => format(displayedMonth.value, 'MMMM yyyy', { locale: it }))
const monthFrom = computed(() => format(startOfMonth(displayedMonth.value), 'yyyy-MM-dd'))
const monthTo = computed(() => format(endOfMonth(displayedMonth.value), 'yyyy-MM-dd'))
const todayStr = computed(() => format(today.value, 'yyyy-MM-dd'))
const budgetYear = computed(() => new Date().getFullYear())

const holidaysByDate = computed(() => {
  const map = {}
  for (const holiday of holidays.value) { map[holiday.date] = holiday.name }
  return map
})

const planningsByDate = computed(() => {
  const map = {}
  const employeeId = userStore.info?.employee_id
  for (const planning of plannings.value) {
    if (planning.employee_id !== employeeId) continue
    if (planning.project_id !== VACATION_PROJECT_ID && planning.project_id !== LEAVES_PROJECT_ID) continue
    if (!map[planning.day]) map[planning.day] = { vacation: 0, leaves: 0, vacationPending: false, leavesPending: false, requestIds: [] }
    if (planning.project_id === VACATION_PROJECT_ID) {
      map[planning.day].vacation += planning.amount
      if (planning.is_pending) map[planning.day].vacationPending = true
    } else {
      map[planning.day].leaves += planning.amount
      if (planning.is_pending) map[planning.day].leavesPending = true
    }
    if (planning.allocation_request_id && !map[planning.day].requestIds.includes(planning.allocation_request_id)) {
      map[planning.day].requestIds.push(planning.allocation_request_id)
    }
  }
  return map
})

const selectedDates = computed(() => {
  if (!dragStartDate.value) return new Set()
  const end = dragEndDate.value || dragStartDate.value
  const startStr = dragStartDate.value < end ? dragStartDate.value : end
  const finishStr = dragStartDate.value < end ? end : dragStartDate.value
  const dates = new Set()
  let current = new Date(startStr + 'T00:00:00')
  const endDate = new Date(finishStr + 'T00:00:00')
  while (current <= endDate) {
    const dow = getDay(current)
    const dateKey = format(current, 'yyyy-MM-dd')
    if (dow !== 0 && dow !== 6 && !holidaysByDate.value[dateKey]) dates.add(dateKey)
    current = addDays(current, 1)
  }
  return dates
})

const calendarCells = computed(() => {
  const monthStart = startOfMonth(displayedMonth.value)
  const monthEnd = endOfMonth(displayedMonth.value)
  const startDow = getDay(monthStart)
  const leadingBlanks = startDow === 0 ? 6 : startDow - 1
  const cells = []
  for (let blank = 0; blank < leadingBlanks; blank++) cells.push({ key: `blank-${blank}`, dayNumber: null })
  let current = new Date(monthStart)
  while (current <= monthEnd) {
    const dow = getDay(current)
    const isWeekend = dow === 0 || dow === 6
    const dateKey = format(current, 'yyyy-MM-dd')
    const dayData = planningsByDate.value[dateKey] || { vacation: 0, leaves: 0, vacationPending: false, leavesPending: false, requestIds: [] }
    const holidayName = holidaysByDate.value[dateKey]
    cells.push({ key: dateKey, dayNumber: current.getDate(), isWeekend, isHoliday: !!holidayName, holidayName: holidayName || '', isToday: dateKey === todayStr.value, vacation: dayData.vacation, leaves: dayData.leaves, vacationPending: dayData.vacationPending, leavesPending: dayData.leavesPending, requestIds: dayData.requestIds, dateKey })
    current = addDays(current, 1)
  }
  return cells
})

const exportableEvents = computed(() => {
  const events = []
  for (const cell of calendarCells.value) {
    if (!cell.dayNumber || cell.isWeekend || cell.isHoliday) continue
    if (cell.vacation > 0) events.push({ date: cell.dateKey, dateLabel: format(new Date(cell.dateKey + 'T00:00:00'), 'EEEE d MMMM', { locale: it }), type: 'vacation', typeLabel: $t('calendar_page.vacation_label'), hours: cell.vacation, hoursLabel: formatHours(cell.vacation), pending: cell.vacationPending })
    if (cell.leaves > 0) events.push({ date: cell.dateKey, dateLabel: format(new Date(cell.dateKey + 'T00:00:00'), 'EEEE d MMMM', { locale: it }), type: 'leaves', typeLabel: $t('calendar_page.leaves_label'), hours: cell.leaves, hoursLabel: formatHours(cell.leaves), pending: cell.leavesPending })
  }
  return events
})

const monthVacationTotal = computed(() => { let total = 0; for (const day of Object.values(planningsByDate.value)) total += day.vacation; return formatHours(total) })
const monthLeavesTotal = computed(() => { let total = 0; for (const day of Object.values(planningsByDate.value)) total += day.leaves; return formatHours(total) })
const currentTimePick = computed(() => timePickEvents.value[timePickIndex.value] || null)

const upcomingRequests = computed(() => {
  const base = allRequests.value.filter((r) => r.lastDate && r.lastDate >= todayStr.value).sort((a, b) => a.firstDate.localeCompare(b.firstDate))
  return filterRequestsBySearch(base)
})

const upcomingByMonth = computed(() => groupByMonth(upcomingRequests.value))
const allPastRequests = computed(() => allRequests.value.filter((r) => !r.lastDate || r.lastDate < todayStr.value).sort((a, b) => (b.firstDate || '').localeCompare(a.firstDate || '')))
const filteredPastRequests = computed(() => filterRequestsBySearch(allPastRequests.value))
const pastRequests = computed(() => filteredPastRequests.value.slice(0, pastVisibleCount.value))
const hasMorePast = computed(() => pastVisibleCount.value < filteredPastRequests.value.length)
const pastByMonth = computed(() => groupByMonth(pastRequests.value))

const budgetSections = computed(() => {
  if (!timeOffData.value) return []
  const data = timeOffData.value
  return [
    { key: 'vacation', label: $t('calendar_page.vacation_label'), total: data.time_off_targets.vacation, used: data.used.vacation, planned: data.planned.vacation, requested: data.requested.vacation, remaining: data.remaining.vacation, remainingLabelKey: 'calendar_page.budget_balance' },
    { key: 'leave', label: $t('calendar_page.leaves_label'), total: data.time_off_targets.leave, used: data.used.leave, planned: data.planned.leave, requested: data.requested.leave, remaining: data.remaining.leave, remainingLabelKey: 'calendar_page.budget_balance' },
    { key: 'target', label: $t('calendar_page.budget_target_label'), total: data.time_off_targets.target, used: data.used.target, planned: data.planned.target, requested: data.requested.target, remaining: data.remaining.target, borderTop: true, remainingLabelKey: 'calendar_page.budget_remaining' },
  ]
})

watch(monthOffset, () => { fetchPlannings(); createdDates.value = new Set(); exportResult.value = null })
watch(requestsSearch, () => { pastVisibleCount.value = 10 })
watch(showTimePickModal, (visible) => { if (!visible) timePickSingleCell.value = null })

onMounted(() => { fetchPlannings(); fetchRequests(); fetchHolidays(); fetchTimeOff(); nextTick(() => measureCalendar()) })
onUpdated(() => measureCalendar())
onBeforeUnmount(() => document.removeEventListener('mouseup', onDocumentMouseUp))

function measureCalendar() { if (calendarPanel.value) calendarHeight.value = calendarPanel.value.offsetHeight }

function getStatusIcon(status) {
  if (status === 'approved') return IconCircleCheck
  if (status === 'pending') return IconClock
  return IconCircleX
}

function statusIconClasses(status) {
  if (status === 'approved') return 'text-vacation-text'
  if (status === 'pending') return 'text-pending-text'
  if (status === 'rejected' || status === 'conflict') return 'text-danger'
  return 'text-ink-muted'
}

function statusLabel(status) {
  if (status === 'pending') return $t('calendar_page.pending')
  if (status === 'approved') return $t('calendar_page.approved')
  if (status === 'rejected') return $t('calendar_page.rejected')
  if (status === 'conflict') return $t('calendar_page.conflict')
  return status
}

function statusBadgeClasses(status) {
  if (status === 'pending') return 'bg-pending-soft text-pending-text'
  if (status === 'approved') return 'bg-vacation-soft text-vacation-text'
  return 'bg-card-hover text-ink-muted'
}

function formatHours(value) {
  if (!value) return '0h'
  let hours = Math.floor(value)
  let minutes = Math.round((value - hours) * 60)
  if (minutes >= 60) { hours += 1; minutes = 0 }
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function formatDays(hours) {
  const totalHours = Math.abs(Number(hours))
  const days = Math.floor(totalHours / 8)
  const leftoverHours = Math.round(totalHours % 8)
  const sign = Number(hours) < 0 ? '-' : ''
  const unit = $t('calendar_page.budget_days_unit')
  if (leftoverHours === 0) return `${sign}${days}${unit}`
  if (days === 0) return `${sign}${leftoverHours}h`
  return `${sign}${days}${unit} ${leftoverHours}h`
}

function budgetBarWidth(segmentHours, totalHours, usedHours, plannedHours, requestedHours) {
  const budget = Number(totalHours)
  const segment = Number(segmentHours)
  if (budget <= 0 || segment <= 0) return '0%'
  const consumed = Number(usedHours) + Number(plannedHours) + Number(requestedHours)
  return `${(segment / Math.max(budget, consumed)) * 100}%`
}

function remainingClass(remainingHours) { const val = Number(remainingHours); if (val < 0) return 'text-danger'; if (val === 0) return 'text-vacation-text'; return 'text-ink' }
function remainingLabel(remainingHours, labelKey = 'calendar_page.budget_remaining') { const val = Number(remainingHours); if (val < 0) return $t('calendar_page.budget_over_planned', { days: formatDays(Math.abs(val)) }); if (val === 0) return $t('calendar_page.budget_all_planned'); return $t(labelKey) + ': ' + formatDays(remainingHours) }

function formatDateChip(dateStr) { return format(new Date(dateStr + 'T00:00:00'), 'EEE d MMM', { locale: it }) }

function cellClasses(cell) {
  if (!cell.dayNumber) return 'border-transparent'
  if (cell.isWeekend || cell.isHoliday) return 'border-transparent bg-card-dim text-ink-disabled'
  if (selectedDates.value.has(cell.dateKey)) return 'ring-2 ring-accent bg-accent-soft border-accent cursor-pointer'
  const hasAny = cell.vacation > 0 || cell.leaves > 0
  if (!hasAny) return cell.isToday ? 'border-accent bg-card cursor-pointer' : 'border-stroke-muted bg-card cursor-pointer hover:bg-card-hover'
  const anyPending = (cell.vacation > 0 && cell.vacationPending) || (cell.leaves > 0 && cell.leavesPending)
  return anyPending ? 'border-2 border-pending bg-pending-soft cursor-pointer' : 'border-vacation bg-vacation-soft cursor-pointer'
}

function onCellMouseDown(cell, event) {
  if (!cell.dayNumber || cell.isWeekend || cell.isHoliday) return
  event.preventDefault()
  isDragging.value = true
  dragStartDate.value = cell.dateKey
  dragEndDate.value = cell.dateKey
  document.addEventListener('mouseup', onDocumentMouseUp)
}

function onCellMouseEnter(cell) { if (isDragging.value && cell.dayNumber) dragEndDate.value = cell.dateKey }

function onDocumentMouseUp() {
  document.removeEventListener('mouseup', onDocumentMouseUp)
  if (!isDragging.value) return
  isDragging.value = false
  const dates = [...selectedDates.value].sort()
  dragStartDate.value = null
  dragEndDate.value = null
  if (dates.length === 0) return
  if (dates.length === 1) {
    const dayData = planningsByDate.value[dates[0]]
    if (dayData && (dayData.vacation > 0 || dayData.leaves > 0)) { openEditModal(dates[0], dayData); return }
  }
  const emptyDates = dates.filter((d) => { const dd = planningsByDate.value[d]; return !dd || (dd.vacation === 0 && dd.leaves === 0) })
  if (emptyDates.length > 0) openCreateModal(emptyDates)
}

function openCreateModal(dates) { requestModalMode.value = 'create'; editingRequest.value = null; modalProjectId.value = VACATION_PROJECT_ID; modalHoursPerDay.value = 8; modalCustomHours.value = null; modalNotes.value = ''; modalDates.value = dates; requestError.value = null; showRequestModal.value = true }
function openEditModal(dateKey, dayData) { const requestIds = dayData.requestIds || []; if (!requestIds.length) return; const request = allRequests.value.find((r) => requestIds.includes(r.id)); if (request) openEditFromRequest(request) }
function openEditFromRequest(request) { requestModalMode.value = 'edit'; editingRequest.value = request; modalProjectId.value = request.projectId; modalNotes.value = request.notes; modalDates.value = request.days.map((d) => d.date || d.day).filter(Boolean).sort(); const hours = request.days[0]?.hours || 8; modalHoursPerDay.value = hours; modalCustomHours.value = (hours === 4 || hours === 8) ? null : hours; requestError.value = null; showRequestModal.value = true }
function removeModalDate(dateIndex) { modalDates.value = modalDates.value.filter((_, idx) => idx !== dateIndex) }
function navigateToRequest(request) { if (!request.firstDate) return; this; monthOffset.value = differenceInCalendarMonths(new Date(request.firstDate + 'T00:00:00'), startOfMonth(today.value)) }
function onHistoryScroll() { if (!hasMorePast.value) return; const container = historyScroll.value; if (!container) return; if (container.scrollTop + container.clientHeight >= container.scrollHeight - 40) pastVisibleCount.value += 10 }

async function submitRequest() {
  requestSaving.value = true; requestError.value = null
  try {
    if (requestModalMode.value === 'create') {
      await api.$post('allocation-request', { notes: modalNotes.value, days: modalDates.value.map((d) => ({ date: d, hours: modalHoursPerDay.value })), project: modalProjectId.value })
    } else {
      await api.$patch(`allocation-request/${editingRequest.value.id}`, { notes: modalNotes.value, project: modalProjectId.value })
    }
    showRequestModal.value = false
    await refreshData()
  } catch (error) { requestError.value = error.response?.data?.message || $t('calendar_page.request_error') }
  finally { requestSaving.value = false }
}

async function deleteRequest() {
  if (!window.confirm($t('calendar_page.delete_confirm_message'))) return
  requestDeleting.value = true; requestError.value = null
  try { await api.$delete(`allocation-request/${editingRequest.value.id}`); showRequestModal.value = false; await refreshData() }
  catch (error) { requestError.value = error.response?.data?.message || $t('calendar_page.request_error') }
  finally { requestDeleting.value = false }
}

async function deleteRequestDirect(request) {
  if (!window.confirm($t('calendar_page.delete_confirm_message'))) return
  try { await api.$delete(`allocation-request/${request.id}`); await refreshData() } catch { /* silent */ }
}

async function refreshData() { pastVisibleCount.value = 10; await Promise.all([fetchPlannings(), fetchRequests(), fetchTimeOff()]) }

async function fetchPlannings() {
  if (!userStore.canMakeRequests) return
  try {
    const response = await api.$get('planningboard', { params: { from: monthFrom.value, to: monthTo.value } })
    const raw = response?.data?.plannings || {}
    const flat = []
    for (const group of Object.values(raw)) { if (Array.isArray(group)) flat.push(...group) }
    plannings.value = flat
  } catch { plannings.value = [] }
}

async function fetchHolidays() { try { const response = await api.$get('holidays'); holidays.value = response?.data || [] } catch { holidays.value = [] } }

async function fetchRequests() {
  if (!userStore.canMakeRequests) return
  requestsLoading.value = true
  try {
    let offset = 0; const allRaw = []
    while (true) {
      const response = await api.$get('allocation-request', { params: { offset, limit: REQUESTS_PAGE_SIZE, ownership: 'mine', search: '', order: 'status', sort: 'desc' } })
      const page = Array.isArray(response?.data) ? response.data : []
      if (page.length === 0) break
      allRaw.push(...page); offset += page.length
      if (page.length < REQUESTS_PAGE_SIZE) break
    }
    allRequests.value = allRaw.map(mapRequest)
  } catch { allRequests.value = [] }
  finally { requestsLoading.value = false }
}

async function fetchTimeOff() {
  budgetLoading.value = true; budgetError.value = false
  try {
    const employeeId = userStore.info?.employee_id
    const response = await api.$get('timeoff', { params: { offset: 0, limit: 100, search: '', year: budgetYear.value } })
    const employees = response?.data || []
    timeOffData.value = employees.find((e) => e.employee?.id === employeeId) || employees[0] || null
  } catch { budgetError.value = true; timeOffData.value = null }
  finally { budgetLoading.value = false }
}

function mapRequest(raw) {
  const isVacation = raw.project?.id === VACATION_PROJECT_ID
  const typeLabel = isVacation ? $t('calendar_page.vacation_label') : $t('calendar_page.leaves_label')
  const days = raw.days || []
  const sortedDates = days.map((d) => d.date || d.day).filter(Boolean).sort()
  let firstDate = sortedDates[0]; let lastDate = sortedDates[sortedDates.length - 1]
  if (!firstDate) { firstDate = raw.from || raw.date_from || raw.start_date || ''; lastDate = raw.to || raw.date_to || raw.end_date || firstDate }
  let dateRange = '', dateRangeShort = '', dateDayOnly = ''
  if (firstDate) {
    const startDate = new Date(firstDate + 'T00:00:00')
    if (firstDate === lastDate) { dateRange = format(startDate, 'd MMM yyyy', { locale: it }); dateRangeShort = format(startDate, 'dd/MM/yy'); dateDayOnly = String(startDate.getDate()) }
    else {
      const endDate = new Date(lastDate + 'T00:00:00')
      dateRange = `${format(startDate, 'd MMM', { locale: it })} – ${format(endDate, 'd MMM yyyy', { locale: it })}`
      const sameMonth = firstDate.substring(0, 7) === lastDate.substring(0, 7)
      if (sameMonth) { dateRangeShort = `${startDate.getDate()}–${endDate.getDate()}/${format(endDate, 'MM/yy')}`; dateDayOnly = `${startDate.getDate()}–${endDate.getDate()}` }
      else { dateRangeShort = `${startDate.getDate()}/${format(startDate, 'MM', { locale: it })}–${endDate.getDate()}/${format(endDate, 'MM/yy')}`; dateDayOnly = `${startDate.getDate()}/${format(startDate, 'MM')}–${endDate.getDate()}/${format(endDate, 'MM')}` }
    }
  }
  const totalHours = days.reduce((sum, d) => sum + (d.hours || 0), 0)
  const rawNotes = raw.notes || ''; const userNotes = SYSTEM_NOTE_PATTERN.test(rawNotes) ? '' : rawNotes
  return { id: raw.id, projectId: raw.project?.id, typeLabel, typeShort: isVacation ? 'F' : 'P', status: raw.status, dateRange, dateRangeShort, dateDayOnly, totalHoursLabel: formatHours(totalHours || raw.hours || 0), firstDate, lastDate, notes: userNotes, days }
}

function groupByMonth(requests) {
  const groups = []; let currentKey = ''
  for (const request of requests) {
    if (!request.firstDate) continue
    const monthKey = request.firstDate.substring(0, 7)
    if (monthKey !== currentKey) { currentKey = monthKey; groups.push({ monthKey, label: format(new Date(request.firstDate + 'T00:00:00'), 'MMMM yyyy', { locale: it }), requests: [] }) }
    groups[groups.length - 1].requests.push(request)
  }
  return groups
}

function filterRequestsBySearch(requests) {
  const query = requestsSearch.value.trim().toLowerCase()
  if (!query) return requests
  const queryWords = query.split(/\s+/).filter(Boolean)
  return requests.filter((request) => {
    if (!request.firstDate) return false
    const date = new Date(request.firstDate + 'T00:00:00')
    const haystack = `${format(date, 'MMMM yyyy', { locale: it })} ${format(date, 'MMM yyyy', { locale: it })} ${format(date, 'MM/yy')} ${format(date, 'MM/yyyy')} ${format(date, 'yyyy')}`.toLowerCase()
    return queryWords.every((word) => haystack.includes(word))
  })
}

function addDayToCalendar(cell) {
  if (createdDates.value.has(cell.dateKey)) return
  const totalHours = (cell.vacation || 0) + (cell.leaves || 0)
  const event = { date: cell.dateKey, dateLabel: format(new Date(cell.dateKey + 'T00:00:00'), 'EEEE d MMMM', { locale: it }), hours: totalHours, hoursLabel: formatHours(totalHours) }
  timePickSingleCell.value = cell
  if (totalHours >= 8) { executeGCalExport([event]); timePickSingleCell.value = null }
  else { timePickChoices.value = {}; openTimePicker([event]) }
}

function confirmExport() { const events = exportableEvents.value.filter((e) => !createdDates.value.has(e.date)); showExportModal.value = false; startGCalFlow(events) }

function aggregateByDate(events) {
  const byDate = {}
  for (const event of events) { if (!byDate[event.date]) byDate[event.date] = { ...event, hours: 0 }; byDate[event.date].hours += event.hours; byDate[event.date].hoursLabel = formatHours(byDate[event.date].hours) }
  return Object.values(byDate)
}

function startGCalFlow(events) {
  const aggregated = aggregateByDate(events)
  const needsTime = aggregated.filter((e) => e.hours < 8); const fullDay = aggregated.filter((e) => e.hours >= 8)
  const choices = {}; for (const e of fullDay) choices[e.date] = { allDay: true }
  timePickChoices.value = choices
  if (needsTime.length === 0) executeGCalExport(aggregated)
  else openTimePicker(needsTime)
}

function openTimePicker(needsTime) { timePickEvents.value = needsTime; timePickIndex.value = 0; timePickMode.value = needsTime[0]?.hours === 4 ? 'morning' : 'custom'; timePickCustomStart.value = '09:00'; timePickCustomEnd.value = '13:00'; showTimePickModal.value = true }

function confirmTimePick() {
  const event = currentTimePick.value
  let startTime, endTime
  if (timePickMode.value === 'morning') { startTime = '09:00'; endTime = '13:00' }
  else if (timePickMode.value === 'afternoon') { startTime = '14:00'; endTime = '18:00' }
  else { startTime = timePickCustomStart.value; endTime = timePickCustomEnd.value }
  timePickChoices.value = { ...timePickChoices.value, [event.date]: { startTime, endTime } }
  if (timePickIndex.value < timePickEvents.value.length - 1) { timePickIndex.value++; const next = timePickEvents.value[timePickIndex.value]; timePickMode.value = next.hours === 4 ? 'morning' : 'custom'; timePickCustomStart.value = '09:00'; timePickCustomEnd.value = '13:00' }
  else { showTimePickModal.value = false; finishTimePickFlow() }
}

function applyTimePickToAll() {
  let startTime, endTime
  if (timePickMode.value === 'morning') { startTime = '09:00'; endTime = '13:00' }
  else if (timePickMode.value === 'afternoon') { startTime = '14:00'; endTime = '18:00' }
  else { startTime = timePickCustomStart.value; endTime = timePickCustomEnd.value }
  const updated = { ...timePickChoices.value }
  for (let idx = timePickIndex.value; idx < timePickEvents.value.length; idx++) updated[timePickEvents.value[idx].date] = { startTime, endTime }
  timePickChoices.value = updated; showTimePickModal.value = false; finishTimePickFlow()
}

function finishTimePickFlow() { const allDates = Object.keys(timePickChoices.value); executeGCalExport(allDates.map((d) => ({ date: d }))); timePickSingleCell.value = null }

async function executeGCalExport(events) {
  exporting.value = true; exportResult.value = null; let created = 0
  try {
    const dedupedDates = [...new Set(events.map((e) => e.date))]
    for (const dateStr of dedupedDates) {
      if (createdDates.value.has(dateStr)) continue
      const nextDay = format(addDays(new Date(dateStr + 'T00:00:00'), 1), 'yyyy-MM-dd')
      const choice = timePickChoices.value[dateStr]
      const options = choice && !choice.allDay ? { startTime: choice.startTime, endTime: choice.endTime } : {}
      await createOutOfOfficeEvent(dateStr, nextDay, options)
      createdDates.value = new Set([...createdDates.value, dateStr]); created++
    }
    exportResult.value = { success: true, message: $t('calendar_page.export_success', { count: created }) }
  } catch (error) {
    console.error('Failed to create GCal events:', error)
    exportResult.value = { success: false, message: $t('error') + ': ' + (error.message || 'Google Calendar non raggiungibile') }
  } finally { exporting.value = false; showExportModal.value = false }
}
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";
.sidebar-tabs-wrapper { @apply relative flex rounded-lg bg-card-hover p-0.5; }
.sidebar-tabs-indicator { @apply absolute top-0.5 left-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-md bg-card shadow-sm transition-transform duration-200 ease-out; }
.sidebar-tab { @apply relative z-10 flex-1 text-xs font-bold uppercase tracking-wide py-1.5 rounded-md transition-colors text-center cursor-pointer; }
.sidebar-tab-active { @apply text-ink; }
.sidebar-tab-inactive { @apply text-ink-faint hover:text-ink-muted; }
.sidebar-request-row { @apply flex items-center rounded transition-colors px-2; gap: 0.75rem; min-height: 2.25rem; }
.sidebar-request-row:hover { @apply bg-card-hover; }
.sidebar-request-btn { @apply flex-1 min-w-0 flex items-center text-left cursor-pointer; gap: 0.75rem; }
.sidebar-date { @apply text-sm font-semibold text-ink tabular-nums whitespace-nowrap; width: 3rem; flex-shrink: 0; }
.sidebar-hours { @apply text-xs text-ink-muted whitespace-nowrap tabular-nums; width: 2rem; flex-shrink: 0; }
.sidebar-type { @apply text-[10px] font-bold leading-none px-1.5 py-0.5 rounded; flex-shrink: 0; min-width: 1.25rem; text-align: center; }
.sidebar-actions { @apply flex items-center shrink-0 opacity-0 transition-opacity; gap: 0.25rem; }
.sidebar-request-row:hover .sidebar-actions { @apply opacity-100; }
.pill-ferie { background: rgba(245, 158, 11, 0.15); color: #d97706; }
.pill-permesso { background: var(--color-accent); color: #fff; }
.gcal-icon { color: #4285F4; }
.gcal-btn { background: rgba(66, 133, 244, 0.12); color: #4285F4; border: 1px solid rgba(66, 133, 244, 0.3); }
.gcal-btn:hover { background: #4285F4; color: #fff; }
.time-pick-active { border-color: #4285F4; background: rgba(66, 133, 244, 0.12); color: #4285F4; }
.time-pick-inactive { border-color: var(--color-stroke); color: var(--color-ink-muted); background: transparent; }
.time-pick-inactive:hover { background: var(--color-card-hover); }
.budget-bar-track { @apply flex w-full h-3 rounded-full overflow-hidden; background: var(--color-budget-remaining, var(--color-stroke-muted)); }
.budget-bar-sm { @apply h-2; }
.budget-bar-segment { transition: width 0.4s ease; min-width: 0; }
.budget-details { @apply flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-ink-muted tabular-nums; font-size: 10px; }
.bg-budget-used { background: var(--color-budget-used, #059669); }
.bg-budget-planned { background: var(--color-budget-planned, #38bdf8); }
.bg-budget-requested { background: var(--color-budget-requested, #fbbf24); }
.bg-budget-remaining { background: var(--color-budget-remaining, var(--color-stroke-muted)); }
.time-pick-input { @apply flex-1 px-3 py-2 text-sm rounded-lg border border-stroke text-ink; background: var(--color-card-hover); color-scheme: light; }
.time-pick-input:focus { @apply outline-none ring-1 ring-focus-ring; }
.custom-hours-input::-webkit-inner-spin-button,
.custom-hours-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.custom-hours-input { -moz-appearance: textfield; appearance: textfield; }
</style>

<style>
.dark .pill-ferie { background: rgba(251, 191, 36, 0.18); color: #fbbf24; }
.dark .pill-permesso { color: #1e1b4b; }
.dark .gcal-icon { color: #6ea8ff; }
.dark .gcal-btn { background: rgba(110, 168, 255, 0.15); color: #6ea8ff; border-color: rgba(110, 168, 255, 0.35); }
.dark .gcal-btn:hover { background: #6ea8ff; color: #1a1a2e; }
.dark .bg-budget-used { background: #10b981; }
.dark .bg-budget-planned { background: #7dd3fc; }
.dark .bg-budget-requested { background: #f59e0b; }
.dark .time-pick-active { border-color: #6ea8ff; background: rgba(110, 168, 255, 0.15); color: #6ea8ff; }
.dark .time-pick-input { color-scheme: dark; }
.dark .sidebar-tabs-indicator { background-color: #b4b9f8; box-shadow: none; }
.dark .sidebar-tab-active { color: #323339; }
</style>
