<template>
  <div class="flex justify-center" :class="variant === 'text' ? 'ml-2 mr-2' : ''">
    <!-- Day header: quick Casa/Ufficio + select for the rest -->
    <div
      v-if="variant === 'text'"
      class="flex items-center gap-1 p-0.5 bg-page rounded-full shadow"
      ref="pickerContainer"
    >
      <button
        v-for="option in quickOptions"
        :key="option.key"
        class="focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring flex justify-center items-center disabled:cursor-default transition-colors duration-150 pl-2.5 pr-3 py-1.5 text-xs font-semibold gap-1.5 rounded-full"
        :class="optionClasses(option.key)"
        :disabled="disabled"
        :title="$t(option.label)"
        @click="select(option.key)"
      >
        <component :is="option.icon" :size="14" />
        <span>{{ $t(option.label) }}</span>
      </button>

      <div class="relative">
        <button
          class="focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring flex justify-center items-center disabled:cursor-default transition-colors duration-150 pl-2.5 pr-2 py-1.5 text-xs font-semibold gap-1 rounded-full"
          :class="moreTriggerClasses"
          :disabled="disabled"
          :title="moreTriggerTitle"
          @click="pickerOpen = !pickerOpen"
        >
          <component v-if="selectedMoreOption" :is="selectedMoreOption.icon" :size="14" />
          <span>{{ $t(selectedMoreOption ? selectedMoreOption.label : 'location_other') }}</span>
          <IconChevronDown :size="12" class="opacity-70" />
        </button>
        <div
          v-if="pickerOpen && !disabled"
          class="absolute left-0 top-full mt-1 z-50 bg-card border border-stroke-muted rounded-lg shadow-lg py-1 w-44"
        >
          <button
            v-for="option in moreOptions"
            :key="option.key"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-card-hover"
            :class="modelValue === option.key ? 'location-active font-medium' : 'text-ink-secondary'"
            @click="selectAndClose(option.key)"
          >
            <component :is="option.icon" :size="16" />
            <span>{{ $t(option.label) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Per-row: icon button with dropdown picker -->
    <div v-else class="relative" ref="pickerContainer">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-lg border border-stroke-muted bg-card shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-focus-ring"
        :class="disabled
          ? 'text-ink-disabled cursor-default'
          : 'cursor-pointer hover:bg-card-hover hover:border-stroke location-icon-color'"
        :disabled="disabled"
        :title="$t(selectedOption.label)"
        @click="pickerOpen = !pickerOpen"
      >
        <component :is="selectedOption.icon" :size="16" />
      </button>
      <div
        v-if="pickerOpen && !disabled"
        class="absolute right-0 top-full mt-1 z-50 bg-card border border-stroke-muted rounded-lg shadow-lg py-1 w-44"
      >
        <button
          v-for="option in quickOptions"
          :key="option.key"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-card-hover"
          :class="modelValue === option.key ? 'location-active font-medium' : 'text-ink-secondary'"
          @click="selectAndClose(option.key)"
        >
          <component :is="option.icon" :size="16" />
          <span>{{ $t(option.label) }}</span>
        </button>
        <div class="my-1 border-t border-stroke-muted" />
        <button
          v-for="option in moreOptions"
          :key="option.key"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-card-hover"
          :class="modelValue === option.key ? 'location-active font-medium' : 'text-ink-secondary'"
          @click="selectAndClose(option.key)"
        >
          <component :is="option.icon" :size="16" />
          <span>{{ $t(option.label) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, markRaw } from 'vue'
import { IconHome, IconBuilding, IconCar, IconClock, IconMoon, IconChevronDown } from '@tabler/icons-vue'

const { t: $t } = useI18n()

const props = defineProps<{
  modelValue: string
  variant?: 'icon' | 'text'
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const pickerContainer = ref<HTMLElement | null>(null)
const pickerOpen = ref(false)

const quickOptions = [
  { key: 'home', label: 'home', icon: markRaw(IconHome) },
  { key: 'office', label: 'office', icon: markRaw(IconBuilding) },
]

const moreOptions = [
  { key: 'travel', label: 'travel', icon: markRaw(IconCar) },
  { key: 'overtime', label: 'overtime', icon: markRaw(IconClock) },
  { key: 'night_shift', label: 'night_shift', icon: markRaw(IconMoon) },
]

const allOptions = [...quickOptions, ...moreOptions]

const selectedOption = computed(() =>
  allOptions.find(option => option.key === props.modelValue) || quickOptions[0]
)

const selectedMoreOption = computed(() =>
  moreOptions.find(option => option.key === props.modelValue) || null
)

const isMoreSelected = computed(() => selectedMoreOption.value != null)

const moreTriggerTitle = computed(() =>
  $t(selectedMoreOption.value ? selectedMoreOption.value.label : 'location_other')
)

function select(place: string) {
  emit('update:modelValue', place)
}

function selectAndClose(place: string) {
  select(place)
  pickerOpen.value = false
}

function optionClasses(optionKey: string) {
  const isActive = props.modelValue === optionKey
  if (props.disabled) {
    return isActive
      ? 'text-ink-inverse bg-ink-disabled cursor-default'
      : 'text-ink-disabled cursor-default'
  }
  if (isActive) return 'location-active cursor-default'
  return 'text-ink-muted location-hover cursor-pointer'
}

const moreTriggerClasses = computed(() => {
  if (props.disabled) {
    return isMoreSelected.value
      ? 'text-ink-inverse bg-ink-disabled cursor-default'
      : 'text-ink-disabled cursor-default'
  }
  if (isMoreSelected.value) return 'location-active cursor-pointer'
  return 'text-ink-muted location-hover cursor-pointer'
})

function onClickOutside(event: MouseEvent) {
  if (!pickerContainer.value?.contains(event.target as Node)) {
    pickerOpen.value = false
  }
}

onMounted(() => { document.addEventListener('click', onClickOutside) })
onBeforeUnmount(() => { document.removeEventListener('click', onClickOutside) })
</script>

<style scoped>
.location-icon-color {
  color: var(--color-accent-fg);
}
.location-active {
  color: var(--color-ink-inverse);
  background-color: var(--color-accent);
}
.location-hover:hover {
  color: var(--color-accent-fg);
  background-color: var(--color-accent-soft);
}
</style>
