<template>
  <div>
    <div class="flex items-center gap-3">
      <h2 class="capitalize text-xl font-bold leading-tight text-ink w-40 shrink-0">
        {{ $dateFns.format(day, 'EEEE do') }}
      </h2>
      <location-input v-model="location" variant="text" @input="handleLocationChange" />

      <div class="flex items-center gap-2 ml-auto">
        <div class="day-stat-box">
          <span class="day-stat-label">{{ $t('total') }}</span>
          <span class="day-stat-value">{{ printableDuration.hours }}h<template v-if="printableDuration.minutes"> {{ printableDuration.minutes }}m</template></span>
        </div>
        <div class="day-stat-box" :class="trackedBadgeClasses">
          <span class="day-stat-label">{{ $t('wethod_tracked_short') }}</span>
          <span class="day-stat-value">{{ formattedTrackedHours }}</span>
        </div>
        <div v-if="holidayName" class="day-stat-box day-stat-box--holiday">
          <span class="day-stat-label">{{ $t('calendar_page.holiday_label') }}</span>
          <span class="day-stat-value">{{ holidayName }}</span>
        </div>
        <div class="day-stat-box" :class="leaveBadgeClasses">
          <span class="day-stat-label">{{ $t('calendar_page.leave_label') }}</span>
          <span class="day-stat-value">{{ formattedLeaveHours }}</span>
        </div>
      </div>
    </div>
    <div>
      <alert v-if="totalNotAdjustable" :message="$t('errors.total_not_adjustable')" level="error" />
      <alert v-if="adjustmentWentWrong" :message="$t('errors.error_during_adjustment')" level="error" />
    </div>
    <div class="entries-table mb-4 mt-4">
      <div />
      <div :class="entries.length ? 'entries-th' : 'entries-th-muted'">
        {{ $t('project') }}
      </div>
      <div :class="entries.length ? 'entries-th' : 'entries-th-muted'">
        {{ $t('duration') }}
      </div>
      <div :class="entries.length ? 'entries-th' : 'entries-th-muted'">
        {{ $t('notes') }}
      </div>
      <div />
      <div />
      <template v-for="(entry, entryIndex) in entries">
        <div
          :key="`row_${entry.id}`"
          class="entry-row col-span-full grid grid-cols-subgrid items-center rounded transition-shadow duration-100"
          :class="focused && focusedEntryIndex === entryIndex ? 'ring-2 ring-focus-ring ring-offset-1 ring-offset-card' : ''"
        >
          <time-entry-item
            :ref="'entry-' + entryIndex"
            :value="entry.data"
            :disabled="entry.synced"
            @input="handleUpdateEvent(entry.id, $event)"
            @userSubmit="handleSubmit(entry.id)"
          />
          <button
            class="flex items-center justify-center w-10 h-10 rounded-lg border shadow transition-colors duration-150 focus:outline-none"
            :class="entry.synced
              ? 'bg-card-dim border-stroke-muted text-ink-disabled cursor-default'
              : 'bg-card border-stroke-muted text-ink-muted hover:text-danger hover:border-danger hover:bg-danger-soft focus:text-danger'"
            :disabled="entry.synced"
            @click="removeEntry(entry.id)"
          >
            <trash-icon width="16" height="16" stroke-width="1.5" />
          </button>
        </div>
      </template>
    </div>
    <div class="flex items-center gap-2" style="padding-left: calc(1.25rem + 0.5rem)">
      <button
        class="integration-btn text-accent-fg"
        :title="$t('actions')"
        aria-label="Aggiungi riga"
        @click="addEntry"
      >
        <plus-icon width="18" height="18" />
      </button>

      <div class="w-px h-6 bg-stroke" aria-hidden="true" />

      <button
        class="integration-btn integration-btn--gcal"
        :title="$t('keyboard_shortcuts.import_gcal')"
        :aria-label="$t('keyboard_shortcuts.import_gcal')"
        @click="fetchGCal"
      >
        <icons-google-calendar-icon :size="18" />
      </button>
      <button
        class="integration-btn integration-btn--jira"
        :title="isJiraConfigured ? $t('jira.fetch_activity') : $t('jira.login')"
        :aria-label="isJiraConfigured ? $t('jira.fetch_activity') : $t('jira.login')"
        @click="handleJiraClick"
      >
        <icons-jira-icon :size="18" />
      </button>
      <button
        class="integration-btn integration-btn--gitlab"
        :title="isGitlabConfigured ? $t('gitlab.fetch_activity') : $t('gitlab.login')"
        :aria-label="isGitlabConfigured ? $t('gitlab.fetch_activity') : $t('gitlab.login')"
        @click="handleGitlabClick"
      >
        <icons-gitlab-icon :size="18" />
      </button>

      <div class="flex-1" />

      <div class="flex items-center gap-2">
        <button
          class="flex items-center justify-center w-10 h-10 rounded-lg border shadow transition-colors duration-150 focus:outline-none"
          :class="disableSubmission
            ? 'bg-card-dim border-stroke-muted text-ink-disabled cursor-default'
            : 'bg-accent border-accent text-ink-inverse hover:bg-accent-hover hover:border-accent-hover focus:ring-2 focus:ring-focus-ring focus:ring-offset-1'"
          :disabled="disableSubmission"
          :title="$t('submit_daily_timesheet')"
          @click="submitDay"
        >
          <send-icon width="16" height="16" stroke-width="1.5" />
        </button>
        <button
          class="flex items-center justify-center w-10 h-10 rounded-lg border border-stroke-muted bg-card shadow transition-colors duration-150 focus:outline-none text-ink-muted hover:text-danger hover:border-danger hover:bg-danger-soft focus:text-danger"
          :title="$t('reset_day')"
          @click="nukeDay"
        >
          <trash-x-icon width="16" height="16" stroke-width="1.5" />
        </button>
      </div>
    </div>
    <nuke-timesheet-modal v-model="showNukeModal" :day-entries="entries" :day="dayId" />
    <submit-timesheet-modal v-model="showSubmitModal" :timesheet-data="timesheetData" />
    <jira-activity-modal v-model="showJiraModal" :day="dayId" @select="handleJiraIssueSelect" />
    <gitlab-activity-modal v-model="showGitlabModal" :day="dayId" @select="handleGitlabCommitSelect" />
  </div>
