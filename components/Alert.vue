<template>
  <div class="container px-6 mx-auto">
    <div id="alert" class="transition duration-150 ease-in-out shadow rounded-md md:flex justify-between items-center mt-4 mb-4 py-4 px-4" :class="bgColor">
      <div class="sm:flex items-center">
        <div class="flex items-end">
          <alert-circle-icon class="mr-2 mt-0.5 sm:mt-0" :class="iconColor" />
          <p class="mr-2 text-base font-bold" :class="textColor">
            {{ $t(level) }}
          </p>
        </div>
        <div class="h-1 w-1 rounded-full mr-2 hidden xl:block" :class="iconColor" />
        <p class="text-base" :class="textColor" v-html="message" />
      </div>
      <button
        v-if="dismissable"
        class="ml-auto pl-4 flex-shrink-0 transition-colors"
        :class="textColor + ' hover:opacity-70'"
        @click="$emit('dismiss')"
      >
        <x-icon size="18" />
      </button>
    </div>
  </div>
</template>

<script>
import { AlertCircleIcon, XIcon } from 'vue-tabler-icons'

export default {
  name: 'ColorCodedWithIconWarning',
  components: {
    AlertCircleIcon,
    XIcon
  },
  props: {
    message: {
      type: String,
      required: true
    },
    level: {
      type: String,
      default: 'warning'
    },
    dismissable: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    bgColor () {
      return this.level === 'error' ? 'bg-danger-soft' : 'bg-warning-soft'
    },
    iconColor () {
      return this.level === 'error' ? 'text-danger' : 'text-warning'
    },
    textColor () {
      return this.level === 'error' ? 'text-danger-text' : 'text-warning-text'
    }
  }
}
</script>
