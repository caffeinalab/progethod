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
    input.onchange = () => {
      resolve(input.files?.[0] || null)
    }
    input.click()
  })
}

export async function restoreBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text)
  window.localStorage.setItem('progethod', JSON.stringify(data))
  window.location.reload()
}
