<template>
  <div>
    <div class="flex items-center gap-3">
      <h2 class="capitalize text-xl font-bold leading-tight text-ink w-40 shrink-0">
        {{ formatDate(day, 'EEEE do', { locale: it }) }}
      </h2>
      <LocationInput v-model="location" variant="text" @update:model-value="handleLocationChange" />

      <div class="flex items-center gap-2 ml-auto">
        <div class="day-stat-box">
          <span class="day-stat-label">{{ $t('total') }}</span>
          <span class="day-stat-value">{{ printableDuration.hours }}h<template v-if="printableDuration.minutes"> {{ printableDuration.minutes }}m</template></span>
        </div>
        <div class="day-stat-box" :class="trackedBadgeClasses">
          <span class="day-stat-label">{{ $t('wethod_tracked_short') }}</span>
          <span class="day-stat-value">{{ formattedTrackedHours }}</span>
        </div>
        <div v-if="holidayName" class="day-stat-box day-stat-box--holiday-active">
          <span class="day-stat-label">{{ $t('calendar_page.holiday_label') }}</span>
          <span class="day-stat-value">{{ holidayName }}</span>
        </div>
        <div v-if="(leaveHours || 0) > 0" class="day-stat-box day-stat-box--vacation">
          <span class="day-stat-label">{{ $t('calendar_page.leave_label') }}</span>
          <span class="day-stat-value">{{ formattedLeaveHours }}</span>
        </div>
      </div>
    </div>
    <div>
      <Alert v-if="totalNotAdjustable" :message="$t('errors.total_not_adjustable')" level="error" />
      <Alert v-if="adjustmentWentWrong" :message="$t('errors.error_during_adjustment')" level="error" />
    </div>
    <div class="entries-table mb-4 mt-4">
      <div />
      <div :class="entries.length ? 'entries-th' : 'entries-th-muted'">{{ $t('project') }}</div>
      <div :class="entries.length ? 'entries-th' : 'entries-th-muted'">{{ $t('duration') }}</div>
      <div :class="entries.length ? 'entries-th' : 'entries-th-muted'">{{ $t('notes') }}</div>
      <div />
      <div />
      <template v-for="(entry, entryIndex) in entries" :key="`row_${entry.id}`">
        <div
          class="entry-row col-span-full grid grid-cols-subgrid items-center rounded transition-shadow duration-100"
          :class="focused && focusedEntryIndex === entryIndex ? 'ring-2 ring-focus-ring ring-offset-1 ring-offset-card' : ''"
        >
          <TimeEntryItem
            :ref="(el: any) => { entryRefs[entryIndex] = el }"
            :model-value="entry.data"
            :disabled="entry.synced"
            @update:model-value="handleUpdateEvent(entry.id, $event)"
            @user-submit="handleSubmit()"
          />
          <button class="integration-btn integration-btn--danger" :disabled="entry.synced" @click="removeEntry(entry.id)">
            <IconTrash :size="16" :stroke-width="1.5" />
          </button>
        </div>
      </template>
    </div>
    <div class="flex items-center gap-2" style="padding-left: calc(1.25rem + 0.5rem)">
      <button class="integration-btn integration-btn--add" :title="$t('actions')" aria-label="Aggiungi riga" @click="addEntry()">
        <IconPlus :size="18" />
      </button>
      <div class="w-px h-6 bg-stroke" aria-hidden="true" />
      <button class="integration-btn integration-btn--gcal" :title="$t('keyboard_shortcuts.import_gcal')" @click="fetchGCal">
        <IconsGoogleCalendarIcon :size="18" />
      </button>
      <button class="integration-btn integration-btn--jira" :title="isJiraConfigured ? $t('jira.fetch_activity') : $t('jira.login')" @click="handleJiraClick">
        <IconsJiraIcon :size="18" />
      </button>
      <button class="integration-btn integration-btn--gitlab" :title="isGitlabConfigured ? $t('gitlab.fetch_activity') : $t('gitlab.login')" @click="handleGitlabClick">
        <IconsGitlabIcon :size="18" />
      </button>
      <div class="flex-1" />
      <div class="flex items-center gap-2">
        <button class="integration-btn integration-btn--submit" :disabled="disableSubmission" :title="$t('submit_daily_timesheet')" @click="submitDay">
          <IconSend :size="16" :stroke-width="1.5" />
        </button>
        <button class="integration-btn integration-btn--danger" :title="$t('reset_day')" @click="nukeDay">
          <IconTrashX :size="16" :stroke-width="1.5" />
        </button>
      </div>
    </div>
    <NukeTimesheetModal v-model="showNukeModal" :day-entries="entries" :day="dayId" />
    <SubmitTimesheetModal v-model="showSubmitModal" :timesheet-data="timesheetData" />
    <JiraActivityModal v-model="showJiraModal" :day="dayId" @select="handleJiraIssueSelect" />
    <GitlabActivityModal v-model="showGitlabModal" :day="dayId" @select="handleGitlabCommitSelect" />
  </div>
