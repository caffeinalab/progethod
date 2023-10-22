import { isSameDay, parseISO } from 'date-fns'
import { syncLocalProjects } from '~/utils/syncLocalProjects'
import { updateApiData } from '~/utils/updateApiData'

export default function ({ $axios, store }) {
  if (!store.getters['user/canMakeRequests']) {
    return
  }

  const lastUpdate = parseISO(store.getters['apiData/lastUpdatedAt'])

  if (
    !store.getters['apiData/isUpdating'] &&
    !isSameDay(lastUpdate, new Date())) {
    updateApiData($axios, store)
  }

  syncLocalProjects($axios, store)
}
