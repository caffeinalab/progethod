<template>
  <div>
    <div class="flex justify-between items-center">
      <h2 class="capitalize text-xl font-bold leading-tight text-gray-800">
        {{ $dateFns.format(day, 'EEEE do') }}
      </h2>
      <location-input v-model="location" variant="text" @input="handleLocationChange" />
      <div class="text-xl font-bold text-gray-700 tabular-nums">
        {{ printableDuration.hours }}h<span v-if="printableDuration.minutes"> {{ printableDuration.minutes }}m</span>
      </div>
      <div
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
        :class="trackedBadgeClasses"
        :title="$t('wethod_tracked')"
      >
        <template v-if="wethodHours != null">
          {{ $t('tracked_hours') }} {{ formattedTrackedHours }}
        </template>
        <template v-else>
          {{ $t('tracked_hours') }} –
        </template>
      </div>
      <div>
        <button
          class="ml-2 mr-1 p-2 text-white focus:outline-none border border-transparent focus:border-gray-800 focus:shadow-outline-gray bg-indigo-700 hover:bg-indigo-600 rounded transition duration-150 ease-in-out disabled:cursor-default disabled:bg-gray-500"
          :disabled="disableSubmission"
          :title="$t('submit_daily_timesheet')"
          @click="submitDay"
        >
          <send-icon width="20" height="20" />
        </button>
        <button
          class="ml-1 p-2 border-transparent border focus:bg-yellow-400 hover:bg-yellow-400 dark:focus:bg-gray-800 bg-white dark:hover:bg-gray-800 cursor-pointer rounded focus:outline-none transition duration-150 ease-in-out"
          :title="$t('reset_day')"
          @click="nukeDay"
        >
          <trash-x-icon width="20" height="20" />
        </button>
      </div>
    </div>
    <div>
      <alert v-if="totalNotAdjustable" :message="$t('errors.total_not_adjustable')" level="error" />
      <alert v-if="adjustmentWentWrong" :message="$t('errors.error_during_adjustment')" level="error" />
    </div>
    <div class="entries-table mb-4 mt-2">
      <div />
      <div class="entries-th">
        {{ $t('project') }}
      </div>
      <div class="entries-th">
        {{ $t('duration') }}
      </div>
      <div class="entries-th">
        {{ $t('notes') }}
      </div>
      <div />
      <div />
      <template v-for="(entry, entryIndex) in entries">
        <div
          :key="`row_${entry.id}`"
          class="entry-row col-span-full grid grid-cols-subgrid items-center rounded transition-shadow duration-100"
          :class="focused && focusedEntryIndex === entryIndex ? 'ring-2 ring-indigo-400 ring-offset-1' : ''"
        >
          <time-entry-item
            :ref="'entry-' + entryIndex"
            :value="entry.data"
            :disabled="entry.synced"
            @input="handleUpdateEvent(entry.id, $event)"
            @userSubmit="handleSubmit(entry.id)"
          />
          <button
            class="ml-2 mr-2 focus:text-red-500 p-2 border-transparent border focus:bg-gray-100 dark:focus:bg-gray-800 dark:hover:bg-gray-800 rounded focus:outline-none"
            :class="{ 'text-gray-300 cursor-default': entry.synced, 'hover:text-red-500 hover:bg-gray-100': !entry.synced }"
            :disabled="entry.synced"
            @click="removeEntry(entry.id)"
          >
            <trash-icon
              width="20"
              height="20"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </button>
        </div>
      </template>
    </div>
    <div class="ml-10 flex items-center gap-1.5">
      <button
        class="integration-btn text-indigo-600"
        :title="$t('actions')"
        aria-label="Aggiungi riga"
        @click="addEntry"
      >
        <plus-icon width="18" height="18" />
      </button>

      <div class="w-px h-5 bg-gray-200 mx-0.5" aria-hidden="true" />

      <button
        class="integration-btn"
        :title="$t('keyboard_shortcuts.import_gcal')"
        :aria-label="$t('keyboard_shortcuts.import_gcal')"
        @click="fetchGCal"
      >
        <icons-google-calendar-icon :size="18" class="text-[#4285F4]" />
      </button>
      <button
        class="integration-btn"
        :title="isJiraConfigured ? $t('jira.fetch_activity') : $t('jira.login')"
        :aria-label="isJiraConfigured ? $t('jira.fetch_activity') : $t('jira.login')"
        @click="handleJiraClick"
      >
        <icons-jira-icon :size="18" class="text-[#0052CC]" />
      </button>
      <button
        class="integration-btn"
        :title="isGitlabConfigured ? $t('gitlab.fetch_activity') : $t('gitlab.login')"
        :aria-label="isGitlabConfigured ? $t('gitlab.fetch_activity') : $t('gitlab.login')"
        @click="handleGitlabClick"
      >
        <icons-gitlab-icon :size="18" class="text-[#FC6D26]" />
      </button>
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
      if (this.wethodHours == null) { return '–' }
      const hours = Math.floor(this.wethodHours)
      const minutes = Math.round((this.wethodHours - hours) * 60)
      if (minutes === 0) { return `${hours}h` }
      return `${hours}h ${minutes}m`
    },
    trackedBadgeClasses () {
      if (this.wethodHours == null || this.wethodHours === 0) {
        return 'bg-gray-100 text-gray-400'
      }
      if (this.wethodHours === 8) {
        return 'bg-green-100 text-green-700'
      }
      return 'bg-amber-100 text-amber-700'
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
      const sha = commit.shortSha || (commit.sha ? commit.sha.substring(0, 8) : '')
      const notes = `${sha} | ${commit.title}`
      this.addEntryForDay({ day: this.dayId, data: { location: this.location, notes } })
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
    grid-template-columns: [warn] 2rem [project] 14rem [duration] 4rem [notes] auto [location] 5rem [delete] 3rem;
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
    @apply w-full text-gray-800 text-sm font-bold leading-tight tracking-normal
  }

  .integration-btn {
    @apply relative p-2 bg-white border border-gray-200 rounded-lg
           transition-all duration-150 ease-in-out
           hover:shadow-md hover:border-gray-300 hover:bg-gray-50
           focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1;
  }

</style>
