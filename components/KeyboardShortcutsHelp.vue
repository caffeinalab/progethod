<template>
  <transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="close">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="close" />
      <div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800">
            {{ $t('keyboard_shortcuts.title') }}
          </h2>
          <button class="text-gray-400 hover:text-gray-600 p-1" @click="close">
            <x-icon size="20" />
          </button>
        </div>

        <div class="space-y-4">
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
              <shortcut-row keys="c" :label="$t('keyboard_shortcuts.import_gcal')" />
              <shortcut-row keys="↓ (in notes)" :label="$t('keyboard_shortcuts.enter_pills')" />
              <shortcut-row keys="←/→ (in pills)" :label="$t('keyboard_shortcuts.navigate_pills')" />
              <shortcut-row keys="Ctrl+Enter" :label="$t('keyboard_shortcuts.submit_day')" />
              <shortcut-row keys="Ctrl+⌫" :label="$t('keyboard_shortcuts.nuke_day')" />
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
      </div>
    </div>
  </transition>
</template>

<script>
import { XIcon } from 'vue-tabler-icons'
import ShortcutRow from './ShortcutRow'

export default {
  components: { XIcon, ShortcutRow },
  data: () => ({ visible: false }),
  mounted () {
    this.$nuxt.$on('shortcut:show-help', this.toggle)
  },
  beforeDestroy () {
    this.$nuxt.$off('shortcut:show-help', this.toggle)
  },
  methods: {
    toggle () {
      this.visible = !this.visible
    },
    close () {
      this.visible = false
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
