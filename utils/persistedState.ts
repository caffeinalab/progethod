export type PersistedState = {
  user?: {
    authToken?: string | null
    isTokenExpired?: boolean
    info?: Record<string, unknown>
    hasAuthorizedGCal?: boolean
    jira?: Record<string, unknown>
    gitlab?: Record<string, unknown>
  }
  projects?: {
    projects?: unknown[]
    updatedAt?: string | null
  }
  presets?: {
    presets?: unknown[]
    updatedAt?: string | null
  }
  entries?: {
    entries?: unknown[]
  }
  apiData?: {
    projects?: unknown[]
    lastUpdatedAt?: string
  }
  preferences?: {
    requireConfirmationOnSubmit?: boolean
    selectedBusinessUnitIds?: number[] | null
    theme?: 'auto' | 'light' | 'dark'
    highContrast?: boolean
    weekLayout?: string
  }
}

let persistSuppressed = false

/** True while stores are being bulk-replaced (restore); persistence plugin should skip saves. */
export function isPersistSuppressed() {
  return persistSuppressed
}

export function withoutPersistence(callback: () => void) {
  persistSuppressed = true
  try {
    callback()
  } finally {
    persistSuppressed = false
  }
}

/**
 * Apply a persisted `progethod` blob onto Pinia stores.
 * Collection slices are always replaced (missing → empty) so restore cannot leave stale rows.
 * User/preferences only overwrite fields present in the blob (callers should $reset those first).
 */
export function hydrateFromPersistedData(data: PersistedState, options: { replaceCollections?: boolean } = {}) {
  const replaceCollections = options.replaceCollections ?? false

  const userStore = useUserStore()
  const projectsStore = useProjectsStore()
  const presetsStore = usePresetsStore()
  const entriesStore = useEntriesStore()
  const apiDataStore = useApiDataStore()
  const preferencesStore = usePreferencesStore()

  if (data.user) {
    if (data.user.authToken) { userStore.setToken(data.user.authToken) }
    if (data.user.isTokenExpired) { userStore.isTokenExpired = true }
    if (data.user.info) { userStore.updateInfo(data.user.info as any) }
    if (data.user.hasAuthorizedGCal) { userStore.hasAuthorizedGCal = true }
    if (data.user.jira) { userStore.jira = data.user.jira as any }
    if (data.user.gitlab) { userStore.gitlab = data.user.gitlab as any }
  }

  if (replaceCollections || data.projects) {
    projectsStore.projects = (data.projects?.projects || []) as any
    projectsStore.updatedAt = data.projects?.updatedAt || null
  }

  if (replaceCollections || data.presets) {
    presetsStore.presets = (data.presets?.presets || []) as any
    presetsStore.updatedAt = data.presets?.updatedAt || null
  }

  if (replaceCollections || data.entries) {
    entriesStore.entries = (data.entries?.entries || []) as any
  }

  if (replaceCollections || data.apiData) {
    apiDataStore.projects = (data.apiData?.projects || []) as any
    apiDataStore.lastUpdatedAt = data.apiData?.lastUpdatedAt || new Date(0).toISOString()
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
    if (data.preferences.weekLayout) {
      preferencesStore.setWeekLayout(data.preferences.weekLayout as any)
    }
  }
}
