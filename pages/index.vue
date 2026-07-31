<template>
  <div class="pt-20">
    <div v-if="userStore.isTokenExpired" class="container px-6 mx-auto mt-4 mb-4">
      <div class="bg-warning-soft border border-warning rounded-lg p-4">
        <div class="flex items-start gap-2">
          <IconAlertTriangle class="text-warning flex-shrink-0 mt-0.5" :size="20" />
          <div class="flex-1">
            <p class="text-base font-bold text-warning-text">{{ $t('session_expired') }}</p>
            <p class="text-sm text-warning-text mt-1">{{ $t('session_expired_hint') }}</p>
            <button
              class="text-sm text-warning-text underline mt-2 hover:opacity-80 transition-opacity"
              @click="showExtensionGuide = !showExtensionGuide"
            >
              {{ showExtensionGuide ? $t('calendar_page.cancel') : $t('login_instructions') }}
            </button>
            <ol v-if="showExtensionGuide" class="list-decimal list-inside space-y-2 mt-3 text-sm text-warning-text">
              <li>{{ $t('login_tutorial.step_1') }}<a class="underline font-semibold" target="_blank" :href="config.public.loginExtensionUrl">{{ $t('login_tutorial.step_1_cta_store') }}</a>{{ $t('login_tutorial.step_1_alt') }}<a class="underline font-semibold" href="/progethod-extension.zip" download>{{ $t('login_tutorial.step_1_cta_download') }}</a></li>
              <li>{{ $t('login_tutorial.step_2') }}
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

    <Alert v-if="holidaysFetchFailed" :message="$t('holidays_error')" level="warning" dismissable @dismiss="holidaysFetchFailed = false" />
    <Alert v-if="showMonthEndReminder && !monthEndReminderDismissed" :message="$t('month_end_reminder')" level="warning" dismissable @dismiss="dismissMonthEndReminder" />

    <div class="my-6 lg:my-12 container px-6 mx-auto pb-4 border-b border-stroke">
      <div class="flex items-center gap-3">
        <div class="inline-flex items-center bg-card border border-stroke-muted rounded-lg shadow">
          <button class="inline-flex items-center justify-center min-w-10 min-h-10 p-2.5 text-ink-muted cursor-pointer hover:bg-card-hover rounded-l-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring" :title="$t('previous_week')" @click="weekOffset--">
            <IconChevronLeft :size="18" />
          </button>
          <span
            class="inline-flex items-center min-h-10 px-4 text-sm font-semibold text-ink border-l border-r border-stroke-muted select-none cursor-pointer hover:bg-card-hover transition-colors"
            @click.stop="monthCalendarRef?.toggle()"
          >
            {{ weekLabel }}
          </span>
          <button class="inline-flex items-center justify-center min-w-10 min-h-10 p-2.5 text-ink-muted cursor-pointer hover:bg-card-hover rounded-r-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring" :title="$t('next_week')" @click="weekOffset++">
            <IconChevronRight :size="18" />
          </button>
        </div>
        <button
          v-if="weekOffset !== 0"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-soft text-accent-fg cursor-pointer hover:bg-accent-soft transition-colors border border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          @click="weekOffset = 0"
        >
          {{ $t('current_week') }}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 mt-4">
        <template v-if="trackedHoursLoading">
          <div class="stat-card animate-pulse"><span class="inline-block w-20 h-4 bg-stroke-muted rounded" /></div>
          <div class="stat-card animate-pulse"><span class="inline-block w-20 h-4 bg-stroke-muted rounded" /></div>
        </template>
        <template v-else>
          <div class="stat-card">
            <span class="stat-label">{{ $t('week_short') }}</span>
            <span class="stat-value">{{ weekTrackedTotal + '/' + weekExpectedHours + 'h' }}</span>
          </div>
          <div class="stat-card stat-card--interactive transition-colors" @click.stop="monthCalendarRef?.toggle()">
            <MonthCalendar
              ref="monthCalendarRef"
              :reference-date="weekAnchor"
              :tracked-hours="calendarEffectiveHours"
              :holidays="holidays"
              :label="monthLabel"
              @day-click="onCalendarDayClick"
              @month-changed="onCalendarMonthChanged"
            />
            <span class="stat-value">{{ monthTrackedDays + '/' + monthWorkingDays }}</span>
          </div>
          <div class="stat-card stat-card--interactive transition-colors" @click="showOfficeDaysModal = true">
            <IconBuilding :size="14" class="text-ink" />
            <span class="stat-value">{{ $t('office_days_check_button') }}</span>
          </div>
        </template>
      </div>
    </div>

    <div class="container mx-auto px-6">
      <!-- A/B week layouts — temporary; delete components/ab-week-layouts/ when done -->
      <AbWeekLayoutsHost
        ref="weekLayoutRef"
        :layout="preferencesStore.weekLayout"
        :days="days"
        :today="today"
        :wethod-hours-by-day="trackedHoursByDay"
        :leave-hours-by-day="leaveHoursByDay"
        :holidays-by-date="holidaysByDate"
        :focused="navigating && insideDay"
        :focused-day-index="focusedDayIndex"
        :navigating="navigating"
        :inside-day="insideDay"
      />
    </div>

    <OfficeDaysModal
      v-model="showOfficeDaysModal"
      :month-tracked-hours="monthTrackedHours"
      :month-from="monthFrom"
      :month-to="monthTo"
      :month-working-days="monthWorkingDays"
      :month-label="monthLabel"
    />
  </div>
