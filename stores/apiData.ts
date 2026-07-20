import { defineStore } from 'pinia'

interface ApiProject {
  id: number
  name: string
  isAutomatic?: boolean
  areas: Array<{ id: number; name: string }>
}

export const useApiDataStore = defineStore('apiData', {
  state: () => ({
    projects: [] as ApiProject[],
    isUpdating: false,
    lastUpdatedAt: new Date(0).toISOString(),
  }),

  actions: {
    replace(projects: ApiProject[]) {
      this.projects = projects
      this.lastUpdatedAt = new Date().toISOString()
    },
    reset() {
      this.projects = []
    },
    updateStarted() {
      this.isUpdating = true
    },
    updateEnded() {
      this.isUpdating = false
    },
  },
})
