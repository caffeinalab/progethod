<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-2xl bg-card shadow rounded p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-ink">
            {{ $t('projects') }}
          </h1>
          <p class="text-sm text-ink-muted mt-1">
            {{ $t('projects_description') }}
          </p>
        </div>
      </div>

      <!-- Add new project -->
      <div class="flex gap-2 mb-6">
        <input
          ref="newProjectInput"
          v-model="newProjectName"
          type="text"
          class="flex-1 border border-stroke pl-3 py-2 shadow-sm bg-transparent rounded text-sm focus:outline-none focus:border-accent placeholder-ink-faint text-ink-secondary"
          :placeholder="$t('projects_new_placeholder')"
          @keyup.enter="addProject"
        >
        <button
          class="px-4 py-2 text-ink-inverse bg-accent hover:bg-accent-hover rounded transition duration-150 ease-in-out focus:outline-none disabled:bg-ink-faint disabled:cursor-default"
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
          class="flex items-center justify-between p-3 rounded border border-stroke hover:border-ink-faint transition-colors"
        >
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="self-start inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-soft text-accent-fg">
              {{ project.name }}
            </span>
            <span v-if="project.linkedProject" class="text-xs text-ink-muted pl-3 truncate">
              {{ project.linkedProject }}
              <template v-if="project.linkedArea">
                &middot; {{ project.linkedArea }}
              </template>
            </span>
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
import { PlusIcon, EditIcon, TrashIcon, BriefcaseIcon } from 'vue-tabler-icons'
import { mapMutations, mapGetters, mapActions } from 'vuex'

export default {
  components: {
    PlusIcon,
    EditIcon,
    TrashIcon,
    BriefcaseIcon
  },
  middleware: 'auth',
  data () {
    return {
      newProjectName: ''
    }
  },
  computed: {
    projects () {
      const linkedProjects = this.apiDataProjects

      return this.visibleProjects.map((project) => {
        let linkedProject = { name: '' }
        let linkedArea = linkedProject

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
          linkedArea: linkedArea?.name || ''
        }
      }).sort((a, b) => a.name.localeCompare(b.name))
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
    ...mapActions({
      addProjectAction: 'projects/add'
    }),
    ...mapMutations({
      removeProject: 'projects/remove'
    })
  }
}
</script>