</template>

<script setup lang="ts">
import { IconAlertTriangle, IconChevronLeft, IconChevronRight, IconBuilding } from '@tabler/icons-vue'
import { isSameDay, startOfMonth, endOfMonth, subDays, getDay, isAfter, isBefore, addWeeks, startOfWeek, addDays, format as formatDate } from 'date-fns'
import { it } from 'date-fns/locale'
import { effectiveWethodHours } from '~/utils/effectiveHours'

definePageMeta({ middleware: 'auth' })

const LEAVE_PROJECT_IDS = new Set([83, 90])

type TrackedHoursEntry = { date: string; value: number }
type VacationHoursEntry = { date: string; amount: number; projectId: number }
type PlanningRow = { employee_id: number; project_id: number; day: string; amount: number }

const config = useRuntimeConfig()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const entriesStore = useEntriesStore()
const eventBus = useEventBus()
const api = useApi()
const { today } = useLiveToday()
const route = useRoute()
const router = useRouter()

const weekLayoutRef = ref<{ getDayComponent?: (index: number) => any } | null>(null)

const queryWeek = parseInt(route.query.week as string, 10)
const weekOffset = ref(Number.isFinite(queryWeek) ? queryWeek : 0)
const weekTrackedHours = ref<TrackedHoursEntry[]>([])
const monthTrackedHours = ref<TrackedHoursEntry[]>([])
const calendarTrackedHours = ref<TrackedHoursEntry[]>([])
const calendarLeaveByDay = ref<Record<string, number>>({})
const trackedHoursLoading = ref(false)
const showOfficeDaysModal = ref(false)
const weekVacationHours = ref<VacationHoursEntry[]>([])
const monthVacationHours = ref<VacationHoursEntry[]>([])
const holidays = ref<Array<{ date: string; name: string }>>([])
const holidaysFetchFailed = ref(false)
const focusedDayIndex = ref<number | null>(null)
const insideDay = ref(false)
const navigating = ref(false)
const showExtensionGuide = ref(false)
const monthCalendarRef = ref<any>(null)

function leaveHoursMap(entries: VacationHoursEntry[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const entry of entries) {
    map[entry.date] = (map[entry.date] || 0) + entry.amount
  }
  return map
}

function extractLeaveEntries(
  plannings: Record<string, PlanningRow[]>,
  employeeId: number,
): VacationHoursEntry[] {
  const entries: VacationHoursEntry[] = []
  for (const group of Object.values(plannings)) {
    if (!Array.isArray(group)) { continue }
    for (const planning of group) {
      if (planning.employee_id === employeeId && LEAVE_PROJECT_IDS.has(planning.project_id)) {
        entries.push({ date: planning.day, amount: planning.amount, projectId: planning.project_id })
      }
    }
  }
  return entries
}

function syncedLocalHoursForDay(dayKey: string): number {
  return entriesStore.entries
    .filter(entry => entry.day === dayKey && entry.synced)
    .reduce((sum, entry) => sum + (entry.data.duration || 0), 0) / 60
}

