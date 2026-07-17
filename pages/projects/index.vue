<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-2xl bg-card shadow rounded-lg p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-ink">
            {{ $t('projects') }}
          </h1>
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
          <trash-x-icon size="16" />
          <span class="hidden sm:inline">{{ $t('projects_cleanup') }}</span>
        </button>
      </div>

      <!-- Cleanup feedback -->
      <p v-if="cleanupMessage" class="text-sm text-ink-muted mb-4 transition-opacity">
        {{ cleanupMessage }}
      </p>

      <!-- Add new project -->
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
          <plus-icon size="20" />
        </button>
      </div>

      <!-- Projects list -->
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
              <template v-if="project.linkedArea">
                &middot; {{ project.linkedArea }}
              </template>
            </div>
            <div v-else-if="project.stale" class="text-xs text-warning-text">
              {{ $t('projects_stale_hint') }}
            </div>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              class="p-1.5 text-ink-faint hover:text-accent-fg rounded transition-colors"
              :title="$t('edit')"
              @click="edit(project.id)"
            >
              <edit-icon size="16" />
            </button>
            <button
              class="p-1.5 text-ink-faint hover:text-danger rounded transition-colors"
              :title="$t('delete')"
              @click="removeProject(project.id)"
            >
              <trash-icon size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12 text-ink-faint">
        <briefcase-icon size="48" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">
          {{ $t('projects_empty') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { PlusIcon, EditIcon, TrashIcon, BriefcaseIcon, TrashXIcon } from 'vue-tabler-icons'
import { mapMutations, mapGetters, mapActions } from 'vuex'
import { updateApiData } from '~/utils/updateApiData'

export default {
  components: {
    PlusIcon,
    EditIcon,
    TrashIcon,
    TrashXIcon,
    BriefcaseIcon
  },
  middleware: 'auth',
  data () {
    return {
      newProjectName: '',
      cleanupMessage: ''
    }
  },
  computed: {
    projects () {
      const linkedProjects = this.apiDataProjects

      return this.visibleProjects.map((project) => {
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
          stale: !linkedProject
        }
      }).sort((a, b) => a.name.localeCompare(b.name))
    },
    staleProjects () {
      return this.projects.filter(p => p.stale)
    },
    ...mapGetters({
      visibleProjects: 'projects/visibleProjects',
      apiDataProjects: 'apiData/projects'
    })
  },
  methods: {
    async addProject () {
      const name = this.newProjectName.trim()
      if (!name) { return }
      const project = await this.addProjectAction(name)
      this.newProjectName = ''
      this.$router.push(this.localeLocation({ name: 'projects-id', params: { id: project.id } }))
    },
    edit (id) {
      this.$router.push(this.localeLocation({ name: 'projects-id', params: { id } }))
    },
    async cleanupStale () {
      this.cleanupMessage = this.$t('projects_cleanup_loading')
      await updateApiData(this.$axios, this.$store)

      const stale = this.staleProjects
      if (!stale.length) {
        this.cleanupMessage = this.$t('projects_no_stale')
        setTimeout(() => { this.cleanupMessage = '' }, 3000)
        return
      }
      this.removeManyProjects(stale.map(p => p.id))
      this.cleanupMessage = this.$t('projects_stale_removed', { count: stale.length })
      setTimeout(() => { this.cleanupMessage = '' }, 3000)
    },
    ...mapActions({
      addProjectAction: 'projects/add'
    }),
    ...mapMutations({
      removeProject: 'projects/remove',
      removeManyProjects: 'projects/removeMany'
    })
  }
}
</script>
