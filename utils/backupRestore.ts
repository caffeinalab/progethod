import {
  hydrateFromPersistedData,
  withoutPersistence,
  type PersistedState,
} from '~/utils/persistedState'

export function getBackupData(): Record<string, unknown> {
  const raw = window.localStorage.getItem('progethod')
  return raw ? JSON.parse(raw) : {}
}

export function getBackupFile(data: Record<string, unknown>): File {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const filename = `progethod-backup-${new Date().toISOString().slice(0, 10)}.json`
  return new File([blob], filename, { type: 'application/json' })
}

export function triggerFileDownload(file: File) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function askForBackupFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    let settled = false
    const settle = (file: File | null) => {
      if (settled) { return }
      settled = true
      resolve(file)
    }

    input.addEventListener('change', () => {
      settle(input.files?.[0] || null)
    })
    input.addEventListener('cancel', () => {
      settle(null)
    })
    input.click()
  })
}

export async function restoreBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as PersistedState
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid backup file')
  }

  // Keep the exact backup on disk, then replace store state without a full SPA reload.
  // Persistence saves are suppressed during hydrate so we don't briefly wipe storage.
  // Collections are assigned once (not cleared then refilled) so sync won't push an empty list.
  window.localStorage.setItem('progethod', text)
  withoutPersistence(() => {
    useUserStore().$reset()
    useEntriesStore().$reset()
    useApiDataStore().$reset()
    usePreferencesStore().$reset()
    hydrateFromPersistedData(data, { replaceCollections: true })
  })
}