/** Same projection as the day “Ore su Wethod” badge (without holidays). */
function buildEffectiveTrackedHours(
  trackedHours: TrackedHoursEntry[],
  leaveByDay: Record<string, number>,
): TrackedHoursEntry[] {
  const trackedByDay: Record<string, number> = {}
  for (const entry of trackedHours) {
    trackedByDay[entry.date] = entry.value
  }
  const dateKeys = new Set([
    ...Object.keys(trackedByDay),
    ...Object.keys(leaveByDay),
  ])
  return [...dateKeys].map((dateKey) => ({
    date: dateKey,
    value: effectiveWethodHours({
      rawWethod: trackedByDay[dateKey] || 0,
      syncedLocalHours: syncedLocalHoursForDay(dateKey),
      leaveHours: leaveByDay[dateKey] || 0,
    }),
  }))
}

const dismissedAt = typeof localStorage !== 'undefined' ? localStorage.getItem('monthEndReminderDismissedAt') : null
const monthEndReminderDismissed = ref(!!(dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < 24 * 60 * 60 * 1000))

const weekAnchor = computed(() => addWeeks(today.value, weekOffset.value))
const days = computed(() => {
  const monday = startOfWeek(weekAnchor.value, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
})
const weekLabel = computed(() => {
  const start = formatDate(days.value[0], 'd MMM', { locale: it })
  const end = formatDate(days.value[6], 'd MMM yyyy', { locale: it })
  return `${start} – ${end}`
})
const weekFrom = computed(() => formatDate(days.value[0], 'yyyy-MM-dd'))
const weekTo = computed(() => formatDate(days.value[6], 'yyyy-MM-dd'))
const monthFrom = computed(() => formatDate(startOfMonth(weekAnchor.value), 'yyyy-MM-dd'))
const monthTo = computed(() => formatDate(endOfMonth(weekAnchor.value), 'yyyy-MM-dd'))
const weekTrackedTotal = computed(() => weekTrackedHours.value.reduce((sum, entry) => sum + (entry.value || 0), 0))
const monthLeaveByDay = computed(() => leaveHoursMap(monthVacationHours.value))
const monthEffectiveHours = computed(() =>
  buildEffectiveTrackedHours(monthTrackedHours.value, monthLeaveByDay.value),
)
const monthTrackedDays = computed(() => monthEffectiveHours.value.filter(entry => entry.value >= 8).length)
const calendarEffectiveHours = computed(() =>
  buildEffectiveTrackedHours(calendarTrackedHours.value, calendarLeaveByDay.value),
)
const weekExpectedHours = computed(() => {
  const holidaysInWeek = holidays.value.filter((holiday) => {
    if (holiday.date < weekFrom.value || holiday.date > weekTo.value) { return false }
    const dow = new Date(holiday.date + 'T00:00:00').getDay()
    return dow !== 0 && dow !== 6
  }).length
  return 40 - (holidaysInWeek * 8)
})
const monthWorkingDays = computed(() => {
  let workingDays = 0
  let current = startOfMonth(weekAnchor.value)
  const end = endOfMonth(weekAnchor.value)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateKey = formatDate(current, 'yyyy-MM-dd')
      if (!holidaysByDate.value[dateKey]) { workingDays++ }
    }
    current = addDays(current, 1)
  }
  return workingDays
})
const monthLabel = computed(() => formatDate(weekAnchor.value, 'MMMM yyyy', { locale: it }))
const trackedHoursByDay = computed(() => {
  const map: Record<string, number> = {}
  for (const entry of weekTrackedHours.value) { map[entry.date] = entry.value }
  return map
})
const leaveHoursByDay = computed(() => leaveHoursMap(weekVacationHours.value))
const holidaysByDate = computed(() => {
  const map: Record<string, string> = {}
  for (const holiday of holidays.value) { map[holiday.date] = holiday.name }
  return map
})
const showMonthEndReminder = computed(() => {
  const monthEnd = endOfMonth(today.value)
  let cursor = new Date(monthEnd)
  const lastWorkingDays: Date[] = []
  while (lastWorkingDays.length < 2) {
    const dow = getDay(cursor)
    if (dow !== 0 && dow !== 6) { lastWorkingDays.push(cursor) }
    cursor = subDays(cursor, 1)
  }
  const rangeStart = lastWorkingDays[lastWorkingDays.length - 1]
  return !isBefore(today.value, rangeStart) && !isAfter(today.value, monthEnd)
})