</template>

<script>
import { TrashIcon, PlusIcon, SendIcon, TrashXIcon } from 'vue-tabler-icons'
import { mapActions, mapMutations, mapGetters } from 'vuex'
import TimeEntryItem from '~/components/TimeEntryItem'
import Alert from '~/components/Alert'
import { getPrintableDuration } from '~/utils/duration'
import { prepareForSubmission } from '~/utils/timesheetMapper'
import { getEvents, mapEventsToTimesheetEntries } from '~/utils/gCal'
import { connectJira } from '~/utils/jira'
import { connectGitlab } from '~/utils/gitlab'
import { TranslatableError } from '~/utils/localizableErrors'

const dayDuration = 60 * 8

export default {
  components: {
    TimeEntryItem,
    TrashIcon,
    PlusIcon,
    Alert,
    TrashXIcon,
    SendIcon
  },
  props: {
    day: {
      required: true,
      type: Date
    },
    wethodHours: {
      type: Number,
      default: null
    },
    leaveHours: {
      type: Number,
      default: null
    },
    holidayName: {
      type: String,
      default: ''
    },
    focused: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    adjustmentWentWrong: false,
    location: 'home',
    showNukeModal: false,
    showSubmitModal: false,
    showJiraModal: false,
    showGitlabModal: false,
    timesheetData: [],
    focusedEntryIndex: 0
  }),
  computed: {
    ...mapGetters({
      isJiraConfigured: 'user/isJiraConfigured',
      isGitlabConfigured: 'user/isGitlabConfigured'
    }),
    dayId () {
      return this.$dateFns.format(this.day, 'yyyy-MM-dd')
    },
    entries () {
      return this.$store.getters['entries/entries'].filter(e => e.day === this.dayId)
    },
    disableSubmission () {
      return this.entries.every(e => e.synced)
    },
    totalDuration () {
      return this.entries.reduce((sum, e) => sum + (e.data.duration || 0), 0)
    },
    totalDecimalDuration () {
      return this.entries.reduce((sum, e) => ((sum * 10) + (e.data.decimal_duration || 0) * 10) / 10, 0)
    },
    formattedTrackedHours () {
      const value = this.wethodHours || 0
      let hours = Math.floor(value)
      let minutes = Math.round((value - hours) * 60)
      if (minutes >= 60) { hours += 1; minutes = 0 }
      if (minutes === 0) { return `${hours}h` }
      return `${hours}h ${minutes}m`
    },
    trackedBadgeClasses () {
      if (this.wethodHours == null || this.wethodHours === 0) {
        return ''
      }
      if (this.wethodHours >= 8) {
        return 'day-stat-box--success'
      }
      return 'day-stat-box--warning'
    },
    formattedLeaveHours () {
      const value = this.leaveHours || 0
      let hours = Math.floor(value)
      let minutes = Math.round((value - hours) * 60)
      if (minutes >= 60) { hours += 1; minutes = 0 }
      if (minutes === 0) { return `${hours}h` }
      return `${hours}h ${minutes}m`
    },
    leaveBadgeClasses () {
      if (this.leaveHours > 0) {
        return 'day-stat-box--vacation'
      }
      return ''
    },
    totalNotAdjustable () {
      return this.totalDuration >= dayDuration && this.totalDuration % 60
    },
    printableDuration () {
      return getPrintableDuration(this.totalDuration)
    }
  },
  mounted () {
    this.location = this.entries.reduce((acc, e) => {
      if (e.data.location && acc !== e.data.location) {
        acc = e.data.location
      }

      return acc
    }, this.location)

    this.$nuxt.$on('shortcut:submit-day', this.handleShortcutSubmit)
    this.$nuxt.$on('shortcut:nuke-day', this.handleShortcutNuke)
  },
  beforeDestroy () {
    this.$nuxt.$off('shortcut:submit-day', this.handleShortcutSubmit)
    this.$nuxt.$off('shortcut:nuke-day', this.handleShortcutNuke)
  },
  methods: {
    addEntry ({ focus = true } = {}) {
      this.addEntryForDay({ day: this.dayId, data: { location: this.location } })
      if (focus) {
        this.$nextTick(() => {
          const newIndex = this.entries.length - 1
          const ref = this.$refs['entry-' + newIndex]
          const component = Array.isArray(ref) ? ref[0] : ref
          if (component) { component.focusProject() }
        })
      }
    },
    removeEntry (id) {
      this.removeEntry(id)

      this.adjustDecimals()
    },
    handleUpdateEvent (id, data) {
      this.updateEntry({ id, data })

      this.adjustDecimals()
    },
    handleSubmit () {
      this.addEntry()
      this.$nextTick(() => {
        this.focusedEntryIndex = this.entries.length - 1
      })
    },
    adjustDecimals () {
      const totalDuration = this.totalDuration

      // if duration is less than day don't try to perform adjustment
      // if (totalDuration < dayDuration) {
      //   return
      // }

      // if duration is not / 60 don't try to adjust
      if (totalDuration % 60) {
        return
      }

      // reset all adjustments
      this.entries.forEach(entry => this.resetEntryAdjustment(entry.id))

      const provisionalDecimalDuration = this.entries.reduce((sum, e) => sum + e.data.decimal_duration, 0)
      let totalAdjustmentsRequired = ((totalDuration / 60) * 10 - (provisionalDecimalDuration * 10)) / 10
      const adjustableEntries = this.entries
        .filter(e => e.data.requires_adjustment)
        .sort((a, b) => a.data.duration < b.data.duration ? 1 : -1)

      const adjustment = 0.1

      let entry = true
      while (totalAdjustmentsRequired > 0 && entry) {
        entry = adjustableEntries.find(e => !e.data.adjusted)
        this.adjustEntry({ id: entry.id, adjustment })

        totalAdjustmentsRequired = (totalAdjustmentsRequired * 10 - adjustment * 10) / 10
      }

      if (this.totalDecimalDuration * 60 !== totalDuration) {
        this.adjustmentWentWrong = true
      } else {
        this.adjustmentWentWrong = false
      }
    },
    handleLocationChange (location) {
      this.entries
        .filter(e => e.data.location !== location && !e.synced)
        .forEach(({ id }) => this.updateLocationEntry({ id, location }))
    },
    nukeDay () {
      this.showNukeModal = true
    },
    submitDay () {
      const dayEntries = [{
        day: this.dayId,
        entries: this.entries
      }]

      const userProjects = this.$store.getters['projects/projects']
      const linkedProjects = this.$store.getters['apiData/projects']
      const employeeId = this.$store.getters['user/info'].employee_id

      try {
        this.timesheetData = prepareForSubmission(dayEntries, userProjects, linkedProjects, employeeId)
        this.showSubmitModal = true
      } catch (error) {
        console.error(error)

        let message = error.message

        if (error instanceof TranslatableError) {
          message = this.$t(error.message, error.errorData)
        }

        alert(message)
      }
    },
    async handleJiraClick () {
      if (!this.isJiraConfigured) {
        try {
          await connectJira()
        } catch (error) {
          console.error('Jira login failed:', error)
          alert('Jira login failed: ' + (error.response?.data?.message || error.message))
          return
        }
      }
      this.showJiraModal = true
    },
    handleJiraIssueSelect (issue) {
      const notes = `${issue.key} | ${issue.summary}`
      this.addEntryForDay({ day: this.dayId, data: { location: this.location, notes } })
    },
    async handleGitlabClick () {
      if (!this.isGitlabConfigured) {
        try {
          await connectGitlab()
        } catch (error) {
          console.error('GitLab login failed:', error)
          alert('GitLab login failed: ' + (error.response?.data?.message || error.message))
          return
        }
      }
      this.showGitlabModal = true
    },
    handleGitlabCommitSelect (commit) {
      this.addEntryForDay({ day: this.dayId, data: { location: this.location, notes: commit.title } })
    },
    async fetchGCal () {
      try {
        const userProjects = this.$store.getters['projects/projects']
        const events = await getEvents(this.day)

        const entriesFromCalendar = mapEventsToTimesheetEntries(events, this.entries, userProjects)
        entriesFromCalendar.forEach(entry =>
          this.addEntryForDay({ day: this.dayId, data: { location: this.location, ...entry } })
        )

        if (entriesFromCalendar.length) {
          this.adjustDecimals()
        }
      } catch (error) {
        console.error('GCal import failed:', error)
        alert(this.$t('error') + ': ' + (error.message || 'Google Calendar non raggiungibile'))
      }
    },
    ...mapActions({
      addEntryForDay: 'entries/add'
    }),
    focusFirstEntry () {
      this.focusedEntryIndex = 0
    },
    focusPrevEntry () {
      if (this.focusedEntryIndex > 0) {
        this.focusedEntryIndex--
      }
    },
    focusNextEntry () {
      if (this.focusedEntryIndex < this.entries.length - 1) {
        this.focusedEntryIndex++
      }
    },
    editCurrentEntry () {
      this.$nextTick(() => {
        const ref = this.$refs['entry-' + this.focusedEntryIndex]
        const component = Array.isArray(ref) ? ref[0] : ref
        if (component) { component.focusProject() }
      })
    },
    handleShortcutSubmit () {
      if (!this.focused) { return }
      this.submitDay()
    },
    handleShortcutNuke () {
      if (!this.focused) { return }
      this.nukeDay()
    },
    ...mapMutations({
      removeEntry: 'entries/remove',
      updateEntry: 'entries/update',
      updateLocationEntry: 'entries/updateLocation',
      adjustEntry: 'entries/adjust',
      resetEntryAdjustment: 'entries/resetAdjustment'
    })
  }
}
</script>

