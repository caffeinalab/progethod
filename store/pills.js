import { v4 as uuid } from 'uuid'

export const state = () => ({
  pills: [],
  updatedAt: null
})

export const getters = {
  pills (state) {
    return state.pills
  },
  visiblePills (state) {
    return state.pills.filter(pill => pill.deleted !== true)
  },
  updatedAt (state) {
    return state.updatedAt
  }
}

export const actions = {
  add (ctx, label) {
    const pill = {
      label,
      id: uuid(),
      deleted: false,
      deletedAt: null
    }
    ctx.commit('add', pill)
    return pill
  }
}

export const mutations = {
  add (state, pill) {
    state.pills.push(pill)
    state.updatedAt = new Date().toISOString()
  },
  update (state, pill) {
    const index = state.pills.findIndex(existing => existing.id === pill.id)
    Object.assign(state.pills[index], pill)
    state.updatedAt = new Date().toISOString()
  },
  reorder (state, orderedIds) {
    const pillMap = new Map(state.pills.map(pill => [pill.id, pill]))
    const reordered = orderedIds
      .map(id => pillMap.get(id))
      .filter(Boolean)
    const remaining = state.pills.filter(pill => !orderedIds.includes(pill.id))
    state.pills = [...reordered, ...remaining]
    state.updatedAt = new Date().toISOString()
  },
  remove (state, id) {
    const pill = state.pills.find(existing => existing.id === id)
    state.pills.splice(state.pills.findIndex(existing => existing.id === id), 1)
    pill.deleted = true
    pill.deletedAt = new Date().toISOString()
    state.pills.push(pill)
    state.updatedAt = new Date().toISOString()
  },
  restoreBackup (state, pills) {
    state.pills = pills
    state.updatedAt = new Date().toISOString()
  },
  restoreFromServer (state, pills, updatedAt) {
    state.pills = pills
    state.updatedAt = updatedAt
  }
}
