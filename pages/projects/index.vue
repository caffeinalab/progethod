<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-2xl bg-card shadow rounded-lg p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-ink">{{ $t('projects') }}</h1>
          <p class="text-sm text-ink-muted mt-1">
            {{ $t('projects_description') }}<br>
            {{ $t('projects_description_2') }}
          </p>
        </div>
        <button
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-danger text-danger hover:bg-danger-soft transition-colors"
          :title="$t('projects_cleanup_tooltip')"
          @click="cleanupStale"
        >
          <IconTrashX :size="16" />
          <span class="hidden sm:inline">{{ $t('projects_cleanup') }}</span>
        </button>
      </div>

      <p v-if="cleanupMessage" class="text-sm text-ink-muted mb-4 transition-opacity">{{ cleanupMessage }}</p>

      <div class="flex gap-2 mb-6">
        <input
          ref="newProjectInput"
          v-model="newProjectName"
          type="text"
          class="flex-1 border border-stroke pl-3 py-2 shadow-sm bg-transparent rounded-lg text-sm focus:outline-none focus:border-accent placeholder-ink-faint text-ink-secondary"
          :placeholder="$t('projects_new_placeholder')"
          @keyup.enter="addProject"
        >
        <button
          class="flex items-center justify-center w-10 h-10 rounded-lg border shadow transition-colors duration-150 focus:outline-none"
          :class="newProjectName.trim()
            ? 'bg-accent border-accent text-ink-inverse hover:bg-accent-hover hover:border-accent-hover focus:ring-2 focus:ring-focus-ring focus:ring-offset-1'
            : 'bg-card-dim border-stroke-muted text-ink-disabled cursor-default'"
          :disabled="!newProjectName.trim()"
          @click="addProject"
        >
          <IconPlus :size="20" />
        </button>
      </div>

      <div v-if="projects.length" class="space-y-2">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-card flex items-center justify-between p-3 rounded-lg border transition-colors"
          :class="project.stale ? 'border-warning opacity-75' : 'border-stroke hover:border-ink-faint'"
        >
          <div class="flex flex-col gap-1 min-w-0">
            <span class="self-start inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-ink-inverse">
              {{ project.name }}
            </span>
            <div v-if="project.linkedProject" class="flex items-center gap-1.5 text-xs text-ink-muted truncate">
              {{ project.linkedProject }}
              <template v-if="project.linkedArea"> &middot; {{ project.linkedArea }}</template>
            </div>
            <div v-else-if="project.stale" class="text-xs text-warning-text">{{ $t('projects_stale_hint') }}</div>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button class="p-1.5 text-ink-faint hover:text-accent-fg rounded transition-colors" :title="$t('edit')" @click="edit(project.id)">
              <IconEdit :size="16" />
            </button>
            <button class="p-1.5 text-ink-faint hover:text-danger rounded transition-colors" :title="$t('delete')" @click="projectsStore.remove(project.id)">
              <IconTrash :size="16" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-ink-faint">
        <IconBriefcase :size="48" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ $t('projects_empty') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconEdit, IconTrash, IconBriefcase, IconTrashX } from '@tabler/icons-vue'
import { updateApiData } from '~/utils/updateApiData'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiDataStore = useApiDataStore()

const newProjectName = ref('')
const newProjectInput = ref<HTMLInputElement | null>(null)
const cleanupMessage = ref('')

const projects = computed(() => {
  const linkedProjects = apiDataStore.projects
  return projectsStore.visibleProjects.map((project) => {
    let linkedProject = null
    let linkedArea = null

    if (project.linkedProjectId) {
      linkedProject = linkedProjects.find(({ id }) => project.linkedProjectId === id)
      if (linkedProject && project.linkedAreaId) {
        linkedArea = linkedProject.areas.find(({ id }) => project.linkedAreaId === id)
      }
    }

    return {
      name: project.name,
      id: project.id,
      linkedProject: linkedProject?.name || '',
      linkedArea: linkedArea?.name || '',
      stale: !linkedProject && !!project.linkedProjectId,
    }
  }).sort((first, second) => first.name.localeCompare(second.name))
})

const staleProjects = computed(() => projects.value.filter(project => project.stale))

async function addProject() {
  const name = newProjectName.value.trim()
  if (!name) { return }
  const project = projectsStore.add(name)
  newProjectName.value = ''
  router.push(`/projects/${project.id}`)
}

function edit(id: string) {
  router.push(`/projects/${id}`)
}

async function cleanupStale() {
  cleanupMessage.value = t('projects_cleanup_loading')
  await updateApiData()

  const stale = staleProjects.value
  if (!stale.length) {
    cleanupMessage.value = t('projects_no_stale')
    setTimeout(() => { cleanupMessage.value = '' }, 3000)
    return
  }
  projectsStore.removeMany(stale.map(project => project.id))
  cleanupMessage.value = t('projects_stale_removed', { count: stale.length })
  setTimeout(() => { cleanupMessage.value = '' }, 3000)
}
</script>
