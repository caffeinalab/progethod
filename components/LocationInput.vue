<template>
  <div class="flex justify-center" :class="variant === 'text' ? 'ml-2 mr-2' : ''">
    <!-- Day header: text toggle buttons -->
    <div
      v-if="variant === 'text'"
      class="flex items-center gap-1 p-0.5 bg-page rounded-full shadow"
    >
      <button
        v-for="option in options"
        :key="option.key"
        class="focus:outline-none flex justify-center items-center disabled:cursor-default transition-colors duration-150 pl-2 pr-3 py-1 text-xs font-semibold gap-1.5 rounded-full"
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
        class="flex items-center justify-center w-10 h-10 rounded-lg border border-stroke-muted bg-card shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-focus-ring"
        :class="disabled
          ? 'text-ink-disabled cursor-default'
          : 'cursor-pointer hover:bg-card-hover hover:border-stroke ' + activeIconColor"
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
        class="absolute right-0 top-full mt-1 z-50 bg-card border border-stroke-muted rounded-lg shadow-lg py-1 w-44"
      >
        <button
          v-for="option in options"
          :key="option.key"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-card-hover"
          :class="value === option.key ? activeClassesFor(option) : 'text-ink-secondary'"
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
  { key: 'home', label: 'home', icon: 'HomeIcon' },
  { key: 'office', label: 'office', icon: 'BuildingIcon' },
  { key: 'travel', label: 'travel', icon: 'CarIcon' },
  { key: 'overtime', label: 'overtime', icon: 'ClockIcon' },
  { key: 'night_shift', label: 'night_shift', icon: 'MoonIcon' }
]

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
      return 'location-icon-color'
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
    activeClassesFor () {
      return 'location-active font-medium'
    },
    optionClasses (option) {
      const isActive = this.value === option.key
      if (this.disabled) {
        return isActive
          ? 'text-ink-inverse bg-ink-disabled cursor-default'
          : 'text-ink-disabled cursor-default'
      }
      if (isActive) {
        return 'location-active cursor-default'
      }
      return 'text-ink-muted location-hover'
    }
  }
}
</script>

<style scoped>
.location-icon-color {
  color: var(--color-location);
}

.location-active {
  color: var(--color-location-text);
  background-color: var(--color-location-soft);
}

.location-hover:hover {
  color: var(--color-location-text);
  background-color: var(--color-location-soft);
}
</style>
