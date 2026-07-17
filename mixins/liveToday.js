import { startOfDay } from 'date-fns'

/**
 * Provides a reactive `today` property that auto-updates at midnight
 * and on wake-from-standby (via visibilitychange), so any computed/render
 * logic depending on "today" stays current without a page refresh.
 */
export default {
  data () {
    return {
      today: startOfDay(new Date())
    }
  },
  mounted () {
    this._scheduleMidnightRefresh()
    this._onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this._refreshTodayIfChanged()
      }
    }
    document.addEventListener('visibilitychange', this._onVisibilityChange)
  },
  beforeDestroy () {
    clearTimeout(this._midnightTimer)
    document.removeEventListener('visibilitychange', this._onVisibilityChange)
  },
  methods: {
    _refreshTodayIfChanged () {
      const now = startOfDay(new Date())
      if (now.getTime() !== this.today.getTime()) {
        this.today = now
        clearTimeout(this._midnightTimer)
        this._scheduleMidnightRefresh()
      }
    },
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