</template>

<script setup lang="ts">
import { IconTrash, IconPlus, IconSend, IconTrashX } from '@tabler/icons-vue'
import { format as formatDate } from 'date-fns'
import { it } from 'date-fns/locale'
import { getPrintableDuration } from '~/utils/duration'
import { prepareForSubmission } from '~/utils/timesheetMapper'
import { getEvents, mapEventsToTimesheetEntries } from '~/utils/gCal'
import { connectJira } from '~/utils/jira'
import { connectGitlab } from '~/utils/gitlab'
import { TranslatableError } from '~/utils/localizableErrors'

const props = defineProps<{
  day: Date
  wethodHours?: number | null
  leaveHours?: number | null
  holidayName?: string
  focused?: boolean
}>()

const { t } = useI18n()
const userStore = useUserStore()
const entriesStore = useEntriesStore()
const projectsStore = useProjectsStore()
const apiDataStore = useApiDataStore()
const eventBus = useEventBus()

const DAY_DURATION = 60 * 8

const adjustmentWentWrong = ref(false)
const location = ref('home')
const showNukeModal = ref(false)
const showSubmitModal = ref(false)
const showJiraModal = ref(false)
const showGitlabModal = ref(false)
const timesheetData = ref<unknown[]>([])
const focusedEntryIndex = ref(0)
const entryRefs = ref<Record<number, any>>({})

const isJiraConfigured = computed(() => userStore.isJiraConfigured)
const isGitlabConfigured = computed(() => userStore.isGitlabConfigured)
const dayId = computed(() => formatDate(props.day, 'yyyy-MM-dd'))
const entries = computed(() => entriesStore.entries.filter(entry => entry.day === dayId.value))
const disableSubmission = computed(() => entries.value.every(entry => entry.synced))
const totalDuration = computed(() => entries.value.reduce((sum, entry) => sum + (entry.data.duration || 0), 0))
const totalDecimalDuration = computed(() => entries.value.reduce((sum, entry) => ((sum * 10) + (entry.data.decimal_duration || 0) * 10) / 10, 0))

const formattedTrackedHours = computed(() => {
  const value = props.wethodHours || 0
  let hours = Math.floor(value)
  let minutes = Math.round((value - hours) * 60)
  if (minutes >= 60) { hours += 1; minutes = 0 }
  if (minutes === 0) { return `${hours}h` }
  return `${hours}h ${minutes}m`
})

const trackedBadgeClasses = computed(() => {
  if (props.wethodHours == null || props.wethodHours === 0) { return '' }
  if (props.wethodHours >= 8) { return 'day-stat-box--success' }
  return 'day-stat-box--warning'
})

const formattedLeaveHours = computed(() => {
  const value = props.leaveHours || 0
  let hours = Math.floor(value)
  let minutes = Math.round((value - hours) * 60)
  if (minutes >= 60) { hours += 1; minutes = 0 }
  if (minutes === 0) { return `${hours}h` }
  return `${hours}h ${minutes}m`
})

const totalNotAdjustable = computed(() => totalDuration.value >= DAY_DURATION && totalDuration.value % 60)
const printableDuration = computed(() => getPrintableDuration(totalDuration.value))

