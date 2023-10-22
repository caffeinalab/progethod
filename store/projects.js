import { v4 as uuid } from 'uuid'

export const state = () => ({
  projects: []
})

export const getters = {
  projects (state) {
    return state.projects
  },
  visibleProjects (state) {
    return state.projects.filter(p => p.deleted !== true)
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
  },
  update (state, project) {
    const updateIndex = state.projects.findIndex(p => p.id === project.id)
    state.projects[updateIndex] = project
  },
  remove (state, id) {
    const oldProject = state.projects.find(p => p.id === id)
    state.projects.splice(state.projects.findIndex(p => p.id === id), 1)
    oldProject.deleted = true
    oldProject.deletedAt = (new Date()).toISOString()
    state.projects.push(oldProject)
  },
  restoreBackup (state, projects) {
    state.projects = projects
  }
}
