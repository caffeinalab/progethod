import { defineStore } from 'pinia'
import { useSoftDeletableCollection, type SoftDeletableItem } from './softDeletableStore'

export interface Project extends SoftDeletableItem {
  name: string
  linkedProjectId?: number
  linkedAreaId?: number
  requiresNotes?: boolean
  defaultNotes?: string
  [key: string]: unknown
}

export const useProjectsStore = defineStore('projects', () => {
  const {
    items: projects,
    updatedAt,
    visibleItems: visibleProjects,
    add: addItem,
    update,
    remove,
    restoreBackup,
    restoreFromServer,
  } = useSoftDeletableCollection<Project>()

  function add(name: string): Project {
    return addItem({ name } as Omit<Project, 'id' | 'deleted' | 'deletedAt'>)
  }

  function removeMany(ids: string[]) {
    const now = new Date().toISOString()
    for (const id of ids) {
      const project = projects.value.find(existing => existing.id === id)
      if (!project) { continue }
      projects.value.splice(projects.value.indexOf(project), 1)
      project.deleted = true
      project.deletedAt = now
      projects.value.push(project)
    }
    updatedAt.value = now
  }

  function markUpToDate() {
    updatedAt.value = new Date().toISOString()
  }

  return {
    projects,
    updatedAt,
    visibleProjects,
    add,
    update,
    remove,
    removeMany,
    markUpToDate,
    restoreBackup,
    restoreFromServer,
  }
})
