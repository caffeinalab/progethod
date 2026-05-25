import { format } from 'date-fns'

export async function updateApiData ($axios, store) {
  store.commit('apiData/updateStarted')

  try {
    // La risposta REALE di /timetrackingboard è { code, status, data: [...] }
    // — l'array di entry è la chiave radice `data`, non `data.projects`.
    // can_edit=false significa che l'utente non può inserire ore su quel
    // progetto (whitelist, scope, automatic timesheet); su tenant grandi è
    // la stragrande maggioranza degli entry e va filtrato qui per tenere
    // la dropdown leggibile.
    const params = { date: format(new Date(), 'yyyy-MM-dd') }

    const selectedBuIds = store.getters['preferences/selectedBusinessUnitIds']
    if (selectedBuIds !== null) {
      params.bu = selectedBuIds.map(String).join(',')
    }

    const { data } = await $axios.$get('timetrackingboard', { params })
    const projects = data
      .filter(entry => entry.can_edit === true)
      .filter(({ project }) => project.archived !== true)
      .map(({ project, areas }) => ({
        id: project.id,
        name: project.name,
        isAutomatic: project.project_type.is_timesheet_automatic,
        areas: areas
          .filter(({ on }) => on)
          .map(({ id, name }) => ({ id, name }))
      }))

    store.commit('apiData/replace', projects)
  } catch (error) {
    console.error(error)
  }

  store.commit('apiData/updateEnded')

  updateOrphanedProjects(store)
}

function updateOrphanedProjects () {

}
