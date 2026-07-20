import { ref, onMounted, onBeforeUnmount } from 'vue'
import { startOfDay } from 'date-fns'

export function useLiveToday() {
  const today = ref(startOfDay(new Date()))
  let midnightTimer: ReturnType<typeof setTimeout> | null = null
  let visibilityHandler: (() => void) | null = null

  function refreshTodayIfChanged() {
    const now = startOfDay(new Date())
    if (now.getTime() !== today.value.getTime()) {
      today.value = now
      scheduleMidnightRefresh()
    }
  }

  function scheduleMidnightRefresh() {
    if (midnightTimer) { clearTimeout(midnightTimer) }
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow.getTime() - now.getTime() + 1000

    midnightTimer = setTimeout(() => {
      today.value = startOfDay(new Date())
      scheduleMidnightRefresh()
    }, msUntilMidnight)
  }

  onMounted(() => {
    scheduleMidnightRefresh()
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        refreshTodayIfChanged()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  })

  onBeforeUnmount(() => {
    if (midnightTimer) { clearTimeout(midnightTimer) }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  })

  return { today }
}
