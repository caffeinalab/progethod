<template>
  <div class="flex justify-center ml-2 mr-2">
    <div
      class="flex items-center gap-1"
      :class="variant === 'text' ? 'p-0.5 bg-gray-100 dark:bg-gray-800 rounded-full' : ''"
    >
      <button
        class="focus:outline-none flex justify-center items-center disabled:cursor-default transition-colors duration-150"
        :class="[
          variant === 'text' ? 'px-2.5 py-1 text-xs font-semibold gap-1 rounded-full' : 'p-2 rounded',
          homeClasses
        ]"
        :disabled="disabled"
        :title="$t('home')"
        @click="select('home')"
      >
        <home-icon
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
        />
        <span v-if="variant === 'text'">{{ $t('home') }}</span>
      </button>
      <button
        class="focus:outline-none flex justify-center items-center disabled:cursor-default transition-colors duration-150"
        :class="[
          variant === 'text' ? 'px-2.5 py-1 text-xs font-semibold gap-1 rounded-full' : 'p-2 rounded',
          officeClasses
        ]"
        :disabled="disabled"
        :title="$t('office')"
        @click="select('office')"
      >
        <building-icon
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
        />
        <span v-if="variant === 'text'">{{ $t('office') }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import {
  BuildingIcon,
  HomeIcon
} from 'vue-tabler-icons'

export default {
  components: {
    BuildingIcon,
    HomeIcon
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
  computed: {
    homeClasses () {
      if (this.disabled) {
        return this.value === 'home'
          ? 'text-white bg-gray-300 cursor-default'
          : 'text-gray-300 cursor-default'
      }
      if (this.value === 'home') {
        return 'text-amber-700 bg-amber-100 dark:bg-amber-900 dark:text-amber-300 cursor-default'
      }
      return 'text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-800'
    },
    officeClasses () {
      if (this.disabled) {
        return this.value === 'office'
          ? 'text-white bg-gray-300 cursor-default'
          : 'text-gray-300 cursor-default'
      }
      if (this.value === 'office') {
        return 'text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 cursor-default'
      }
      return 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800'
    }
  },
  methods: {
    select (place) {
      this.$emit('input', place)
    }
  }
}
</script>

<style scoped>

</style>
