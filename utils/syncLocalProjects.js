import { differenceInMinutes } from 'date-fns'

export async function syncLocalProjects ($axios, store) {
  const localUpdatedAt = store.getters['projects/updatedAt']
  const localProjects = store.getters['projects/projects']

  if (localUpdatedAt && Math.abs(differenceInMinutes(new Date(localUpdatedAt), new Date())) < 5) {
    return
  }

  try {
    const { projects, updatedAt } = await $axios.$get('projects')

    // we have local projects but the server is empty. Don't override!!!
    if (localProjects.length > 0 && projects.length === 0) {
      store.commit('projects/itsUpToDate')
      return
    }

    // we don't have any local data OR local data is older than server data
    if (!localUpdatedAt || (updatedAt && localUpdatedAt < updatedAt)) {
      store.commit('projects/restoreFromServer', projects, updatedAt)
    }
  } catch (error) {
    console.error(error)
  }
}