watch(weekOffset, (value) => {
  const query = value === 0 ? {} : { week: String(value) }
  if (route.query.week !== (query as any).week) {
    router.replace({ query })
  }
  fetchTrackedHours()
  fetchVacationHours()
})

function deactivateNav() { navigating.value = false; insideDay.value = false }
function activateNav() { navigating.value = true; if (focusedDayIndex.value === null) { focusedDayIndex.value = 0 } }

function getFocusedDayComponent() {
  if (focusedDayIndex.value === null) { focusedDayIndex.value = 0 }
  return weekLayoutRef.value?.getDayComponent?.(focusedDayIndex.value)
}

function scrollFocusedIntoView() {
  nextTick(() => {
    const component = getFocusedDayComponent()
    const element = component?.$el
    if (!element) { return }
    const navHeight = 64
    const rect = element.getBoundingClientRect()
    if (rect.top < navHeight) { window.scrollBy({ top: rect.top - navHeight - 8, behavior: 'smooth' }) }
    else if (rect.bottom > window.innerHeight) { element.scrollIntoView({ block: 'end', behavior: 'smooth' }) }
  })
}

async function fetchTrackedHours() {
  if (!userStore.canMakeRequests) { return }
  const snapshotOffset = weekOffset.value
  trackedHoursLoading.value = true
  try {
    const employeeId = userStore.info.employee_id || ''
    const [weekResponse, monthResponse] = await Promise.all([
      api.$get<{ data: Array<{ date: string; value: number }> }>('tracked-hours', { params: { from: weekFrom.value, to: weekTo.value, employeeId } }),
      api.$get<{ data: Array<{ date: string; value: number }> }>('tracked-hours', { params: { from: monthFrom.value, to: monthTo.value, employeeId } }),
    ])
    if (weekOffset.value !== snapshotOffset) { return }
    if (Array.isArray(weekResponse?.data)) { weekTrackedHours.value = weekResponse.data }
    if (Array.isArray(monthResponse?.data)) { monthTrackedHours.value = monthResponse.data; calendarTrackedHours.value = monthResponse.data }
  } catch { /* empty */ } finally {
    if (weekOffset.value === snapshotOffset) { trackedHoursLoading.value = false }
  }
}

async function fetchLeaveForRange(from: string, to: string, employeeId: number): Promise<VacationHoursEntry[]> {
  const response = await api.$get<{ data: { plannings: Record<string, PlanningRow[]> } }>('planningboard', { params: { from, to } })
  return extractLeaveEntries(response?.data?.plannings || {}, employeeId)
}

async function fetchVacationHours() {
  if (!userStore.canMakeRequests) { return }
  const snapshotOffset = weekOffset.value
  try {
    const employeeId = userStore.info.employee_id
    if (!employeeId) { return }
    const [weekEntries, monthEntries] = await Promise.all([
      fetchLeaveForRange(weekFrom.value, weekTo.value, employeeId),
      fetchLeaveForRange(monthFrom.value, monthTo.value, employeeId),
    ])
    if (weekOffset.value !== snapshotOffset) { return }
    weekVacationHours.value = weekEntries
    monthVacationHours.value = monthEntries
    calendarLeaveByDay.value = leaveHoursMap(monthEntries)
  } catch { /* empty */ }
}

async function fetchHolidays() {
  try {
    const response = await api.$get<{ data: Array<{ date: string; name: string }> }>('holidays')
    holidays.value = response?.data || []
    holidaysFetchFailed.value = false
  } catch { holidays.value = []; holidaysFetchFailed.value = true }
}

function debouncedRefresh() { setTimeout(() => { fetchTrackedHours(); fetchVacationHours() }, 800) }

function onCalendarDayClick(dateKey: string) {
  const targetDate = new Date(dateKey)
  const targetMonday = startOfWeek(targetDate, { weekStartsOn: 1 })
  const todayMonday = startOfWeek(today.value, { weekStartsOn: 1 })
  const diffMs = targetMonday.getTime() - todayMonday.getTime()
  weekOffset.value = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
}

