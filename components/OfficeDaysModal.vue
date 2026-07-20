<template>
  <modal :value="value" @input="$emit('input', $event)">
    <div class="w-full">
      <h2 class="text-lg font-bold text-ink text-center mb-1">
        {{ $t('office_days_modal_title') }}
      </h2>
      <p class="text-sm text-ink-secondary text-center mb-6 capitalize">
        {{ monthLabel }}
      </p>

      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center py-8">
        <span class="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm text-ink-muted mt-3">{{ $t('office_days_modal_loading') }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-6">
        <p class="text-sm text-danger">{{ $t('office_days_modal_error') }}</p>
        <button class="mt-3 text-sm text-accent-fg hover:text-accent-hover font-medium" @click="fetchData">
          {{ $t('office_days_modal_retry') }}
        </button>
      </div>

      <!-- Results -->
      <div v-else-if="result !== null" class="space-y-5">
        <!-- Progress bar -->
        <div>
          <div class="flex justify-between text-xs text-ink-secondary mb-1.5">
            <span>{{ result.count }} / {{ target }}</span>
            <span :class="result.onTrack ? 'text-success-text' : 'text-warning-text'">
              {{ result.onTrack ? $t('office_days_on_track') : $t('office_days_behind') }}
            </span>
          </div>
          <div class="w-full h-3 rounded-full bg-card-hover border border-stroke-muted overflow-hidden relative">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="result.onTrack ? 'bg-success' : 'bg-warning'"
              :style="{ width: Math.min(100, (result.count / target) * 100) + '%' }"
            />
            <!-- Pace marker -->
            <div
              class="absolute top-0 bottom-0 w-0.5 bg-ink-muted opacity-60"
              :style="{ left: (result.expectedPace / target) * 100 + '%' }"
              :title="$t('office_days_pace_marker', { expected: result.expectedPace })"
            />
          </div>
          <p class="text-xs text-ink-muted mt-1">
            {{ $t('office_days_pace_explanation', { expected: result.expectedPace }) }}
          </p>
        </div>

        <!-- This week hint -->
        <div
          class="rounded-lg px-4 py-3 text-sm font-medium border"
          :class="thisWeekClasses"
        >
          {{ thisWeekMessage }}
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
import { startOfDay, startOfWeek, addDays } from 'date-fns'

const TARGET = 8

export default {
  props: {
    value: { type: Boolean, default: false },
    monthTrackedHours: { type: Array, default: () => [] },
    monthFrom: { type: String, required: true },
    monthTo: { type: String, required: true },
    monthWorkingDays: { type: Number, required: true },
    monthLabel: { type: String, required: true }
  },
  data () {
    return {
      loading: false,
      error: false,
      result: null,
      target: TARGET
    }
  },
  computed: {
    thisWeekClasses () {
      if (!this.result) { return '' }
      if (this.result.remaining <= 0) {
        return 'bg-success-soft border-success text-success-text'
      }
      if (this.result.needsThisWeek) {
        return 'bg-warning-soft border-warning text-warning-text'
      }
      return 'bg-success-soft border-success text-success-text'
    },
    thisWeekMessage () {
      if (!this.result) { return '' }
      if (this.result.remaining <= 0) {
        return this.$t('office_days_target_done')
      }
      if (this.result.needsThisWeek) {
        return this.$t('office_days_go_this_week', { count: this.result.remainingThisWeekNeeded })
      }
      return this.$t('office_days_no_rush')
    }
  },
  watch: {
    value (open) {
      if (open) {
        this.result = null
        this.error = false
        this.fetchData()
      }
    }
  },
  methods: {
    async fetchData () {
      const fullDays = this.monthTrackedHours
        .filter(entry => entry.value >= 8)
        .map(entry => entry.date)

      if (fullDays.length === 0) {
        this.result = this.buildResult([])
        return
      }

      this.loading = true
      this.error = false

      try {
        const response = await this.$axios.$get('office-days', {
          params: { dates: fullDays.join(',') }
        })
        if (Array.isArray(response?.data)) {
          this.result = this.buildResult(response.data)
        }
      } catch {
        this.error = true
      } finally {
        this.loading = false
      }
    },
    buildResult (officeDays) {
      const count = officeDays.length
      const remaining = Math.max(0, TARGET - count)

      const today = startOfDay(new Date())
      const todayStr = this.$dateFns.format(today, 'yyyy-MM-dd')

      let elapsedWorkingDays = 0
      let current = new Date(this.monthFrom + 'T00:00:00')
      const todayDate = new Date(todayStr + 'T00:00:00')
      const monthEnd = new Date(this.monthTo + 'T00:00:00')
      const effectiveEnd = todayDate <= monthEnd ? todayDate : monthEnd

      while (current <= effectiveEnd) {
        const dow = current.getDay()
        if (dow !== 0 && dow !== 6) {
          elapsedWorkingDays++
        }
        current = addDays(current, 1)
      }

      const expectedPace = Math.round(TARGET * elapsedWorkingDays / this.monthWorkingDays)

      const friday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 4)
      let remainingThisWeek = 0
      let cursor = addDays(today, 1)
      while (cursor <= friday) {
        const dow = cursor.getDay()
        if (dow !== 0 && dow !== 6) {
          remainingThisWeek++
        }
        cursor = addDays(cursor, 1)
      }

      const onTrack = count + remainingThisWeek >= expectedPace

      const weeksLeftInMonth = Math.max(1, Math.ceil(
        (this.monthWorkingDays - elapsedWorkingDays) / 5
      ))
      const idealPerWeek = Math.ceil(remaining / weeksLeftInMonth)
      const needsThisWeek = remaining > 0 && idealPerWeek > 0
      const remainingThisWeekNeeded = Math.min(idealPerWeek, remainingThisWeek + 1)

      return {
        count,
        remaining,
        expectedPace,
        onTrack,
        needsThisWeek,
        remainingThisWeekNeeded
      }
    }
  }
}
</script>
