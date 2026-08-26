<template>
  <div>
    <div v-if="!bare" class="flex justify-between items-center pb-2 flex-col">
      <p v-if="!indeterminate" class="text-xs text-accent-fg font-semibold tracking-wide">
        {{ fill }}% {{ resolvedProgressLabel }}
      </p>
      <p v-if="resolvedWaitLabel" class="text-xs font-semibold text-ink tracking-wide">
        {{ resolvedWaitLabel }}
      </p>
    </div>
    <div class="flex items-center">
      <div class="w-full bg-stroke-muted h-1 mr-1 rounded-tl rounded-bl relative overflow-hidden">
        <div
          v-if="indeterminate"
          class="h-1 bg-accent progress-bar-indeterminate"
        />
        <div
          v-else
          class="h-1 bg-accent transition-transform duration-200 ease-out w-full origin-left"
          :style="{ transform: `scaleX(${clampedFill / 100})` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()

const props = withDefaults(defineProps<{
  fill: number
  /** Hide labels — bar track only. */
  bare?: boolean
  /** Unknown duration — sliding fill instead of a determinate value. */
  indeterminate?: boolean
  /** Label after the percentage (defaults to "Inviato"). */
  progressLabel?: string
  /** Secondary line under the bar (defaults to the sending text; pass '' to hide). */
  waitLabel?: string
}>(), {
  bare: false,
  indeterminate: false,
  progressLabel: undefined,
  waitLabel: undefined,
})

const clampedFill = computed(() => Math.min(100, Math.max(0, props.fill)))
const resolvedProgressLabel = computed(() => props.progressLabel ?? $t('sent'))
const resolvedWaitLabel = computed(() => props.waitLabel ?? $t('please_wait_sending'))
</script>

<style scoped>
.progress-bar-indeterminate {
  width: 40%;
  animation: progress-bar-slide 1.1s ease-in-out infinite;
}

@keyframes progress-bar-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}

@media (prefers-reduced-motion: reduce) {
  .progress-bar-indeterminate {
    animation: none;
    width: 100%;
  }
}
</style>
