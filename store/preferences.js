export const state = () => ({
  requireConfirmationOnSubmit: true,
  selectedBusinessUnitIds: null,
  theme: 'auto',
  highContrast: false
})

export const getters = {
  isConfirmOnSubmitRequired (state) {
    return state.requireConfirmationOnSubmit
  },
  selectedBusinessUnitIds (state) {
    return state.selectedBusinessUnitIds
  },
  theme (state) {
    return state.theme
  },
  highContrast (state) {
    return state.highContrast
  }
}

export const mutations = {
  setRequireSubmitConfirmation (state, value) {
    state.requireConfirmationOnSubmit = value
  },
  setSelectedBusinessUnitIds (state, ids) {
    state.selectedBusinessUnitIds = ids
  },
  setTheme (state, value) {
    state.theme = value
  },
  setHighContrast (state, value) {
    state.highContrast = value
  }
}
