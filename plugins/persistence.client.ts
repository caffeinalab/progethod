import { watch } from 'vue'
import { differenceInDays, parse } from 'date-fns'
import { hydrateFromPersistedData, isPersistSuppressed } from '~/utils/persistedState'

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
      hydrateFromPersistedData(JSON.parse(raw))
    } catch { /* empty */ }
  }

  function saveToStorage() {
    if (isPersistSuppressed()) { return }

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
        weekLayout: preferencesStore.weekLayout,
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
