<template>
  <div
    v-if="userStore.businessUnitsEnabled"
    class="relative"
    :class="variant === 'nav' ? 'h-full shrink-0' : 'w-full'"
  >
    <button
      type="button"
      :class="variant === 'nav'
        ? 'w-24 h-full flex items-center justify-center gap-1 border-r border-stroke-muted text-ink-secondary cursor-pointer hover:bg-card-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
        : 'w-full flex items-center justify-between px-1 py-2 text-ink-secondary cursor-pointer hover:text-accent-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'"
      :title="$t('business_unit_tooltip')"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click.stop="toggleOpen"
    >
      <span class="inline-flex items-center gap-1">
        <span class="text-xs font-semibold text-ink tracking-wide">BU</span>
        <span class="text-xs text-ink-muted tabular-nums">{{ selectedCount }}/{{ allBusinessUnits.length }}</span>
      </span>
      <IconChevronDown
        :size="14"
        class="text-ink-faint transition-transform duration-150"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition name="bu-menu">
      <div
        v-if="isOpen"
        class="bu-menu absolute z-40 mt-2 border border-stroke-muted bg-card rounded-lg shadow-lg overflow-hidden"
        :class="variant === 'nav' ? 'right-0 w-72' : 'left-0 right-0 w-full'"
        role="listbox"
        aria-multiselectable="true"
        @click.stop
      >
        <p class="px-3 pt-3 pb-2 text-xs text-ink-muted leading-snug">
          {{ $t('business_unit_hint') }}
        </p>

        <div class="px-2 pb-2">
          <div class="relative">
            <IconSearch
              :size="16"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              :placeholder="$t('business_unit_search_placeholder')"
              class="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-stroke bg-page text-ink placeholder-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              @keydown.escape.stop="close"
            >
          </div>
        </div>

        <div class="px-1.5 pb-1.5 border-b border-stroke-muted">
          <label class="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-card-hover cursor-pointer transition-colors">
            <span
              class="flex items-center justify-center w-5 h-5 rounded border transition-colors flex-shrink-0"
              :class="allSelected || someSelected ? 'bg-accent border-accent' : 'border-stroke bg-card'"
            >
              <svg
                v-if="allSelected"
                class="w-3.5 h-3.5 text-ink-inverse"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><polyline points="2.5 6 5 8.5 9.5 3.5" /></svg>
              <svg
                v-else-if="someSelected"
                class="w-3.5 h-3.5 text-ink-inverse"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              ><line x1="3" y1="6" x2="9" y2="6" /></svg>
            </span>
            <input type="checkbox" class="sr-only" :checked="allSelected" :indeterminate="someSelected" @change="toggleAll">
            <span class="text-sm font-medium text-ink">{{ $t('select_all') }}</span>
          </label>
        </div>

        <div class="max-h-64 overflow-y-auto p-1.5">
          <label
            v-for="businessUnit in filteredBusinessUnits"
            :key="String(businessUnit.id)"
            class="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-card-hover cursor-pointer transition-colors"
          >
            <span
              class="flex items-center justify-center w-5 h-5 rounded border transition-colors flex-shrink-0"
              :class="isSelected(businessUnit.id) ? 'bg-accent border-accent' : 'border-stroke bg-card'"
            >
              <svg
                v-if="isSelected(businessUnit.id)"
                class="w-3.5 h-3.5 text-ink-inverse"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><polyline points="2.5 6 5 8.5 9.5 3.5" /></svg>
            </span>
            <input type="checkbox" class="sr-only" :checked="isSelected(businessUnit.id)" @change="toggle(businessUnit.id)">
            <span class="text-sm text-ink truncate">{{ businessUnit.name }}</span>
          </label>

          <p
            v-if="filteredBusinessUnits.length === 0"
            class="px-2.5 py-3 text-sm text-ink-muted text-center"
          >
            {{ $t('business_unit_no_results') }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { IconChevronDown, IconSearch } from '@tabler/icons-vue'
import { updateApiData } from '~/utils/updateApiData'

const props = withDefaults(defineProps<{
  variant?: 'nav' | 'menu'
}>(), {
  variant: 'nav',
})

const { t: $t } = useI18n()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const eventBus = useEventBus()

const isOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const allBusinessUnits = computed(() => userStore.businessUnits || [])
const selectedBusinessUnitIds = computed(() => preferencesStore.selectedBusinessUnitIds)

const allBuIds = computed(() => allBusinessUnits.value.map(businessUnit => businessUnit.id))

const effectiveSelection = computed(() => {
  if (selectedBusinessUnitIds.value === null) return allBuIds.value
  return selectedBusinessUnitIds.value
})

const selectedCount = computed(() => effectiveSelection.value.length)
const allSelected = computed(() => selectedCount.value === allBusinessUnits.value.length && allBusinessUnits.value.length > 0)
const someSelected = computed(() => selectedCount.value > 0 && !allSelected.value)

const filteredBusinessUnits = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allBusinessUnits.value
  return allBusinessUnits.value.filter(businessUnit =>
    businessUnit.name.toLowerCase().includes(query),
  )
})

function isSelected(buId: number) {
  return effectiveSelection.value.includes(buId)
}

function toggle(buId: number) {
  const current = [...effectiveSelection.value]
  const index = current.indexOf(buId)
  if (index >= 0) {
    current.splice(index, 1)
  } else {
    current.push(buId)
  }
  applySelection(current)
}

function toggleAll() {
  if (allSelected.value) {
    applySelection([])
  } else {
    applySelection(null)
  }
}

function applySelection(ids: number[] | null) {
  let normalizedIds = ids
  if (normalizedIds !== null && normalizedIds.length === allBusinessUnits.value.length) {
    normalizedIds = null
  }
  preferencesStore.setSelectedBusinessUnitIds(normalizedIds)
  updateApiData()
}

function toggleOpen() {
  const willOpen = !isOpen.value
  isOpen.value = willOpen
  if (willOpen) {
    searchQuery.value = ''
    eventBus.emit('nav-menu:open', 'bu')
    nextTick(() => searchInputRef.value?.focus())
  }
}

function close() {
  isOpen.value = false
  searchQuery.value = ''
}

function onNavMenuOpen(source: 'status' | 'bu' | 'profile') {
  if (source !== 'bu') close()
}

function onDocumentClick() {
  close()
}

watch(() => props.variant, () => close())

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  eventBus.on('nav-menu:open', onNavMenuOpen)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  eventBus.off('nav-menu:open', onNavMenuOpen)
})
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

.bu-menu {
  transform-origin: top right;
}

.bu-menu-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.bu-menu-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.bu-menu-enter-from,
.bu-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .bu-menu-enter-active,
  .bu-menu-leave-active {
    transition: none;
  }
}
</style>
