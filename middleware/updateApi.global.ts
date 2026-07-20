import { isSameDay, parseISO } from 'date-fns'
import { syncLocalProjects } from '~/utils/syncLocalProjects'
import { updateApiData } from '~/utils/updateApiData'

export default defineNuxtRouteMiddleware(() => {
  try {
    const userStore = useUserStore()
    const apiDataStore = useApiDataStore()

    if (!userStore.canMakeRequests) { return }

    const lastUpdate = parseISO(apiDataStore.lastUpdatedAt)

    if (!apiDataStore.isUpdating && !isSameDay(lastUpdate, new Date())) {
      updateApiData()
    }

    syncLocalProjects()
  } catch (error) {
    console.error('updateApi middleware error:', error)
  }
})
