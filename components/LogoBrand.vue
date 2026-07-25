<!--
  Brand: CSS 3D matte extruded wordmark (“Progethod”, or “P” when compact).
-->
<template>
  <div
    class="logo-brand inline-flex items-center justify-center shrink-0 overflow-visible"
    role="img"
    :aria-label="ariaLabel"
  >
    <div
      class="logo-mark relative inline-flex items-center justify-center"
      :class="isCompact ? 'is-mark' : 'is-word'"
      :style="markStyle"
      aria-hidden="true"
    >
      <div ref="sceneRef" class="logo-scene">
        <div ref="blockRef" class="logo-block">
          <span
            v-for="layerIndex in depthLayers"
            :key="layerIndex"
            class="logo-layer"
            :class="{ 'is-face': layerIndex === depthLayers }"
            :style="{ transform: `translateZ(${layerIndex * layerStep}px)` }"
          >{{ markText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { animate, type JSAnimation } from 'animejs'
import { useMediaQuery } from '@vueuse/core'

const props = withDefaults(defineProps<{
  size?: number
  ariaLabel?: string
  /**
   * Force compact “P”.
   * When omitted and `responsive` is true, compact below the `lg` breakpoint.
   */
  wordless?: boolean
  /** Auto-switch compact / full at `lg` (default on). */
  responsive?: boolean
}>(), {
  size: 40,
  ariaLabel: 'Progethod',
  responsive: true,
})

const sceneRef = ref<HTMLElement | null>(null)
const blockRef = ref<HTMLElement | null>(null)

const isLgUp = useMediaQuery('(min-width: 1024px)')

const isCompact = computed(() => {
  if (props.wordless === true) { return true }
  if (props.wordless === false) { return false }
  if (!props.responsive) { return false }
  return !isLgUp.value
})

const markText = computed(() => (isCompact.value ? 'P' : 'Progethod'))

/** Slightly smaller than `size` so the tilted extrude stays inside the 64px nav. */
const fittedSize = computed(() => Math.round(props.size * 0.82))

const depthLayers = 10
const layerStep = 0.85

const markStyle = computed(() => {
  const height = fittedSize.value
  if (isCompact.value) {
    return {
      width: `${height}px`,
      height: `${height}px`,
      fontSize: `${height}px`,
    }
  }
  const width = Math.round(height * 3.9)
  return {
    width: `${width}px`,
    height: `${height}px`,
    fontSize: `${height}px`,
  }
})

let idleAnimation: JSAnimation | null = null
let entranceAnimation: JSAnimation | null = null

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') { return true }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function pauseAnimations(animations: Array<JSAnimation | null | undefined>) {
  for (const animation of animations) {
    animation?.pause()
  }
}

function startMarkMotion() {
  pauseAnimations([idleAnimation, entranceAnimation])
  idleAnimation = null
  entranceAnimation = null
  if (!blockRef.value || !sceneRef.value) { return }

  // Reset idle pose before restarting (compact ↔ full swaps)
  blockRef.value.style.transform = 'rotateX(-16deg) rotateY(18deg)'

  if (prefersReducedMotion()) {
    sceneRef.value.style.opacity = '1'
    return
  }

  entranceAnimation = animate(sceneRef.value, {
    opacity: [0, 1],
    scale: [0.75, 1],
    duration: 500,
    ease: 'out(3)',
  })

  idleAnimation = animate(blockRef.value, {
    rotateX: [-18, -10, -18],
    rotateY: [12, 24, 12],
    duration: 4800,
    ease: 'inOut(2)',
    loop: true,
  })
}

watch(isCompact, () => {
  nextTick(() => startMarkMotion())
})

onMounted(() => {
  nextTick(() => {
    startMarkMotion()
  })
})

onBeforeUnmount(() => {
  pauseAnimations([idleAnimation, entranceAnimation])
})
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

.logo-scene {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  perspective: 420px;
}

.logo-block {
  position: relative;
  width: 92%;
  height: 82%;
  transform-style: preserve-3d;
  transform: rotateX(-16deg) rotateY(18deg);
  will-change: transform;
}

.logo-mark.is-mark .logo-block {
  width: 86%;
  height: 86%;
}

.logo-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  font-weight: 700;
  font-size: 0.46em;
  line-height: 1;
  letter-spacing: -0.035em;
  border-radius: 0.2em;
  background: color-mix(in oklab, var(--color-accent) 78%, black);
  color: color-mix(in oklab, var(--color-accent) 40%, black);
  user-select: none;
  backface-visibility: hidden;
  padding: 0 0.22em;
  white-space: nowrap;
}

.logo-mark.is-mark .logo-layer {
  /* Keep the glyph inside the tile at small sizes (guide modal ~28px). */
  font-size: 0.72em;
  letter-spacing: -0.04em;
  border-radius: 22%;
  padding: 0;
  /* Optical center for capital P */
  padding-bottom: 0.04em;
}

.logo-layer.is-face {
  color: var(--color-ink-inverse);
  background: linear-gradient(155deg, var(--color-accent-hover), var(--color-accent));
  box-shadow:
    0 1px 0 color-mix(in oklab, var(--color-ink) 16%, transparent),
    0 8px 16px color-mix(in oklab, var(--color-accent) 28%, transparent);
}
</style>
