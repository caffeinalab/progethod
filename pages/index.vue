<template>
  <div class="pt-20">
    <!-- Page title starts -->

    <alert v-if="isTokenExpired" :message="$t('session_expired')" level="warning" />
    <div class="my-6 lg:my-12 container px-6 mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-gray-300">
      <div>
        <div class="flex items-center gap-3">
          <button
            class="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
            :title="$t('previous_week')"
            @click="weekOffset--"
          >
            <chevron-left-icon size="24" />
          </button>
          <h4 class="text-2xl font-bold leading-tight text-gray-800">
            {{ weekLabel }}
          </h4>
          <button
            class="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
            :title="$t('next_week')"
            @click="weekOffset++"
          >
            <chevron-right-icon size="24" />
          </button>
          <button
            v-if="weekOffset !== 0"
            class="ml-1 px-3 py-1 text-sm rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
            @click="weekOffset = 0"
          >
            {{ $t('current_week') }}
          </button>
        </div>
      </div>
      <div class="mt-6 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <business-unit-filter v-if="businessUnitsEnabled" />
        <div class="flex justify-between items-center">
          <div class="">
            <label for="toggleConfirmRequired" class="text-sm font-bold text-gray-800 dark:text-gray-100 mr-5">{{ $t('require_confirm_on_submit') }}</label>
          </div>
          <div class="cursor-pointer rounded-full bg-gray-200 relative shadow-sm">
            <input
              id="toggleConfirmRequired"
              :checked="isConfirmOnSubmitRequired"
              type="checkbox"
              class="focus:outline-none checkbox w-6 h-6 rounded-full bg-indigo-700 dark:bg-gray-400 absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto"
              @input="setRequireSubmitConfirmation($event.target.checked)"
            >
            <label for="toggleConfirmRequired" class="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-800 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
    <!-- Page title ends -->
    <div class="container mx-auto px-6">
      <!-- Remove class [ h-64 ] when adding a card block -->
      <!-- Remove class [ border-dashed border-2 border-gray-300 ] to remove dotted border -->
      <div
        v-for="day of days"
        :key="day.toString()"
        class="w-full rounded border-2 mb-5 p-2"
        :class="isToday(day) ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'"
      >
        <day-input-item :day="day" />
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeftIcon, ChevronRightIcon } from 'vue-tabler-icons'
import { isSameDay } from 'date-fns'
import { mapGetters, mapMutations } from 'vuex'
import DayInputItem from '~/components/DayInputItem'
import BusinessUnitFilter from '~/components/BusinessUnitFilter'

export default {
  components: {
    ChevronLeftIcon,
    ChevronRightIcon,
    DayInputItem,
    BusinessUnitFilter
  },
  middleware: 'auth',
  data () {
    return {
      weekOffset: 0
    }
  },
  computed: {
    ...mapGetters({
      isTokenExpired: 'user/isTokenExpired',
      isConfirmOnSubmitRequired: 'preferences/isConfirmOnSubmitRequired',
      businessUnitsEnabled: 'user/businessUnitsEnabled'
    }),
    weekAnchor () {
      const today = new Date()
      return this.$dateFns.addWeeks(today, this.weekOffset)
    },
    days () {
      const monday = this.$dateFns.startOfWeek(this.weekAnchor, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, index) => this.$dateFns.addDays(monday, index))
    },
    weekLabel () {
      const monday = this.days[0]
      const sunday = this.days[6]
      const start = this.$dateFns.format(monday, 'd MMM')
      const end = this.$dateFns.format(sunday, 'd MMM yyyy')
      return `${start} – ${end}`
    }
  },
  methods: {
    isToday (day) {
      return isSameDay(day, new Date())
    },
    ...mapMutations({
      setRequireSubmitConfirmation: 'preferences/setRequireSubmitConfirmation'
    })
  }
}
</script>

<style lang="postcss">

</style>
