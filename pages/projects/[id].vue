<template>
  <div class="mx-auto container py-10 pt-24">
    <div class="flex w-full flex-col overflow-hidden rounded-lg bg-card shadow lg:flex-row">
      <div class="w-full px-4 py-6 lg:w-2/3 lg:px-6">
        <div class="flex items-center border-b border-stroke pb-5">
          <p class="text-lg font-bold text-ink">
            {{ $t('project_information') }}
          </p>
          <div class="ml-2 text-ink-secondary">
            <IconInfoCircle :size="16" />
          </div>
        </div>
        <form class="mt-6 space-y-6">
          <div class="flex max-w-md flex-col">
            <label for="name" class="pb-2 text-sm font-bold text-ink">{{ $t('project_name') }}</label>
            <input
              id="name"
              v-model="name"
              type="text"
              name="name"
              required
              class="rounded-lg border border-stroke bg-transparent py-3 pl-3 text-sm text-ink shadow-sm placeholder-ink-faint focus:border-accent focus:outline-none"
            >
          </div>
          <div class="flex flex-col">
            <label class="pb-2 text-sm font-bold text-ink">{{ $t('linked_project') }}</label>
            <v-select v-model="linkedProject" label="name" :options="apiDataStore.projects" @update:model-value="linkedArea = null" />
          </div>
          <div v-if="linkedProject" class="flex flex-col">
            <label class="pb-2 text-sm font-bold text-ink">{{ $t('linked_area') }}</label>
            <v-select v-model="linkedArea" label="name" :options="linkedProject.areas" />
          </div>
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0 flex-1">
              <label class="pb-2 text-sm font-bold text-ink">{{ $t('require_notes') }}</label>
              <p class="text-sm text-ink-muted">{{ $t('require_notes_description') }}</p>
            </div>
            <div class="relative shrink-0 cursor-pointer rounded-full bg-card-hover shadow-sm">
              <input id="toggle" v-model="requiresNotes" type="checkbox" class="checkbox absolute top-0 bottom-0 z-10 m-auto h-6 w-6 cursor-pointer appearance-none rounded-full border border-transparent bg-accent shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
              <label for="toggle" class="toggle-label block h-6 w-12 cursor-pointer overflow-hidden rounded-full bg-stroke" />
            </div>
          </div>
          <div class="flex max-w-md flex-col">
            <label for="defaultNotes" class="pb-2 text-sm font-bold text-ink">{{ $t('default_notes') }}</label>
            <input
              id="defaultNotes"
              v-model="defaultNotes"
              type="text"
              name="defaultNotes"
              class="rounded-lg border border-stroke bg-transparent py-3 pl-3 text-sm text-ink shadow-sm placeholder-ink-faint focus:border-accent focus:outline-none"
            >
          </div>
          <div class="flex flex-col">
            <label class="pb-2 text-sm font-bold text-ink">{{ $t('magic_tag') }}</label>
            <p class="mb-3 text-sm text-ink-muted">{{ $t('what_is_a_magic_tag') }}</p>
            <div class="flex items-stretch gap-2">
              <input
                :value="magicTag"
                type="text"
                class="min-w-0 flex-1 rounded-lg border border-stroke bg-transparent py-3 pl-3 font-mono text-sm text-ink shadow-sm placeholder-ink-faint focus:border-accent focus:outline-none"
                readonly
              >
              <button
                class="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-transparent bg-accent text-ink-inverse transition duration-150 ease-in-out hover:bg-accent-hover focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-default disabled:bg-ink-muted"
                :disabled="!linkedProject"
                :title="$t('copy')"
                type="button"
                @click="copyMagicTag"
              >
                <IconClipboard :size="20" />
              </button>
            </div>
            <p class="mt-2 text-sm text-ink-muted">
              {{ $t('magic_tag_for_everybody') }}
            </p>
          </div>
        </form>
      </div>
      <div class="flex w-full items-start border-t border-stroke bg-card-dim p-5 lg:w-1/3 lg:border-t-0 lg:border-l">
        <button class="rounded-lg border border-transparent bg-accent px-8 py-2 text-sm text-ink-inverse transition duration-150 ease-in-out hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" @click="save">
          {{ $t('save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconInfoCircle, IconClipboard } from '@tabler/icons-vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { formatMagicTag } from '~/utils/magicTag'
import { copyToClipboard } from '~/utils/clipboard'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiDataStore = useApiDataStore()

const projectId = route.params.id as string
const existingProject = projectsStore.projects.find(project => project.id === projectId)

if (!existingProject) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
}

const name = ref(existingProject.name)
const defaultNotes = ref(existingProject.defaultNotes || '')
const requiresNotes = ref(existingProject.requiresNotes || false)

const linkedProject = ref(
  existingProject.linkedProjectId
    ? apiDataStore.projects.find(project => project.id === existingProject.linkedProjectId) || null
    : null,
)
const linkedArea = ref(
  linkedProject.value && existingProject.linkedAreaId
    ? linkedProject.value.areas.find(area => area.id === existingProject.linkedAreaId) || null
    : null,
)

const magicTag = computed(() => {
  if (!linkedProject.value) { return '' }
  return formatMagicTag(linkedProject.value.id, linkedArea.value?.id)
})

function save() {
  projectsStore.update({
    id: projectId,
    name: name.value,
    requiresNotes: requiresNotes.value,
    defaultNotes: defaultNotes.value,
    linkedProjectId: linkedProject.value?.id,
    linkedAreaId: linkedArea.value?.id,
  })
  router.back()
}

async function copyMagicTag() {
  if (!magicTag.value) { return }
  await copyToClipboard(magicTag.value)
}
</script>
