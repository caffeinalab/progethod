<template>
  <modal :value="value" @input="emitChange">
    <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-danger-soft border border-danger border-opacity-20">
      <alert-triangle-icon width="24" height="24" class="text-danger" />
    </div>
    <p class="text-lg font-semibold mt-4 text-ink text-center">
      {{ $t('about_to_nuke_timesheet') }}
    </p>
    <p class="text-sm leading-relaxed mt-1.5 text-center text-ink-muted max-w-xs">
      {{ $t('nuke_timesheet_warning') }}
    </p>
    <div v-if="isSubmitting && !isExpired" class="w-full mt-4">
      <progress-bar :fill="sentPercentage" />
    </div>
    <alert v-if="isExpired" class="w-full mt-4" level="error" :message="$t('session_expired')" />
    <div v-if="!isExpired" class="flex items-center gap-3 mt-6 w-full">
      <button
        v-if="!isSubmitting"
        class="flex-1 px-4 py-2.5 rounded-lg border border-stroke bg-card text-sm font-medium text-ink hover:bg-card-hover transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"
        @click="emitChange(false)"
      >
        {{ $t('calendar_page.cancel') }}
      </button>
      <button
        v-if="!isSubmitting"
        class="flex-1 px-4 py-2.5 rounded-lg bg-danger text-sm font-medium text-ink-inverse hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-danger"
        @click="submit()"
      >
        {{ $t('reset_day') }}
      </button>
      <button
        v-if="isSubmitting"
        class="flex-1 px-4 py-2.5 rounded-lg bg-card-hover border border-stroke text-sm text-ink-muted cursor-default"
        disabled
      >
        <span class="inline-flex items-center gap-2">
          <loader-icon width="16" height="16" class="animate-spin" />
          {{ $t('please_wait_sending') }}
        </span>
      </button>
    </div>
  </modal>
</template>

<script>
import { AlertTriangleIcon, LoaderIcon } from 'vue-tabler-icons'
import pLimit from 'p-limit'
import { mapGetters, mapMutations } from 'vuex'
import { prepareForCleanup } from '~/utils/timesheetMapper'

const limit = pLimit(5)

export default {
  components: {
    AlertTriangleIcon,
    LoaderIcon
  },
  props: {
    value: {
      type: Boolean,
      default: true
    },
    dayEntries: {
      type: Array,
      default: () => []
    },
    day: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      isSubmitting: false,
      sentData: 0,
      dataToSend: []
    }
  },
  computed: {
    sentPercentage () {
      const total = this.dataToSend?.length || 0
      return Math.floor((this.sentData * 100 / total) || 0)
    },
    ...mapGetters({
      isExpired: 'user/isTokenExpired'
    })
  },
  methods: {
    emitChange (value) {
      this.$emit('input', value)
    },
    async submit () {
      const employeeId = this.$store.getters['user/info'].employee_id
      this.isSubmitting = true
      this.sentData = 0

      const { data } = await this.$axios.$get('timetrackingboard', {
        params: {
          date: this.day
        }
      })

      // La response di /timetrackingboard è { code, status, data: [...] };
      // can_edit=false sono progetti su cui Wethod rifiuterebbe il POST di
      // azzeramento (whitelist/scope/automatic), quindi vanno esclusi qui.
      const editableProjects = data.filter(entry => entry.can_edit === true)
      this.dataToSend = prepareForCleanup(editableProjects, employeeId)

      // TODO Error handling
      await Promise.all(
        this.dataToSend.map(
          entry => limit(
            async () => {
              await this.$axios.post('timetracking', entry)
              this.sentData++
            }
          )
        )
      )

      this.dayEntries.forEach(({ id }) => this.syncEntry({ id, synced: false }))

      this.emitChange(false)
      this.isSubmitting = false
      this.$nuxt.$emit('tracked-hours:refresh')
    },
    ...mapMutations({
      syncEntry: 'entries/setSyncState'
    })
  }
}
</script>

<style>
</style>
