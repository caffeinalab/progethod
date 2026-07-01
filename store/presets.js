import { v4 as uuid } from 'uuid'

export const state = () => ({
  presets: [],
  updatedAt: null
})

export const getters = {
  presets (state) {
    return state.presets
  },
  visiblePresets (state) {
    return state.presets.filter(preset => preset.deleted !== true)
  },
  updatedAt (state) {
    return state.updatedAt
  }
}

export const actions = {
  add (ctx, label) {
    const preset = {
      label,
      id: uuid(),
      deleted: false,
      deletedAt: null
    }
    ctx.commit('add', preset)
    return preset
  }
}

export const mutations = {
  add (state, preset) {
    state.presets.push(preset)
    state.updatedAt = new Date().toISOString()
  },
  update (state, preset) {
    const index = state.presets.findIndex(existing => existing.id === preset.id)
    Object.assign(state.presets[index], preset)
    state.updatedAt = new Date().toISOString()
  },
  reorder (state, orderedIds) {
    const presetMap = new Map(state.presets.map(preset => [preset.id, preset]))
    const reordered = orderedIds
      .map(id => presetMap.get(id))
      .filter(Boolean)
    const remaining = state.presets.filter(preset => !orderedIds.includes(preset.id))
    state.presets = [...reordered, ...remaining]
    state.updatedAt = new Date().toISOString()
  },
  remove (state, id) {
    const preset = state.presets.find(existing => existing.id === id)
    state.presets.splice(state.presets.findIndex(existing => existing.id === id), 1)
    preset.deleted = true
    preset.deletedAt = new Date().toISOString()
    state.presets.push(preset)
    state.updatedAt = new Date().toISOString()
  },
  restoreBackup (state, presets) {
    state.presets = presets
    state.updatedAt = new Date().toISOString()
  },
  restoreFromServer (state, presets, updatedAt) {
    state.presets = presets
    state.updatedAt = updatedAt
  }
}
