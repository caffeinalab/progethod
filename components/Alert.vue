<template>
  <div
    :role="level === 'error' ? 'alert' : 'status'"
    class="flex items-start gap-3 rounded-lg border p-3 text-left"
    :class="tone.container"
  >
    <component :is="tone.icon" :size="20" class="shrink-0" :class="tone.iconColor" />
    <div class="flex-1 min-w-0 space-y-1 text-sm leading-snug">
      <p v-if="title" class="font-semibold">{{ title }}</p>
      <p v-if="message">{{ message }}</p>
      <slot />
    </div>
    <button
      v-if="dismissable"
      type="button"
      class="shrink-0 flex items-center justify-center min-w-6 min-h-6 -m-0.5 rounded transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      :aria-label="$t('close')"
      @click="$emit('dismiss')"
    >
      <IconX :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconX } from '@tabler/icons-vue'

const { t: $t } = useI18n()

const props = withDefaults(defineProps<{
  title?: string
  message?: string
  level?: 'error' | 'warning' | 'success'
  dismissable?: boolean
}>(), { level: 'warning' })

defineEmits<{ dismiss: [] }>()

const TONES = {
  error: { container: 'border-danger/40 bg-danger-soft text-danger-text', icon: IconAlertCircle, iconColor: 'text-danger' },
  warning: { container: 'border-warning/40 bg-warning-soft text-warning-text', icon: IconAlertTriangle, iconColor: 'text-warning' },
  success: { container: 'border-vacation/40 bg-vacation-soft text-vacation-text', icon: IconCircleCheck, iconColor: 'text-vacation-text' },
}

const tone = computed(() => TONES[props.level])
</script>