<style lang="postcss">
  .entries-table {
    display: grid;
    grid-template-columns: [status] 1.25rem [project] 14rem [duration] 4rem [notes] 1fr [location] 2.5rem [delete] 2.5rem;
    grid-template-rows: auto;
    place-items: center;
    grid-gap: 0.5rem 0.5rem;
  }

  .entry-row {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    place-items: center;
    padding: 0.25rem 0;
  }

  .entries-th {
    @apply w-full text-ink text-sm font-bold leading-tight tracking-normal
  }

  .entries-th-muted {
    @apply w-full text-ink-faint text-xs font-medium leading-tight tracking-normal
  }

  .integration-btn {
    @apply relative flex items-center justify-center w-10 h-10 rounded-lg
           border border-stroke-muted bg-card shadow
           transition-all duration-150 ease-in-out
           hover:bg-card-hover hover:border-stroke
           focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-1;
    color: var(--color-ink-secondary);
  }

  .integration-btn--gcal  { color: #4285F4; }
  .integration-btn--jira  { color: #0052CC; }
  .integration-btn--gitlab { color: #FC6D26; }

  .dark .integration-btn--gcal  { color: #6ea8ff; }
  .dark .integration-btn--jira  { color: #5b9bff; }
  .dark .integration-btn--gitlab { color: #ff8f56; }

  .day-stat-box {
    @apply flex items-center gap-1.5 px-3 py-1 bg-card rounded-lg border border-stroke-muted shadow text-sm;
  }

  .day-stat-box--success {
    border-color: var(--color-success);
    background-color: var(--color-success-soft);
  }

  .day-stat-box--success .day-stat-value {
    color: var(--color-success-text);
  }

  .day-stat-box--warning {
    border-color: var(--color-warning);
    background-color: var(--color-warning-soft);
  }

  .day-stat-box--warning .day-stat-value {
    color: var(--color-warning-text);
  }

  .day-stat-box--vacation {
    border-color: var(--color-vacation);
    background-color: var(--color-vacation-soft);
  }

  .day-stat-box--vacation .day-stat-value {
    color: var(--color-vacation-text);
  }

  .day-stat-box--holiday {
    border-color: var(--color-stroke-muted);
    background-color: var(--color-card-dim);
  }

  .day-stat-box--holiday .day-stat-value {
    @apply text-xs font-medium text-ink-muted;
  }

  .day-stat-label {
    @apply text-ink-faint text-xs font-medium;
  }

  .day-stat-value {
    @apply text-ink font-bold tabular-nums;
  }

</style>
