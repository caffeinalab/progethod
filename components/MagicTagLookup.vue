<template>
  <section class="rounded-lg border border-stroke p-4">
    <h2 class="text-sm font-semibold text-ink">{{ $t('magic_tag_lookup_title') }}</h2>
    <p class="mt-1 text-sm text-ink-muted">
      {{ $t('magic_tag_lookup_desc') }}<br>
      {{ $t('magic_tag_lookup_desc_2') }}
    </p>

    <div class="mt-4 space-y-3">
      <div class="flex flex-col">
        <label class="pb-1.5 text-xs font-semibold text-ink-muted">{{ $t('linked_project') }}</label>
        <v-select
          v-model="selectedProject"
          label="name"
          :options="wethodProjects"
          :placeholder="$t('select_project')"
          @update:model-value="selectedArea = null"
        />
      </div>

      <div v-if="selectedProject" class="flex flex-col">
        <label class="pb-1.5 text-xs font-semibold text-ink-muted">{{ $t('linked_area') }}</label>
        <v-select
          v-model="selectedArea"
          label="name"
          :options="selectedProject.areas"
          :placeholder="$t('magic_tag_lookup_area_optional')"
        />
      </div>

      <div v-if="magicTag" class="flex items-stretch gap-2">
        <input
          :value="magicTag"
          type="text"
          class="min-w-0 flex-1 rounded-lg border border-stroke bg-transparent py-2.5 pl-3 font-mono text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
          readonly
        >
        <button
          type="button"
          class="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-transparent bg-accent text-ink-inverse transition duration-150 ease-in-out hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          :title="$t('copy_magic_tag')"
          @click="copyMagicTag"
        >
          <IconClipboard :size="18" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconClipboard } from '@tabler/icons-vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { formatMagicTag } from '~/utils/magicTag'
import { copyToClipboard } from '~/utils/clipboard'

interface WethodArea {
  id: string | number
  name: string
}

interface WethodProject {
  id: number
  name: string
  isAutomatic?: boolean
  areas: WethodArea[]
}

const apiDataStore = useApiDataStore()

const selectedProject = ref<WethodProject | null>(null)
const selectedArea = ref<WethodArea | null>(null)

const wethodProjects = computed(() =>
  apiDataStore.projects.filter(project => !project.isAutomatic),
)

const magicTag = computed(() => {
  if (!selectedProject.value) { return '' }
  return formatMagicTag(selectedProject.value.id, selectedArea.value?.id)
})

async function copyMagicTag() {
  if (!magicTag.value) { return }
  await copyToClipboard(magicTag.value)
}
</script>
