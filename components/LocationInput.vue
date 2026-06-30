<template>
  <div class="flex justify-center" :class="variant === 'text' ? 'ml-2 mr-2' : ''">
    <!-- Day header: text toggle buttons -->
    <div
      v-if="variant === 'text'"
      class="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"
    >
      <button
        v-for="option in options"
        :key="option.key"
        class="focus:outline-none flex justify-center items-center disabled:cursor-default transition-colors duration-150 px-2 py-1 text-xs font-semibold gap-1 rounded-full"
        :class="optionClasses(option)"
        :disabled="disabled"
        :title="$t(option.label)"
        @click="select(option.key)"
      >
        <component
          :is="option.icon"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
        />
        <span>{{ $t(option.label) }}</span>
      </button>
    </div>

    <!-- Per-row: icon button with dropdown picker -->
    <div v-else class="relative">
      <button
        class="flex items-center justify-center w-10 h-10 rounded border shadow transition-colors duration-150 focus:outline-none focus:border-indigo-700"
        :class="disabled
          ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-default'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-pointer hover:border-gray-400 ' + activeIconColor"
        :disabled="disabled"
        :title="$t(selectedOption.label)"
        @click="pickerOpen = !pickerOpen"
      >
        <component
          :is="selectedOption.icon"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
        />
      </button>
      <div
        v-if="pickerOpen && !disabled"
        class="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-44"
      >
        <button
          v-for="option in options"
          :key="option.key"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          :class="value === option.key ? activeClassesFor(option) : 'text-gray-700 dark:text-gray-300'"
          @click="selectAndClose(option.key)"
        >
          <component
            :is="option.icon"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
          />
          <span>{{ $t(option.label) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import {
  BuildingIcon,
  HomeIcon,
  CarIcon,
  ClockIcon,
  MoonIcon
} from 'vue-tabler-icons'

const LOCATION_OPTIONS = [
  { key: 'home', label: 'home', icon: 'HomeIcon', activeColor: 'purple' },
  { key: 'office', label: 'office', icon: 'BuildingIcon', activeColor: 'blue' },
  { key: 'travel', label: 'travel', icon: 'CarIcon', activeColor: 'cyan' },
  { key: 'overtime', label: 'overtime', icon: 'ClockIcon', activeColor: 'amber' },
  { key: 'night_shift', label: 'night_shift', icon: 'MoonIcon', activeColor: 'slate' }
]

const ACTIVE_CLASSES = {
  amber: 'text-amber-700 bg-amber-100 dark:bg-amber-900 dark:text-amber-300',
  blue: 'text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  cyan: 'text-cyan-700 bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-300',
  purple: 'text-purple-700 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
  slate: 'text-slate-700 bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
}

const ICON_COLOR_CLASSES = {
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  purple: 'text-purple-600 dark:text-purple-400',
  slate: 'text-slate-600 dark:text-slate-400'
}

const HOVER_CLASSES = {
  amber: 'hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-800',
  blue: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800',
  cyan: 'hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-gray-800',
  purple: 'hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800',
  slate: 'hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800'
}

export default {
  components: {
    BuildingIcon,
    HomeIcon,
    CarIcon,
    ClockIcon,
    MoonIcon
  },
  props: {
    value: {
      type: String,
      default: 'home'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    variant: {
      type: String,
      default: 'icon',
      validator: val => ['icon', 'text'].includes(val)
    }
  },
  data () {
    return {
      pickerOpen: false
    }
  },
  computed: {
    options () {
      return LOCATION_OPTIONS
    },
    selectedOption () {
      return LOCATION_OPTIONS.find(option => option.key === this.value) || LOCATION_OPTIONS[0]
    },
    activeIconColor () {
      return ICON_COLOR_CLASSES[this.selectedOption.activeColor] || ''
    }
  },
  mounted () {
    this._onClickOutside = (event) => {
      if (!this.$el.contains(event.target)) {
        this.pickerOpen = false
      }
    }
    document.addEventListener('click', this._onClickOutside)
  },
  beforeDestroy () {
    document.removeEventListener('click', this._onClickOutside)
  },
  methods: {
    select (place) {
      this.$emit('input', place)
    },
    selectAndClose (place) {
      this.select(place)
      this.pickerOpen = false
    },
    activeClassesFor (option) {
      return ACTIVE_CLASSES[option.activeColor] + ' font-medium'
    },
    optionClasses (option) {
      const isActive = this.value === option.key
      if (this.disabled) {
        return isActive
          ? 'text-white bg-gray-300 cursor-default'
          : 'text-gray-300 cursor-default'
      }
      if (isActive) {
        return ACTIVE_CLASSES[option.activeColor] + ' cursor-default'
      }
      return 'text-gray-400 dark:text-gray-500 ' + HOVER_CLASSES[option.activeColor]
    }
  }
}
</script>

<style scoped>

</style>
