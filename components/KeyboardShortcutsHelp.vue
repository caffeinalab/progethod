<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" @click.self="close">
      <div class="fixed inset-0 bg-black/40" @click="close" />
      <div class="relative bg-card rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] min-h-0 flex flex-col my-auto">
        <div class="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 class="text-lg font-bold text-ink">
            {{ $t('keyboard_shortcuts.title') }}
          </h2>
          <button class="text-ink-faint hover:text-ink-secondary p-1" @click="close">
            <IconX :size="20" />
          </button>
        </div>

        <div
          ref="scrollArea"
          class="scroll-area space-y-4 overflow-y-auto custom-scrollbar px-6 pb-6"
          @scroll="onScroll"
        >
          <section>
            <h3 class="text-xs font-bold text-ink-faint uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.navigation') }}
            </h3>
            <div class="space-y-1">
              <ShortcutRow keys="←/→" :label="$t('keyboard_shortcuts.week_nav')" />
              <ShortcutRow keys="↑/↓" :label="$t('keyboard_shortcuts.day_nav')" />
              <ShortcutRow keys="Enter" :label="$t('keyboard_shortcuts.enter_day')" />
              <ShortcutRow keys="Esc" :label="$t('keyboard_shortcuts.exit_day')" />
              <ShortcutRow keys="w" :label="$t('keyboard_shortcuts.current_week')" />
              <ShortcutRow keys="t" :label="$t('keyboard_shortcuts.go_timesheet')" />
              <ShortcutRow keys="p" :label="$t('keyboard_shortcuts.go_projects')" />
              <ShortcutRow keys="s" :label="$t('keyboard_shortcuts.go_presets')" />
              <ShortcutRow keys="c" :label="$t('keyboard_shortcuts.go_calendar')" />
            </div>
          </section>

          <section>
            <h3 class="text-xs font-bold text-ink-faint uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.actions') }}
            </h3>
            <div class="space-y-1">
              <ShortcutRow keys="n" :label="$t('keyboard_shortcuts.add_entry')" />
              <ShortcutRow keys="↓ (in notes)" :label="$t('keyboard_shortcuts.enter_presets')" />
              <ShortcutRow keys="←/→ (in presets)" :label="$t('keyboard_shortcuts.navigate_presets')" />
              <ShortcutRow keys="Ctrl+Enter" :label="$t('keyboard_shortcuts.submit_day')" />
              <ShortcutRow keys="Ctrl+⌫" :label="$t('keyboard_shortcuts.nuke_day')" />
            </div>
          </section>

          <section>
            <h3 class="text-xs font-bold text-ink-faint uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.integrations') }}
            </h3>
            <div class="space-y-1">
              <ShortcutRow keys="Ctrl+I » c" :label="$t('keyboard_shortcuts.import_gcal')" />
              <ShortcutRow keys="Ctrl+I » j" :label="$t('keyboard_shortcuts.import_jira')" />
              <ShortcutRow keys="Ctrl+I » g" :label="$t('keyboard_shortcuts.import_gitlab')" />
            </div>
          </section>

          <section>
            <h3 class="text-xs font-bold text-ink-faint uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.other') }}
            </h3>
            <div class="space-y-1">
              <ShortcutRow keys="?" :label="$t('keyboard_shortcuts.show_help')" />
            </div>
          </section>
        </div>
        <div v-show="!scrolledToBottom" class="flex items-center justify-center py-2 border-t border-stroke-muted">
          <IconChevronDown :size="16" class="text-ink-disabled animate-bounce" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { IconX, IconChevronDown } from '@tabler/icons-vue'

const { t: $t } = useI18n()
const eventBus = useEventBus()

const visible = ref(false)
const scrolledToBottom = ref(false)
const scrollArea = ref(null)

function toggle() {
  visible.value = !visible.value
}

function close() {
  visible.value = false
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

watch(visible, (isVisible) => {
  if (isVisible) {
    nextTick(() => checkScroll())
  } else {
    scrolledToBottom.value = false
  }
})

onMounted(() => {
  eventBus.on('shortcut:show-help', toggle)
})

onBeforeUnmount(() => {
  eventBus.off('shortcut:show-help', toggle)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
