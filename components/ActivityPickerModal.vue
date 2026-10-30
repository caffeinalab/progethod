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
      <ActivityDayNavigator
        :model-value="viewedDay"
        :target-day="day"
        @update:model-value="emit('update:viewedDay', $event)"
      />
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
    >
      <button
        v-if="reconnectLabel"
        type="button"
        class="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-ink-inverse hover:bg-accent-hover transition-colors"
        @click="emit('reconnect')"
      >
        {{ reconnectLabel }}
      </button>
    </ErrorState>

    <div v-else-if="isEmpty" class="py-8 text-center text-sm text-ink-faint">
      {{ emptyText }}
    </div>

    <template v-else>
      <div v-for="group in filteredGroups" :key="group.key" class="mb-4 last:mb-0">
        <h3 class="mb-2">
          <button
            type="button"
            class="flex w-full items-center gap-1.5 min-h-6 rounded text-left text-xs font-semibold text-ink-faint uppercase tracking-wide hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            :aria-expanded="isGroupExpanded(group.key)"
            @click="toggleGroup(group.key)"
          >
            <IconChevronRight
              :size="14"
              class="flex-shrink-0 transition-transform"
              :class="{ 'rotate-90': isGroupExpanded(group.key) }"
            />
            <span class="truncate">{{ group.label }}</span>
            <span class="ml-auto flex-shrink-0 font-normal normal-case tracking-normal">{{ group.items.length }}</span>
          </button>
        </h3>
        <ul v-show="isGroupExpanded(group.key)" class="space-y-1">
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
import { IconCheck, IconChevronRight } from '@tabler/icons-vue'
import { copyToClipboard } from '~/utils/clipboard'
import type { ActivityGroup, ActivityItem } from '~/utils/activityPicker'

const props = defineProps<{
  modelValue: boolean
  /** Day the selected items are added to */
  day: string
  /** Day whose activity is listed; may differ from `day` */
  viewedDay: string
  title: string
  searchPlaceholder: string
  loading: boolean
  error: string | null
  loadingText: string
  retryLabel: string
  reconnectLabel?: string
  emptyText: string
  noResultsText: string
  groups: ActivityGroup[]
  isEmpty: boolean
  filterItem: (item: ActivityItem, query: string) => boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:viewedDay': [day: string]
  select: [item: ActivityItem]
  retry: []
  reconnect: []
}>()

const searchQuery = ref('')
const copiedId = ref<string | null>(null)
const addedIds = ref<string[]>([])
const searchInput = ref<HTMLInputElement | null>(null)
const collapsedGroupKeys = ref(new Set<string>())

const isSearching = computed(() => searchQuery.value.trim() !== '')

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
  collapsedGroupKeys.value = new Set()
  nextTick(() => searchInput.value?.focus())
})

// Searching shows every match, so collapsed groups don't hide results.
function isGroupExpanded(key: string) {
  return isSearching.value || !collapsedGroupKeys.value.has(key)
}

function toggleGroup(key: string) {
  if (isSearching.value) return
  const next = new Set(collapsedGroupKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsedGroupKeys.value = next
}

function selectItem(item: ActivityItem) {
  if (addedIds.value.includes(item.id)) return
  addedIds.value.push(item.id)
  emit('select', item)
}

async function copyId(text: string) {
  await copyToClipboard(text)
  copiedId.value = text
  setTimeout(() => { copiedId.value = null }, 1500)
}
</script>
