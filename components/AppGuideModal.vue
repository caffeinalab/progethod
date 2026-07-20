<template>
  <Transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" @click.self="close">
      <div class="fixed inset-0 bg-black/40" @click="close" />
      <div class="relative bg-card rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] min-h-0 flex flex-col my-auto">
        <div class="flex items-center justify-between p-6 pb-0">
          <div class="flex items-center gap-2">
            <img class="logo-img" src="/progethod.svg" width="28" height="28" alt="Progethod">
            <h2 class="text-lg font-bold text-ink">Progethod</h2>
            <span class="text-xs text-ink-faint font-mono">v2.0</span>
          </div>
          <button class="text-ink-faint hover:text-ink-secondary p-1" @click="close">
            <IconX :size="20" />
          </button>
        </div>

        <div ref="scrollArea" class="overflow-y-auto custom-scrollbar p-6 space-y-6" @scroll="onScroll">
          <p class="text-sm text-ink-secondary">{{ $t('guide.intro') }}</p>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconBookmark :size="16" class="text-accent" />
              {{ $t('guide.local_projects_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">{{ $t('guide.local_projects_desc') }}</p>
            <ul class="text-sm text-ink-secondary space-y-1 ml-4 list-disc">
              <li>{{ $t('guide.local_projects_1') }}</li>
              <li>{{ $t('guide.local_projects_2') }}</li>
              <li>{{ $t('guide.local_projects_3') }}</li>
              <li>{{ $t('guide.local_projects_4') }}</li>
            </ul>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconCalendarTime :size="16" class="text-accent" />
              {{ $t('guide.magic_tags_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">{{ $t('guide.magic_tags_desc') }}</p>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconAlertTriangle :size="16" class="text-warning" />
              {{ $t('guide.wethod_conversion_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">{{ $t('guide.wethod_conversion_desc') }}</p>
            <div class="bg-warning-soft border border-warning rounded-lg p-3 text-xs text-warning-text">
              <p class="font-semibold mb-1">{{ $t('guide.wethod_conversion_example_title') }}</p>
              <p>{{ $t('guide.wethod_conversion_example') }}</p>
            </div>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconSend :size="16" class="text-accent" />
              {{ $t('guide.submission_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">{{ $t('guide.submission_desc') }}</p>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconKeyboard :size="16" class="text-accent" />
              {{ $t('guide.keyboard_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">{{ $t('guide.keyboard_desc') }}</p>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconTag :size="16" class="text-accent" />
              {{ $t('guide.presets_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">{{ $t('guide.presets_desc') }}</p>
            <ul class="text-sm text-ink-secondary space-y-1 ml-4 list-disc">
              <li>{{ $t('guide.presets_1') }}</li>
              <li>{{ $t('guide.presets_2') }}</li>
              <li>{{ $t('guide.presets_3') }}</li>
            </ul>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconPlug :size="16" class="text-accent" />
              {{ $t('guide.integrations_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">{{ $t('guide.integrations_desc') }}</p>
            <ul class="text-sm text-ink-secondary space-y-1 ml-4 list-disc">
              <li>{{ $t('guide.integrations_1') }}</li>
              <li>{{ $t('guide.integrations_2') }}</li>
              <li>{{ $t('guide.integrations_3') }}</li>
              <li>{{ $t('guide.integrations_4') }}</li>
            </ul>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconMapPin :size="16" class="text-accent" />
              {{ $t('guide.location_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">{{ $t('guide.location_desc') }}</p>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconPalette :size="16" class="text-accent" />
              {{ $t('guide.theme_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">{{ $t('guide.theme_desc') }}</p>
            <ul class="text-sm text-ink-secondary space-y-1 ml-4 list-disc">
              <li>{{ $t('guide.theme_1') }}</li>
              <li>{{ $t('guide.theme_2') }}</li>
            </ul>
          </section>

          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <IconDatabaseExport :size="16" class="text-accent" />
              {{ $t('guide.backup_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">{{ $t('guide.backup_desc') }}</p>
          </section>

          <div class="border-t border-stroke-muted pt-4">
            <p class="text-xs text-ink-faint text-center">{{ $t('guide.support') }}</p>
          </div>
        </div>
        <div v-show="!scrolledToBottom" class="flex items-center justify-center py-2 border-t border-stroke-muted">
          <IconChevronDown :size="16" class="text-ink-disabled animate-bounce" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import {
  IconX, IconBookmark, IconCalendarTime, IconAlertTriangle,
  IconSend, IconKeyboard, IconDatabaseExport, IconTag,
  IconPlug, IconMapPin, IconPalette, IconChevronDown,
} from '@tabler/icons-vue'

const { t: $t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const scrolledToBottom = ref(false)
const scrollArea = ref(null)

function close() {
  emit('update:modelValue', false)
}

function onScroll() {
  checkScroll()
}

function checkScroll() {
  const element = scrollArea.value
  if (!element) return
  const threshold = 4
  scrolledToBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < threshold
}

watch(() => props.modelValue, (isVisible) => {
  if (isVisible) {
    nextTick(() => checkScroll())
  } else {
    scrolledToBottom.value = false
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
