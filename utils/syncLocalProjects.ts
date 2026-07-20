import { differenceInMinutes } from 'date-fns'

export async function syncLocalProjects() {
  const projectsStore = useProjectsStore()
  const api = useApi()

  const localUpdatedAt = projectsStore.updatedAt
  const localProjects = projectsStore.projects

  if (localUpdatedAt && Math.abs(differenceInMinutes(new Date(localUpdatedAt), new Date())) < 5) {
    return
  }

  try {
    const { projects, updatedAt } = await api.$get<{ projects: Array<unknown>; updatedAt: string }>('projects')

    if (localProjects.length > 0 && projects.length === 0) {
      projectsStore.markUpToDate()
      return
    }

    if (!localUpdatedAt || (updatedAt && localUpdatedAt < updatedAt)) {
      projectsStore.restoreFromServer(projects as any, updatedAt)
    }
  } catch (error) {
    console.error(error)
  }
}
