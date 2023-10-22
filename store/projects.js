import { v4 as uuid } from 'uuid'

export const state = () => ({
  projects: [],
  updatedAt: null
})

export const getters = {
  projects (state) {
    return state.projects
  },
  visibleProjects (state) {
    return state.projects.filter(p => p.deleted !== true)
  },
  updatedAt (state) {
    return state.updatedAt
  }
}

export const actions = {
  add (ctx, name) {
    const project = {
      name,
      id: uuid(),
      deleted: false,
      deletedAt: null
    }
    ctx.commit('add', project)
    return project
  }
}

export const mutations = {
  add (state, project) {
    state.projects.push(project)
    state.updatedAt = new Date().toISOString()
  },
  update (state, project) {
    const updateIndex = state.projects.findIndex(p => p.id === project.id)
    state.projects[updateIndex] = project
    state.updatedAt = new Date().toISOString()
  },
  remove (state, id) {
    const oldProject = state.projects.find(p => p.id === id)
    state.projects.splice(state.projects.findIndex(p => p.id === id), 1)
    oldProject.deleted = true
    oldProject.deletedAt = (new Date()).toISOString()
    state.projects.push(oldProject)
    state.updatedAt = new Date().toISOString()
  },
  restoreBackup (state, projects) {
    state.projects = projects
    state.updatedAt = new Date().toISOString()
  },
  restoreFromServer (state, projects, updatedAt) {
    state.projects = projects
    state.updatedAt = updatedAt
  },
  itsUpToDate (state) {
    state.updatedAt = new Date().toISOString()
  }
}
