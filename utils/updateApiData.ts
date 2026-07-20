import { format } from 'date-fns'

export async function updateApiData() {
  const apiDataStore = useApiDataStore()
  const preferencesStore = usePreferencesStore()
  const api = useApi()

  apiDataStore.updateStarted()

  try {
    const params: Record<string, string> = { date: format(new Date(), 'yyyy-MM-dd') }

    const selectedBuIds = preferencesStore.selectedBusinessUnitIds
    if (selectedBuIds !== null) {
      params.bu = selectedBuIds.map(String).join(',')
    }

    const { data } = await api.$get<{ data: Array<{
      can_edit: boolean
      project: { id: number; name: string; archived: boolean; project_type: { is_timesheet_automatic: boolean } }
      areas: Array<{ id: number; name: string; on: boolean }>
    }> }>('timetrackingboard', { params })

    const projects = data
      .filter(entry => entry.can_edit === true)
      .filter(({ project }) => project.archived !== true)
      .map(({ project, areas }) => ({
        id: project.id,
        name: project.name,
        isAutomatic: project.project_type.is_timesheet_automatic,
        areas: areas
          .filter(({ on }) => on)
          .map(({ id, name }) => ({ id, name })),
      }))

    apiDataStore.replace(projects)
  } catch (error) {
    console.error(error)
  }

  apiDataStore.updateEnded()
}
