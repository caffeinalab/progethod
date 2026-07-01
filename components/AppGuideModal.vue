<template>
  <transition name="fade">
    <div v-if="value" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" @click.self="close">
      <div class="fixed inset-0 bg-black bg-opacity-40" @click="close" />
      <div class="relative bg-card rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] min-h-0 flex flex-col my-auto">
        <div class="flex items-center justify-between p-6 pb-0">
          <div class="flex items-center gap-2">
            <img class="logo-img" src="/progethod.svg" width="28" height="28" alt="Progethod">
            <h2 class="text-lg font-bold text-ink">
              Progethod
            </h2>
            <span class="text-xs text-ink-faint font-mono">v1.0</span>
          </div>
          <button class="text-ink-faint hover:text-ink-secondary p-1" @click="close">
            <x-icon size="20" />
          </button>
        </div>

        <div ref="scrollArea" class="overflow-y-auto p-6 space-y-6" @scroll="onScroll">
          <!-- Intro -->
          <p class="text-sm text-ink-secondary">
            {{ $t('guide.intro') }}
          </p>

          <!-- Local Projects -->
          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <bookmark-icon size="16" class="text-accent" />
              {{ $t('guide.local_projects_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">
              {{ $t('guide.local_projects_desc') }}
            </p>
            <ul class="text-sm text-ink-secondary space-y-1 ml-4 list-disc">
              <li>{{ $t('guide.local_projects_1') }}</li>
              <li>{{ $t('guide.local_projects_2') }}</li>
              <li>{{ $t('guide.local_projects_3') }}</li>
              <li>{{ $t('guide.local_projects_4') }}</li>
            </ul>
          </section>

          <!-- Magic Tags -->
          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <calendar-time-icon size="16" class="text-accent" />
              {{ $t('guide.magic_tags_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">
              {{ $t('guide.magic_tags_desc') }}
            </p>
          </section>

          <!-- Wethod conversion -->
          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <alert-triangle-icon size="16" class="text-warning" />
              {{ $t('guide.wethod_conversion_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">
              {{ $t('guide.wethod_conversion_desc') }}
            </p>
            <div class="bg-warning-soft border border-warning rounded-lg p-3 text-xs text-warning-text">
              <p class="font-semibold mb-1">
                {{ $t('guide.wethod_conversion_example_title') }}
              </p>
              <p>
                {{ $t('guide.wethod_conversion_example') }}
              </p>
            </div>
          </section>

          <!-- Submission -->
          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <send-icon size="16" class="text-accent" />
              {{ $t('guide.submission_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">
              {{ $t('guide.submission_desc') }}
            </p>
          </section>

          <!-- Keyboard shortcuts -->
          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <keyboard-icon size="16" class="text-accent" />
              {{ $t('guide.keyboard_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">
              {{ $t('guide.keyboard_desc') }}
            </p>
          </section>

          <!-- Presets -->
          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <tag-icon size="16" class="text-accent" />
              {{ $t('guide.presets_title') }}
            </h3>
            <p class="text-sm text-ink-secondary mb-2">
              {{ $t('guide.presets_desc') }}
            </p>
            <ul class="text-sm text-ink-secondary space-y-1 ml-4 list-disc">
              <li>{{ $t('guide.presets_1') }}</li>
              <li>{{ $t('guide.presets_2') }}</li>
              <li>{{ $t('guide.presets_3') }}</li>
            </ul>
          </section>

          <!-- Backup -->
          <section>
            <h3 class="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <database-export-icon size="16" class="text-accent" />
              {{ $t('guide.backup_title') }}
            </h3>
            <p class="text-sm text-ink-secondary">
              {{ $t('guide.backup_desc') }}
            </p>
          </section>

          <!-- Support -->
          <div class="border-t border-stroke-muted pt-4">
            <p class="text-xs text-ink-faint text-center">
              {{ $t('guide.support') }}
            </p>
          </div>
        </div>
        <div v-show="!scrolledToBottom" class="flex items-center justify-center py-2 border-t border-stroke-muted">
          <chevron-down-icon size="16" class="text-ink-disabled animate-bounce" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import {
  XIcon,
  BookmarkIcon,
  CalendarTimeIcon,
  AlertTriangleIcon,
  SendIcon,
  KeyboardIcon,
  DatabaseExportIcon,
  TagIcon,
  ChevronDownIcon
} from 'vue-tabler-icons'

export default {
  components: {
    XIcon,
    BookmarkIcon,
    CalendarTimeIcon,
    AlertTriangleIcon,
    SendIcon,
    KeyboardIcon,
    DatabaseExportIcon,
    TagIcon,
    ChevronDownIcon
  },
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({ scrolledToBottom: false }),
  watch: {
    value (isVisible) {
      if (isVisible) {
        this.$nextTick(() => this.checkScroll())
      } else {
        this.scrolledToBottom = false
      }
    }
  },
  methods: {
    close () {
      this.$emit('input', false)
    },
    onScroll () {
      this.checkScroll()
    },
    checkScroll () {
      const element = this.$refs.scrollArea
      if (!element) { return }
      const threshold = 4
      this.scrolledToBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
