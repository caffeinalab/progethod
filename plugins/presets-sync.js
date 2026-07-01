
export default ({ store, $axios }) => {
  store.subscribe((mutation) => {
    if (mutation.type.match(/presets\//) && mutation.type !== 'presets/restoreFromServer') {
      uploadPresetChanges(store, $axios)
    }
  })
}

async function uploadPresetChanges (store, $axios) {
  const presets = store.getters['presets/presets']
  const updatedAt = store.getters['presets/updatedAt']

  try {
    await $axios.$put('pills', { pills: presets, updatedAt })
  } catch (error) {
    console.error(error)
  }
}
