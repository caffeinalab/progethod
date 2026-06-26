<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" @click.self="close">
      <div class="fixed inset-0 bg-black bg-opacity-40" @click="close" />
      <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] min-h-0 flex flex-col my-auto">
        <div class="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 class="text-lg font-bold text-gray-800">
            {{ $t('keyboard_shortcuts.title') }}
          </h2>
          <button class="text-gray-400 hover:text-gray-600 p-1" @click="close">
            <x-icon size="20" />
          </button>
        </div>

        <div
          ref="scrollArea"
          class="scroll-area space-y-4 overflow-y-auto px-6 pb-6"
          @scroll="onScroll"
        >
          <section>
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.navigation') }}
            </h3>
            <div class="space-y-1">
              <shortcut-row keys="←/→" :label="$t('keyboard_shortcuts.week_nav')" />
              <shortcut-row keys="↑/↓" :label="$t('keyboard_shortcuts.day_nav')" />
              <shortcut-row keys="Enter" :label="$t('keyboard_shortcuts.enter_day')" />
              <shortcut-row keys="Esc" :label="$t('keyboard_shortcuts.exit_day')" />
              <shortcut-row keys="w" :label="$t('keyboard_shortcuts.current_week')" />
              <shortcut-row keys="t" :label="$t('keyboard_shortcuts.go_timesheet')" />
              <shortcut-row keys="p" :label="$t('keyboard_shortcuts.go_projects')" />
              <shortcut-row keys="s" :label="$t('keyboard_shortcuts.go_pills')" />
            </div>
          </section>

          <section>
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.actions') }}
            </h3>
            <div class="space-y-1">
              <shortcut-row keys="n" :label="$t('keyboard_shortcuts.add_entry')" />
              <shortcut-row keys="↓ (in notes)" :label="$t('keyboard_shortcuts.enter_pills')" />
              <shortcut-row keys="←/→ (in pills)" :label="$t('keyboard_shortcuts.navigate_pills')" />
              <shortcut-row keys="Ctrl+Enter" :label="$t('keyboard_shortcuts.submit_day')" />
              <shortcut-row keys="Ctrl+⌫" :label="$t('keyboard_shortcuts.nuke_day')" />
            </div>
          </section>

          <section>
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.integrations') }}
            </h3>
            <div class="space-y-1">
              <shortcut-row keys="Ctrl+I » c" :label="$t('keyboard_shortcuts.import_gcal')" />
              <shortcut-row keys="Ctrl+I » j" :label="$t('keyboard_shortcuts.import_jira')" />
              <shortcut-row keys="Ctrl+I » g" :label="$t('keyboard_shortcuts.import_gitlab')" />
            </div>
          </section>

          <section>
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {{ $t('keyboard_shortcuts.other') }}
            </h3>
            <div class="space-y-1">
              <shortcut-row keys="?" :label="$t('keyboard_shortcuts.show_help')" />
            </div>
          </section>
        </div>
        <div v-show="!scrolledToBottom" class="flex items-center justify-center py-2 border-t border-gray-100">
          <chevron-down-icon size="16" class="text-gray-300 animate-bounce" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { XIcon, ChevronDownIcon } from 'vue-tabler-icons'
import ShortcutRow from './ShortcutRow'

export default {
  components: { XIcon, ChevronDownIcon, ShortcutRow },
  data: () => ({ visible: false, scrolledToBottom: false }),
  mounted () {
    this.$nuxt.$on('shortcut:show-help', this.toggle)
  },
  beforeDestroy () {
    this.$nuxt.$off('shortcut:show-help', this.toggle)
  },
  watch: {
    visible (isVisible) {
      if (isVisible) {
        this.$nextTick(() => this.checkScroll())
      } else {
        this.scrolledToBottom = false
      }
    }
  },
  methods: {
    toggle () {
      this.visible = !this.visible
    },
    close () {
      this.visible = false
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
