<template>
  <div class="container px-6 mx-auto">
    <div class="transition duration-150 ease-in-out shadow rounded-md md:flex justify-between items-center mt-4 mb-4 py-4 px-4" :class="bgColor">
      <div class="sm:flex items-center">
        <div class="flex items-end">
          <IconAlertCircle class="mr-2 mt-0.5 sm:mt-0" :class="iconColor" :size="20" />
          <p class="mr-2 text-base font-bold" :class="textColor">
            {{ $t(level || 'warning') }}
          </p>
        </div>
        <div class="h-1 w-1 rounded-full mr-2 hidden xl:block" :class="iconColor" />
        <p class="text-base" :class="textColor" v-html="message" />
      </div>
      <button
        v-if="dismissable"
        class="ml-auto pl-4 flex-shrink-0 transition-colors hover:opacity-70"
        :class="textColor"
        @click="$emit('dismiss')"
      >
        <IconX :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconAlertCircle, IconX } from '@tabler/icons-vue'

const { t: $t } = useI18n()

const props = defineProps<{
  message: string
  level?: 'error' | 'warning' | 'info'
  dismissable?: boolean
}>()

defineEmits<{ dismiss: [] }>()

const bgColor = computed(() => props.level === 'error' ? 'bg-danger-soft' : 'bg-warning-soft')
const iconColor = computed(() => props.level === 'error' ? 'text-danger' : 'text-warning')
const textColor = computed(() => props.level === 'error' ? 'text-danger-text' : 'text-warning-text')
</script>
