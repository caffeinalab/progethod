<template>
  <PanelModal
    :model-value="modelValue"
    :title="title"
    toolbar-class="px-6 pb-3"
    body-class="px-6 pb-6"
    lock-body-scroll
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #toolbar>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="w-full px-3 py-2 border border-stroke-muted rounded-lg text-sm text-ink bg-card focus:ring-2 focus:ring-focus-ring focus:border-transparent outline-none placeholder-ink-faint"
        :placeholder="searchPlaceholder"
      >
      <slot name="filters" />
    </template>

    <LoadingState v-if="loading" :message="loadingText" />

    <ErrorState
      v-else-if="error"
      :message="error"
      :retry-label="retryLabel"
      @retry="emit('retry')"
    />

    <div v-else-if="isEmpty" class="py-8 text-center text-sm text-ink-faint">
      {{ emptyText }}
    </div>

    <template v-else>
      <div v-for="group in filteredGroups" :key="group.key" class="mb-4 last:mb-0">
        <h3 class="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-2">
          {{ group.label }}
        </h3>
        <ul class="space-y-1">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent-soft cursor-pointer transition-colors group"
            :class="{ 'bg-success-soft': addedIds.includes(item.id) }"
            @click="selectItem(item)"
          >
            <div class="flex-1 min-w-0">
              <slot name="item" :item="item" :copied-id="copiedId" :copy="copyId" />
            </div>
            <IconCheck v-if="addedIds.includes(item.id)" :size="18" class="text-success flex-shrink-0" />
          </li>
        </ul>
      </div>

      <p v-if="filteredGroups.length === 0" class="py-8 text-center text-sm text-ink-faint">
        {{ noResultsText }}
      </p>
    </template>
  </PanelModal>
</template>

<script setup lang="ts">
import { IconCheck } from '@tabler/icons-vue'
import { copyToClipboard } from '~/utils/clipboard'
import type { ActivityGroup, ActivityItem } from '~/utils/activityPicker'

const props = defineProps<{
  modelValue: boolean
  title: string
  searchPlaceholder: string
  loading: boolean
  error: string | null
  loadingText: string
  retryLabel: string
  emptyText: string
  noResultsText: string
  groups: ActivityGroup[]
  isEmpty: boolean
  filterItem: (item: ActivityItem, query: string) => boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [item: ActivityItem]
  retry: []
}>()

const searchQuery = ref('')
const copiedId = ref<string | null>(null)
const addedIds = ref<string[]>([])
const searchInput = ref<HTMLInputElement | null>(null)

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return props.groups
  const query = searchQuery.value.toLowerCase()
  return props.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => props.filterItem(item, query)),
    }))
    .filter((group) => group.items.length > 0)
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  searchQuery.value = ''
  addedIds.value = []
  nextTick(() => searchInput.value?.focus())
})

function selectItem(item: ActivityItem) {
  emit('select', item)
  if (!addedIds.value.includes(item.id)) {
    addedIds.value.push(item.id)
  }
}

async function copyId(text: string) {
  await copyToClipboard(text)
  copiedId.value = text
  setTimeout(() => { copiedId.value = null }, 1500)
}
</script>
