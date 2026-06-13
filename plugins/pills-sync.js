
export default ({ store, $axios }) => {
  store.subscribe((mutation) => {
    if (mutation.type.match(/pills\//) && mutation.type !== 'pills/restoreFromServer') {
      uploadPillChanges(store, $axios)
    }
  })
}

async function uploadPillChanges (store, $axios) {
  const pills = store.getters['pills/pills']
  const updatedAt = store.getters['pills/updatedAt']

  try {
    await $axios.$put('pills', { pills, updatedAt })
  } catch (error) {
    console.error(error)
  }
}
