<template>
  <div class="mx-auto container py-10 pt-24">
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-col lg:flex-row w-full items-start lg:items-center rounded-lg bg-card shadow">
        <div class="w-full lg:w-2/3 h-64">
          <div class="container mx-auto bg-card mt-10 rounded-lg px-4">
            <div class="xl:w-full border-b border-stroke py-5">
              <div class="flex w-11/12 mx-auto xl:w-full xl:mx-0 items-center">
                <p class="text-lg text-ink font-bold">
                  {{ $t('project_information') }}
                </p>
                <div class="ml-2 cursor-pointer text-ink-secondary">
                  <info-circle-icon width="16" height="16" />
                </div>
              </div>
            </div>
            <div class="mx-auto pt-4">
              <div class="container mx-auto">
                <form class="my-6 w-11/12 mx-auto xl:w-full xl:mx-0">
                  <div class="xl:w-1/4 lg:w-1/2 md:w-1/2 flex flex-col mb-6">
                    <label for="name" class="pb-2 text-sm font-bold text-ink">{{ $t('project_name') }}</label>
                    <input
                      id="name"
                      v-model="name"
                      type="text"
                      name="name"
                      required
                      class="border border-stroke pl-3 py-3 shadow-sm bg-transparent rounded-lg text-sm focus:outline-none focus:border-accent placeholder-ink-faint text-ink"
                      placeholder=""
                    >
                  </div>
                  <div class="flex flex-col mb-6">
                    <label for="name" class="pb-2 text-sm font-bold text-ink">{{ $t('linked_project') }}</label>
                    <v-select v-model="linkedProject" label="name" :options="projects" @input="selectedProjectChanged" />
                  </div>
                  <div
                    v-if="linkedProject"
                    class="flex flex-col mb-6"
                  >
                    <label for="name" class="pb-2 text-sm font-bold text-ink">{{ $t('linked_area') }}</label>
                    <v-select v-model="linkedArea" label="name" :options="linkedProject.areas" />
                  </div>
                  <div class="flex justify-between items-center mb-8">
                    <div class="w-9/12">
                      <label for="name" class="pb-2 text-sm font-bold text-ink">{{ $t('require_notes') }}</label>
                      <p class="text-sm text-ink-muted">
                        {{ $t('require_notes_description') }}
                      </p>
                    </div>
                    <div class="cursor-pointer rounded-full bg-card-hover relative shadow-sm">
                      <input id="toggle" v-model="requiresNotes" type="checkbox" class="focus:outline-none checkbox w-6 h-6 rounded-full bg-accent absolute shadow-sm appearance-none cursor-pointer border border-transparent top-0 bottom-0 m-auto">
                      <label for="toggle" class="toggle-label block w-12 h-4 overflow-hidden rounded-full bg-stroke cursor-pointer" />
                    </div>
                  </div>
                  <div class="xl:w-1/4 lg:w-1/2 md:w-1/2 flex flex-col mb-6">
                    <label for="defaultNotes" class="pb-2 text-sm font-bold text-ink">{{ $t('default_notes') }}</label>
                    <input
                      id="defaultNotes"
                      v-model="defaultNotes"
                      type="text"
                      name="defaultNotes"
                      class="border border-stroke pl-3 py-3 shadow-sm bg-transparent rounded-lg text-sm focus:outline-none focus:border-accent placeholder-ink-faint text-ink"
                      placeholder=""
                    >
                  </div>
                  <div class="flex flex-col mb-6">
                    <label for="defaultNotes" class="pb-2 text-sm font-bold text-ink">{{ $t('magic_tag') }}</label>
                    <p class="text-sm text-ink-muted mb-2">
                      {{ $t('what_is_a_magic_tag') }}
                    </p>
                    <div class="flex flex-row justify-items-center">
                      <input
                        id="defaultNotes"
                        :value="magicTag"
                        type="text"
                        name="defaultNotes"
                        class="border border-stroke pl-3 py-3 shadow-sm bg-transparent rounded-lg text-sm focus:outline-none focus:border-accent placeholder-ink-faint text-ink"
                        placeholder=""
                        readonly
                      >
                      <button
                        class="ml-2 mr-1 p-2 text-ink-inverse focus:outline-none border border-transparent focus:border-ink focus:shadow-outline-gray bg-accent hover:bg-accent-hover rounded-lg transition duration-150 ease-in-out disabled:cursor-default disabled:bg-ink-muted"
                        :disabled="disableCopy"
                        :title="$t('copy')"
                        type="button"
                        @click="copyMagicTag"
                      >
                        <clipboard-icon width="20" height="20" />
                      </button>
                      <div class="text-sm font-bold text-ink-secondary ml-4">
                        {{ $t('magic_tag_for_everybody') }}
                      </div>
                    </div>
                  </div>
                  <div class="xl:w-1/4 lg:w-1/2 md:w-1/2 flex flex-col mb-6" />
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full lg:w-1/3 h-24 lg:h-64 border-t lg:border-t-0 lg:border-r lg:border-l lg:rounded-r bg-card-dim">
          <button class="m-5 transition duration-150 ease-in-out hover:bg-accent-hover focus:outline-none border bg-accent rounded-lg text-ink-inverse px-8 py-2 text-sm" @click="save">
            {{ $t('save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  InfoCircleIcon,
  ClipboardIcon
} from 'vue-tabler-icons'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { mapGetters, mapMutations } from 'vuex'

export default {
  components: {
    ClipboardIcon,
    InfoCircleIcon,
    vSelect
  },
  middleware: 'auth',
  asyncData ({ store, params: { id }, error }) {
    const cp = store.getters['projects/projects'].find(p => p.id === id)

    if (!cp) {
      error({ statusCode: 404, message: 'Project not found' })
    }

    let linkedProject, linkedArea
    if (cp.linkedProjectId) {
      linkedProject = store.getters['apiData/projects'].find(p => p.id === cp.linkedProjectId)
    }

    if (linkedProject && cp.linkedAreaId) {
      linkedArea = linkedProject.areas.find(a => a.id === cp.linkedAreaId)
    }

    return {
      id,
      name: cp.name,
      defaultNotes: cp.defaultNotes,
      requiresNotes: cp.requiresNotes,
      linkedProject,
      linkedArea
    }
  },
  computed: {
    disableCopy () {
      return !this.linkedProject
    },
    magicTag () {
      return !this.linkedProject
        ? this.$t('select_project')
        : `[progethod:${this.linkedProject.id}:${this.linkedArea ? this.linkedArea.id : 'generic'}]`
    },
    ...mapGetters({
      projects: 'apiData/projects'
    })
  },
  methods: {
    save () {
      this.updateProject({
        id: this.id,
        name: this.name,
        requiresNotes: this.requiresNotes,
        defaultNotes: this.defaultNotes,
        linkedProjectId: this.linkedProject?.id,
        linkedAreaId: this.linkedArea?.id
      })
      this.$router.back()
    },
    selectedProjectChanged () {
      this.linkedArea = null
    },
    async copyMagicTag () {
      try {
        const result = await navigator.permissions.query({ name: 'clipboard-write' })
        if (result.state === 'granted' || result.state === 'prompt') {
          navigator.clipboard.writeText(this.magicTag)
        }
      } catch (e) {
        console.error(e)
      }
    },
    ...mapMutations({
      updateProject: 'projects/update'
    })
  }
}
</script>

<style lang="postcss">

</style>
