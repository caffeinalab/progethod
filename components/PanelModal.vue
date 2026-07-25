<template>
  <Transition name="panel-fade">
    <div
      v-if="modelValue"
      data-modal-overlay
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      :class="overlayScroll ? 'overflow-y-auto' : ''"
      @click.self="close"
    >
      <div class="fixed inset-0 bg-black/40" @click="close" />
      <div
        class="relative bg-card rounded-xl shadow-2xl w-full min-h-0 flex flex-col"
        :class="[
          maxWidthClass,
          maxHeightClass,
          overlayScroll ? 'my-auto' : '',
          cardClass,
        ]"
      >
        <div class="flex items-center justify-between" :class="headerClass">
          <div class="min-w-0 flex-1">
            <slot name="title">
              <h2 v-if="title" :class="titleClass">{{ title }}</h2>
            </slot>
          </div>
          <button type="button" class="text-ink-faint hover:text-ink-secondary p-1 shrink-0" @click="close">
            <IconX :size="20" />
          </button>
        </div>

        <div v-if="$slots.toolbar" :class="toolbarClass">
          <slot name="toolbar" />
        </div>

        <div
          ref="scrollArea"
          class="min-h-0 flex-1 overflow-y-auto custom-scrollbar"
          :class="bodyClass"
          @scroll="onScroll"
        >
          <slot :scroll-area="scrollArea" />
        </div>

        <div v-if="showScrollHint && !scrolledToBottom" class="flex items-center justify-center py-2 border-t border-stroke-muted">
          <IconChevronDown :size="16" class="text-ink-disabled animate-bounce" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { IconX, IconChevronDown } from '@tabler/icons-vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  /** Tailwind max-width class, e.g. max-w-md / max-w-lg */
  maxWidthClass?: string
  /** Tailwind max-height class, e.g. max-h-[80vh] / max-h-[85vh] */
  maxHeightClass?: string
  headerClass?: string
  titleClass?: string
  toolbarClass?: string
  bodyClass?: string
  cardClass?: string
  /** Allow the overlay itself to scroll (taller panels). */
  overlayScroll?: boolean
  lockBodyScroll?: boolean
  showScrollHint?: boolean
}>(), {
  maxWidthClass: 'max-w-lg',
  maxHeightClass: 'max-h-[85vh]',
  headerClass: 'px-6 pt-6 pb-4',
  titleClass: 'text-lg font-bold text-ink',
  toolbarClass: '',
  bodyClass: '',
  cardClass: '',
  overlayScroll: false,
  lockBodyScroll: false,
  showScrollHint: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const scrollArea = ref<HTMLElement | null>(null)
const scrolledToBottom = ref(false)

function close() {
  emit('update:modelValue', false)
}

useModalKeyboard({
  isOpen: () => props.modelValue,
  onDismiss: close,
})

function checkScroll() {
  const element = scrollArea.value
  if (!element) return
  scrolledToBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < 4
}

function onScroll() {
  if (props.showScrollHint) checkScroll()
}

watch(() => props.modelValue, (open) => {
  if (props.lockBodyScroll) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
  if (open && props.showScrollHint) {
    nextTick(() => checkScroll())
  } else {
    scrolledToBottom.value = false
  }
})

onBeforeUnmount(() => {
  if (props.lockBodyScroll) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.15s ease;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
</style>
