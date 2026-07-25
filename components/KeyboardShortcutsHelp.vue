<template>
  <PanelModal
    :model-value="visible"
    :title="$t('keyboard_shortcuts.title')"
    max-width-class="max-w-md"
    body-class="space-y-4 px-6 pb-6"
    overlay-scroll
    show-scroll-hint
    @update:model-value="visible = $event"
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
  </PanelModal>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

const eventBus = useEventBus()
const visible = ref(false)

function toggle() {
  visible.value = !visible.value
}

onMounted(() => {
  eventBus.on('shortcut:show-help', toggle)
})

onBeforeUnmount(() => {
  eventBus.off('shortcut:show-help', toggle)
})
</script>
