export const state = () => ({
  requireConfirmationOnSubmit: true,
  selectedBusinessUnitIds: null
})

export const getters = {
  isConfirmOnSubmitRequired (state) {
    return state.requireConfirmationOnSubmit
  },
  selectedBusinessUnitIds (state) {
    return state.selectedBusinessUnitIds
  }
}

export const mutations = {
  setRequireSubmitConfirmation (state, value) {
    state.requireConfirmationOnSubmit = value
  },
  setSelectedBusinessUnitIds (state, ids) {
    state.selectedBusinessUnitIds = ids
  }
}
