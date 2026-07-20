import { watch } from 'vue'
import { differenceInDays, parse } from 'date-fns'

function migratePillsToPresets() {
  try {
    const raw = window.localStorage.getItem('progethod')
    if (!raw) { return }
    const data = JSON.parse(raw)
    if (data.pills && !data.presets) {
      data.presets = data.pills
      delete data.pills
      window.localStorage.setItem('progethod', JSON.stringify(data))
    }
  } catch { /* empty */ }
}

function migrateFromVuex() {
  try {
    const raw = window.localStorage.getItem('vuex')
    if (!raw) { return }
    const data = JSON.parse(raw)
    if (data.user || data.projects || data.entries) {
      window.localStorage.setItem('progethod', JSON.stringify(data))
      window.localStorage.removeItem('vuex')
    }
  } catch { /* empty */ }
}

export default defineNuxtPlugin(() => {
  migrateFromVuex()
  migratePillsToPresets()

  const userStore = useUserStore()
  const projectsStore = useProjectsStore()
  const presetsStore = usePresetsStore()
  const entriesStore = useEntriesStore()
  const apiDataStore = useApiDataStore()
  const preferencesStore = usePreferencesStore()

  const STORAGE_KEY = 'progethod'

  function loadFromStorage() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) { return }
      const data = JSON.parse(raw)

      if (data.user) {
        if (data.user.authToken) { userStore.setToken(data.user.authToken) }
        if (data.user.isTokenExpired) { userStore.isTokenExpired = true }
        if (data.user.info) { userStore.updateInfo(data.user.info) }
        if (data.user.hasAuthorizedGCal) { userStore.hasAuthorizedGCal = true }
        if (data.user.jira) { userStore.jira = data.user.jira }
        if (data.user.gitlab) { userStore.gitlab = data.user.gitlab }
      }

      if (data.projects) {
        projectsStore.projects = data.projects.projects || []
        projectsStore.updatedAt = data.projects.updatedAt || null
      }

      if (data.presets) {
        presetsStore.presets = data.presets.presets || []
        presetsStore.updatedAt = data.presets.updatedAt || null
      }

      if (data.entries) {
        entriesStore.entries = data.entries.entries || []
      }

      if (data.apiData) {
        apiDataStore.projects = data.apiData.projects || []
        apiDataStore.lastUpdatedAt = data.apiData.lastUpdatedAt || new Date(0).toISOString()
      }

      if (data.preferences) {
        if (data.preferences.requireConfirmationOnSubmit !== undefined) {
          preferencesStore.requireConfirmationOnSubmit = data.preferences.requireConfirmationOnSubmit
        }
        if (data.preferences.selectedBusinessUnitIds !== undefined) {
          preferencesStore.selectedBusinessUnitIds = data.preferences.selectedBusinessUnitIds
        }
        if (data.preferences.theme) { preferencesStore.theme = data.preferences.theme }
        if (data.preferences.highContrast !== undefined) {
          preferencesStore.highContrast = data.preferences.highContrast
        }
      }
    } catch { /* empty */ }
  }

  function saveToStorage() {
    const today = new Date()

    const data = {
      user: {
        authToken: userStore.authToken,
        isTokenExpired: userStore.isTokenExpired,
        info: userStore.info,
        hasAuthorizedGCal: userStore.hasAuthorizedGCal,
        jira: userStore.jira,
        gitlab: userStore.gitlab,
      },
      projects: {
        updatedAt: projectsStore.updatedAt,
        projects: projectsStore.projects
          .filter(project => !project.deleted || differenceInDays(today, new Date(project.deletedAt!)) < 40),
      },
      presets: {
        updatedAt: presetsStore.updatedAt,
        presets: presetsStore.presets
          .filter(preset => !preset.deleted || differenceInDays(today, new Date(preset.deletedAt!)) < 40),
      },
      entries: {
        entries: entriesStore.entries
          .filter(entry => differenceInDays(today, parse(entry.day, 'yyyy-MM-dd', new Date())) < 30),
      },
      apiData: {
        projects: apiDataStore.projects,
        lastUpdatedAt: apiDataStore.lastUpdatedAt,
      },
      preferences: {
        requireConfirmationOnSubmit: preferencesStore.requireConfirmationOnSubmit,
        selectedBusinessUnitIds: preferencesStore.selectedBusinessUnitIds,
        theme: preferencesStore.theme,
        highContrast: preferencesStore.highContrast,
      },
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  loadFromStorage()

  watch(
    () => [
      userStore.$state,
      projectsStore.$state,
      presetsStore.$state,
      entriesStore.$state,
      apiDataStore.$state,
      preferencesStore.$state,
    ],
    saveToStorage,
    { deep: true },
  )
})