onMounted(() => {
  location.value = entries.value.reduce((acc, entry) => {
    if (entry.data.location && acc !== entry.data.location) { acc = entry.data.location }
    return acc
  }, location.value)
  eventBus.on('shortcut:submit-day', handleShortcutSubmit)
  eventBus.on('shortcut:nuke-day', handleShortcutNuke)
})

onBeforeUnmount(() => {
  eventBus.off('shortcut:submit-day', handleShortcutSubmit)
  eventBus.off('shortcut:nuke-day', handleShortcutNuke)
})

function addEntry({ focus = true } = {}) {
  entriesStore.add({ day: dayId.value, data: { location: location.value } })
  if (focus) {
    nextTick(() => {
      const newIndex = entries.value.length - 1
      entryRefs.value[newIndex]?.focusProject()
    })
  }
}

function removeEntry(id: string) {
  entriesStore.remove(id)
  adjustDecimals()
}

function handleUpdateEvent(id: string, data: any) {
  entriesStore.update({ id, data })
  adjustDecimals()
}

function handleSubmit() {
  addEntry()
  nextTick(() => { focusedEntryIndex.value = entries.value.length - 1 })
}

function adjustDecimals() {
  const total = totalDuration.value
  if (total % 60) { return }
  entries.value.forEach(entry => entriesStore.resetAdjustment(entry.id))
  const provisionalDecimalDuration = entries.value.reduce((sum, entry) => sum + (entry.data.decimal_duration || 0), 0)
  let totalAdjustmentsRequired = ((total / 60) * 10 - (provisionalDecimalDuration * 10)) / 10
  const adjustableEntries = entries.value
    .filter(entry => entry.data.requires_adjustment)
    .sort((first, second) => (first.data.duration || 0) < (second.data.duration || 0) ? 1 : -1)
  const adjustment = 0.1
  let entry: any = true
  while (totalAdjustmentsRequired > 0 && entry) {
    entry = adjustableEntries.find(candidate => !candidate.data.adjusted)
    if (entry) { entriesStore.adjust({ id: entry.id, adjustment }) }
    totalAdjustmentsRequired = (totalAdjustmentsRequired * 10 - adjustment * 10) / 10
  }
  adjustmentWentWrong.value = totalDecimalDuration.value * 60 !== total
}

function handleLocationChange(newLocation: string) {
  entries.value
    .filter(entry => entry.data.location !== newLocation && !entry.synced)
    .forEach(({ id }) => entriesStore.updateLocation({ id, location: newLocation }))
}

function nukeDay() { showNukeModal.value = true }

function submitDay() {
  const dayEntries = [{ day: dayId.value, entries: entries.value }]
  try {
    timesheetData.value = prepareForSubmission(dayEntries, projectsStore.projects, apiDataStore.projects, userStore.info.employee_id)
    showSubmitModal.value = true
  } catch (error: any) {
    let message = error.message
    if (error instanceof TranslatableError) { message = t(error.message, error.errorData) }
    alert(message)
  }
}

async function handleJiraClick() {
  if (!isJiraConfigured.value) {
    try { await connectJira() }
    catch (error: any) { alert('Jira login failed: ' + (error.response?.data?.message || error.message)); return }
  }
  showJiraModal.value = true
}

function handleJiraIssueSelect(issue: { key: string; summary: string }) {
  const notes = `${issue.key} | ${issue.summary}`
  entriesStore.add({ day: dayId.value, data: { location: location.value, notes } })
}

async function handleGitlabClick() {
  if (!isGitlabConfigured.value) {
    try { await connectGitlab() }
    catch (error: any) { alert('GitLab login failed: ' + (error.response?.data?.message || error.message)); return }
  }
  showGitlabModal.value = true
}

function handleGitlabCommitSelect(commit: { title: string }) {
  entriesStore.add({ day: dayId.value, data: { location: location.value, notes: commit.title } })
}

async function fetchGCal() {
  try {
    const userProjects = projectsStore.projects
    const events = await getEvents(props.day)
    const entriesFromCalendar = mapEventsToTimesheetEntries(events, entries.value, userProjects)
    entriesFromCalendar.forEach((entry: any) =>
      entriesStore.add({ day: dayId.value, data: { location: location.value, ...entry } }),
    )
    if (entriesFromCalendar.length) { adjustDecimals() }
  } catch (error: any) {
    alert(t('error') + ': ' + (error.message || 'Google Calendar non raggiungibile'))
  }
}

