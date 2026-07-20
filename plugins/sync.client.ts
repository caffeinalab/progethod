import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const projectsStore = useProjectsStore()
  const presetsStore = usePresetsStore()
  const api = useApi()

  watch(
    () => [projectsStore.projects, projectsStore.updatedAt],
    async () => {
      try {
        await api.$put('projects', {
          projects: projectsStore.projects,
          updatedAt: projectsStore.updatedAt,
        })
      } catch (error) {
        console.error('Failed to sync projects:', error)
      }
    },
    { deep: true },
  )

  watch(
    () => [presetsStore.presets, presetsStore.updatedAt],
    async () => {
      try {
        await api.$put('pills', {
          pills: presetsStore.presets,
          updatedAt: presetsStore.updatedAt,
        })
      } catch (error) {
        console.error('Failed to sync presets:', error)
      }
    },
    { deep: true },
  )
})
