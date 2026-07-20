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
          <button class="p-2.5 text-ink-muted cursor-pointer hover:bg-card-hover rounded-l-lg transition-colors focus:outline-none" :title="$t('previous_week')" @click="weekOffset--">
            <IconChevronLeft :size="18" />
          </button>
          <span
            class="px-4 py-2 text-sm font-semibold text-ink border-l border-r border-stroke-muted select-none cursor-pointer hover:bg-card-hover transition-colors"
            @click.stop="monthCalendarRef?.toggle()"
          >
            {{ weekLabel }}
          </span>
          <button class="p-2.5 text-ink-muted cursor-pointer hover:bg-card-hover rounded-r-lg transition-colors focus:outline-none" :title="$t('next_week')" @click="weekOffset++">
            <IconChevronRight :size="18" />
          </button>
        </div>
        <button
          v-if="weekOffset !== 0"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-soft text-accent-fg cursor-pointer hover:bg-accent-soft transition-colors border border-accent"
          @click="weekOffset = 0"
        >
          {{ $t('current_week') }}
        </button>
      </div>

      <div class="flex items-stretch gap-3 mt-4">
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
              :tracked-hours="calendarTrackedHours"
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
        <BusinessUnitFilter v-if="userStore.businessUnitsEnabled" class="ml-auto" />
      </div>
    </div>

    <div class="container mx-auto px-6">
      <div
        v-for="(day, index) of days"
        :key="day.toString()"
        class="day-card w-full rounded-lg border mb-5 p-2 shadow-sm transition-shadow duration-150"
        :class="dayCardClasses(day, index)"
      >
        <DayInputItem
          :ref="(el: any) => { dayRefs[index] = el }"
          :day="day"
          :focused="navigating && insideDay && focusedDayIndex === index"
          :wethod-hours="trackedHoursByDay[formatDate(day, 'yyyy-MM-dd')]"
          :leave-hours="leaveHoursByDay[formatDate(day, 'yyyy-MM-dd')]"
          :holiday-name="holidaysByDate[formatDate(day, 'yyyy-MM-dd')]"
        />
      </div>
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

definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const userStore = useUserStore()
const eventBus = useEventBus()
const api = useApi()
const { today } = useLiveToday()
const route = useRoute()
const router = useRouter()

const queryWeek = parseInt(route.query.week as string, 10)
const weekOffset = ref(Number.isFinite(queryWeek) ? queryWeek : 0)
const weekTrackedHours = ref<Array<{ date: string; value: number }>>([])
const monthTrackedHours = ref<Array<{ date: string; value: number }>>([])
const calendarTrackedHours = ref<Array<{ date: string; value: number }>>([])
const trackedHoursLoading = ref(false)
const showOfficeDaysModal = ref(false)
const weekVacationHours = ref<Array<{ date: string; amount: number; projectId: number }>>([])
const holidays = ref<Array<{ date: string; name: string }>>([])
const holidaysFetchFailed = ref(false)
const focusedDayIndex = ref<number | null>(null)
const insideDay = ref(false)
const navigating = ref(false)
const showExtensionGuide = ref(false)
const monthCalendarRef = ref<any>(null)
const dayRefs = ref<Record<number, any>>({})

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
const monthTrackedDays = computed(() => monthTrackedHours.value.filter(entry => entry.value >= 8).length)
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
const leaveHoursByDay = computed(() => {
  const map: Record<string, number> = {}
  for (const entry of weekVacationHours.value) {
    if (entry.projectId === 83 || entry.projectId === 90) {
      map[entry.date] = (map[entry.date] || 0) + entry.amount
    }
  }
  return map
})
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

function dayCardClasses(day: Date, index: number): string[] {
  const classes: string[] = []
  if (isSameDay(day, today.value)) { classes.push('border-accent bg-accent-soft') }
  else { classes.push('border-stroke') }
  if (navigating.value && focusedDayIndex.value === index && !insideDay.value) {
    classes.push('ring-2 ring-focus-ring ring-offset-2 ring-offset-page')
  }
  return classes
}

function deactivateNav() { navigating.value = false; insideDay.value = false }
function activateNav() { navigating.value = true; if (focusedDayIndex.value === null) { focusedDayIndex.value = 0 } }

function getFocusedDayComponent() {
  if (focusedDayIndex.value === null) { focusedDayIndex.value = 0 }
  return dayRefs.value[focusedDayIndex.value]
}

function scrollFocusedIntoView() {
  nextTick(() => {
    const component = dayRefs.value[focusedDayIndex.value!]
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

async function fetchVacationHours() {
  if (!userStore.canMakeRequests) { return }
  const snapshotOffset = weekOffset.value
  try {
    const employeeId = userStore.info.employee_id
    const response = await api.$get<{ data: { plannings: Record<string, Array<{ employee_id: number; project_id: number; day: string; amount: number }>> } }>('planningboard', { params: { from: weekFrom.value, to: weekTo.value } })
    if (weekOffset.value !== snapshotOffset) { return }
    const plannings = response?.data?.plannings || {}
    const entries: Array<{ date: string; amount: number; projectId: number }> = []
    for (const group of Object.values(plannings)) {
      if (!Array.isArray(group)) { continue }
      for (const planning of group) {
        if (planning.employee_id === employeeId && (planning.project_id === 83 || planning.project_id === 90)) {
          entries.push({ date: planning.day, amount: planning.amount, projectId: planning.project_id })
        }
      }
    }
    weekVacationHours.value = entries
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
  if (from === monthFrom.value && to === monthTo.value) { calendarTrackedHours.value = monthTrackedHours.value; return }
  if (!userStore.canMakeRequests) { calendarTrackedHours.value = []; return }
  try {
    const employeeId = userStore.info.employee_id || ''
    const response = await api.$get<{ data: Array<{ date: string; value: number }> }>('tracked-hours', { params: { from, to, employeeId } })
    if (Array.isArray(response?.data)) { calendarTrackedHours.value = response.data }
  } catch { calendarTrackedHours.value = [] }
}

function dismissMonthEndReminder() {
  monthEndReminderDismissed.value = true
  localStorage.setItem('monthEndReminderDismissedAt', String(Date.now()))
}

function scrollToToday() {
  if (weekOffset.value !== 0) { return }
  const todayIndex = days.value.findIndex(day => isSameDay(day, today.value))
  if (todayIndex < 0) { return }
  nextTick(() => {
    const component = dayRefs.value[todayIndex]
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
