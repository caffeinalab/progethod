import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'

interface Project {
  id: string
  name: string
  deleted: boolean
  deletedAt: string | null
  linkedProjectId?: number
  linkedAreaId?: number
  requiresNotes?: boolean
  defaultNotes?: string
  [key: string]: unknown
}

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    updatedAt: null as string | null,
  }),

  getters: {
    visibleProjects: (state) => state.projects.filter(project => project.deleted !== true),
  },

  actions: {
    add(name: string): Project {
      const project: Project = {
        name,
        id: uuid(),
        deleted: false,
        deletedAt: null,
      }
      this.projects.push(project)
      this.updatedAt = new Date().toISOString()
      return project
    },
    update(project: Partial<Project> & { id: string }) {
      const index = this.projects.findIndex(existing => existing.id === project.id)
      if (index !== -1) {
        Object.assign(this.projects[index], project)
        this.updatedAt = new Date().toISOString()
      }
    },
    remove(id: string) {
      const project = this.projects.find(existing => existing.id === id)
      if (!project) { return }
      this.projects.splice(this.projects.indexOf(project), 1)
      project.deleted = true
      project.deletedAt = new Date().toISOString()
      this.projects.push(project)
      this.updatedAt = new Date().toISOString()
    },
    removeMany(ids: string[]) {
      const now = new Date().toISOString()
      for (const id of ids) {
        const project = this.projects.find(existing => existing.id === id)
        if (!project) { continue }
        this.projects.splice(this.projects.indexOf(project), 1)
        project.deleted = true
        project.deletedAt = now
        this.projects.push(project)
      }
      this.updatedAt = now
    },
    restoreBackup(projects: Project[]) {
      this.projects = projects
      this.updatedAt = new Date().toISOString()
    },
    restoreFromServer(projects: Project[], updatedAt?: string) {
      this.projects = projects
      this.updatedAt = updatedAt || new Date().toISOString()
    },
    markUpToDate() {
      this.updatedAt = new Date().toISOString()
    },
  },
})