async function onCalendarMonthChanged({ from, to }: { from: string; to: string }) {
  if (from === monthFrom.value && to === monthTo.value) {
    calendarTrackedHours.value = monthTrackedHours.value
    calendarLeaveByDay.value = monthLeaveByDay.value
    return
  }
  if (!userStore.canMakeRequests) {
    calendarTrackedHours.value = []
    calendarLeaveByDay.value = {}
    return
  }
  try {
    const employeeId = userStore.info.employee_id
    const [trackedResponse, leaveEntries] = await Promise.all([
      api.$get<{ data: TrackedHoursEntry[] }>('tracked-hours', { params: { from, to, employeeId: employeeId || '' } }),
      employeeId ? fetchLeaveForRange(from, to, employeeId) : Promise.resolve([] as VacationHoursEntry[]),
    ])
    calendarTrackedHours.value = Array.isArray(trackedResponse?.data) ? trackedResponse.data : []
    calendarLeaveByDay.value = leaveHoursMap(leaveEntries)
  } catch {
    calendarTrackedHours.value = []
    calendarLeaveByDay.value = {}
  }
}

function dismissMonthEndReminder() {
  monthEndReminderDismissed.value = true
  localStorage.setItem('monthEndReminderDismissedAt', String(Date.now()))
}

function scrollToToday() {
  if (weekOffset.value !== 0) { return }
  const todayIndex = days.value.findIndex(day => isSameDay(day, today.value))
  if (todayIndex < 0) { return }
  focusedDayIndex.value = todayIndex
  nextTick(() => {
    const component = getFocusedDayComponent()
    const element = component?.$el
    if (element) { element.scrollIntoView({ block: 'center', behavior: 'smooth' }) }
  })
}

onMounted(() => {
  fetchTrackedHours()
  fetchVacationHours()
  fetchHolidays()
  scrollToToday()
  eventBus.on('tracked-hours:refresh', debouncedRefresh)
  eventBus.on('shortcut:prev-week', () => weekOffset.value--)
  eventBus.on('shortcut:next-week', () => weekOffset.value++)
  eventBus.on('shortcut:current-week', () => { weekOffset.value = 0 })
  eventBus.on('shortcut:focus-prev', () => {
    activateNav()
    if (insideDay.value) { getFocusedDayComponent()?.focusPrevEntry(); return }
    if (focusedDayIndex.value! > 0) { focusedDayIndex.value!-- }
    scrollFocusedIntoView()
  })
  eventBus.on('shortcut:focus-next', () => {
    activateNav()
    if (insideDay.value) { getFocusedDayComponent()?.focusNextEntry(); return }
    if (focusedDayIndex.value! < days.value.length - 1) { focusedDayIndex.value!++ }
    scrollFocusedIntoView()
  })
  eventBus.on('shortcut:add-entry', () => { getFocusedDayComponent()?.addEntry() })
  eventBus.on('shortcut:import-gcal', () => { getFocusedDayComponent()?.fetchGCal() })
  eventBus.on('shortcut:import-jira', () => { getFocusedDayComponent()?.handleJiraClick() })
  eventBus.on('shortcut:import-gitlab', () => { getFocusedDayComponent()?.handleGitlabClick() })
  eventBus.on('shortcut:enter-day', () => {
    activateNav()
    if (!insideDay.value) { insideDay.value = true; getFocusedDayComponent()?.focusFirstEntry() }
    else { getFocusedDayComponent()?.editCurrentEntry() }
  })
  eventBus.on('shortcut:exit-day', () => {
    if (insideDay.value) { insideDay.value = false; (document.activeElement as HTMLElement)?.blur() }
    else { navigating.value = false }
  })
  document.addEventListener('mousedown', deactivateNav)
})

onBeforeUnmount(() => {
  eventBus.off('tracked-hours:refresh', debouncedRefresh)
  document.removeEventListener('mousedown', deactivateNav)
})
</script>

<style>
  @reference "~/assets/css/tailwind.css";
  .stat-card {
    @apply flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-stroke-muted shadow text-sm;
  }
  .stat-card--interactive {
    @apply cursor-pointer select-none;
  }
  .stat-card--interactive:hover {
    background-color: var(--color-card-hover);
    border-color: var(--color-stroke);
  }
  .stat-label {
    @apply text-ink-muted font-medium;
  }
  .stat-value {
    @apply text-ink font-bold tabular-nums;
  }
</style>
