import { differenceInMinutes } from 'date-fns'

export async function syncLocalProjects ($axios, store) {
  const localUpdatedAt = store.getters['projects/updatedAt']

  if (localUpdatedAt && Math.abs(differenceInMinutes(new Date(localUpdatedAt), new Date())) < 5) {
    return
  }

  try {
    const { projects, updatedAt } = await $axios.$get('projects')

    if (!localUpdatedAt || (updatedAt && localUpdatedAt < updatedAt)) {
      store.commit('projects/restoreFromServer', projects, updatedAt)
    }
  } catch (error) {
    console.error(error)
  }
}
