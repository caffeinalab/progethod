
export default ({ store, $axios }) => {
  store.subscribe((mutation) => {
    if (mutation.type.match(/projects\//) && mutation.type !== 'projects/restoreFromServer') {
      uploadProjectChanges(store, $axios)
    }
  })
}

async function uploadProjectChanges (store, $axios) {
  const projects = store.getters['projects/projects']
  const updatedAt = store.getters['projects/updatedAt']

  try {
    await $axios.$put('projects', { projects, updatedAt })
  } catch (error) {
    console.error(error)
  }
}