function focusFirstEntry() { focusedEntryIndex.value = 0 }
function focusPrevEntry() { if (focusedEntryIndex.value > 0) { focusedEntryIndex.value-- } }
function focusNextEntry() { if (focusedEntryIndex.value < entries.value.length - 1) { focusedEntryIndex.value++ } }
function editCurrentEntry() {
  nextTick(() => { entryRefs.value[focusedEntryIndex.value]?.focusProject() })
}

function handleShortcutSubmit() { if (props.focused) { submitDay() } }
function handleShortcutNuke() { if (props.focused) { nukeDay() } }

defineExpose({ addEntry, focusFirstEntry, focusPrevEntry, focusNextEntry, editCurrentEntry, fetchGCal, handleJiraClick, handleGitlabClick })
</script>

<style>
  @reference "~/assets/css/tailwind.css";
  .entries-table {
    display: grid;
    grid-template-columns: [status] 1.25rem [project] 14rem [duration] 4rem [notes] 1fr [location] 2.5rem [delete] 2.5rem;
    grid-template-rows: auto;
    place-items: center;
    grid-gap: 0.5rem 0.5rem;
  }
  .entry-row { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; place-items: center; padding: 0.25rem 0; }
  .entries-th { @apply w-full text-ink text-sm font-bold leading-tight tracking-normal }
  .entries-th-muted { @apply w-full text-ink-faint text-xs font-medium leading-tight tracking-normal }
  .integration-btn { @apply relative flex items-center justify-center w-10 h-10 rounded-lg border border-stroke-muted bg-card shadow transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-1; color: var(--color-ink-secondary); }
  .integration-btn:not(:disabled):hover { background-color: var(--color-card-hover); border-color: var(--color-stroke); }
  .integration-btn:disabled { background-color: var(--color-card-dim); color: var(--color-ink-disabled); cursor: default; }
  .integration-btn--add { color: var(--color-accent-fg); }
  .integration-btn--danger { color: var(--color-ink-muted); }
  .integration-btn--danger:not(:disabled):hover { border-color: var(--color-danger); }
  .integration-btn--submit:not(:disabled) { background-color: var(--color-accent); border-color: var(--color-accent); color: var(--color-ink-inverse); }
  .integration-btn--submit:not(:disabled):hover { background-color: var(--color-accent-hover); border-color: var(--color-accent-hover); }
  .integration-btn--gcal { color: #4285F4; }
  .integration-btn--jira { color: #0052CC; }
  .integration-btn--gitlab { color: #FC6D26; }
  .dark .integration-btn--gcal { color: #6ea8ff; }
  .dark .integration-btn--jira { color: #5b9bff; }
  .dark .integration-btn--gitlab { color: #ff8f56; }
  .day-stat-box { @apply flex items-center gap-1.5 px-3 py-1 bg-card rounded-lg border border-stroke-muted shadow text-sm; }
  .day-stat-box--success { border-color: var(--color-success); background-color: var(--color-success-soft); }
  .day-stat-box--success .day-stat-value { color: var(--color-success-text); }
  .day-stat-box--warning { border-color: var(--color-warning); background-color: var(--color-warning-soft); }
  .day-stat-box--warning .day-stat-value { color: var(--color-warning-text); }
  .day-stat-box--vacation { border-color: var(--color-vacation); background-color: var(--color-vacation-soft); }
  .day-stat-box--vacation .day-stat-value { color: var(--color-vacation-text); }
  .day-stat-box--holiday-active { border-color: var(--color-success); background-color: var(--color-success-soft); }
  .day-stat-box--holiday-active .day-stat-label { color: var(--color-success-text); }
  .day-stat-box--holiday-active .day-stat-value { @apply text-xs font-medium; color: var(--color-success-text); }
  .day-stat-label { @apply text-ink-faint text-xs font-medium; }
  .day-stat-value { @apply text-ink font-bold tabular-nums; }
</style>
