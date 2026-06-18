import { startOfDay } from 'date-fns'

/**
 * Provides a reactive `today` property that auto-updates at midnight,
 * so any computed/render logic depending on "today" stays current
 * without a page refresh.
 */
export default {
  data () {
    return {
      today: startOfDay(new Date())
    }
  },
  mounted () {
    this._scheduleMidnightRefresh()
  },
  beforeDestroy () {
    clearTimeout(this._midnightTimer)
  },
  methods: {
    _scheduleMidnightRefresh () {
      const now = new Date()
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const msUntilMidnight = tomorrow.getTime() - now.getTime() + 1000

      this._midnightTimer = setTimeout(() => {
        this.today = startOfDay(new Date())
        this._scheduleMidnightRefresh()
      }, msUntilMidnight)
    }
  }
}
