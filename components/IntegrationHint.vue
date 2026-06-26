<template>
  <transition name="hint-fade">
    <div v-if="visible" class="fixed bottom-6 right-6 z-50">
      <div class="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 text-sm min-w-[160px]">
        <span class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {{ $t('keyboard_shortcuts.integration_hint_label') }}
        </span>
        <div class="space-y-1.5">
          <div v-for="item in integrations" :key="item.key" class="flex items-center gap-2.5">
            <kbd class="inline-flex items-center justify-center w-6 h-6 text-xs font-mono font-semibold bg-gray-700 border border-gray-600 rounded shadow-sm">
              {{ item.key }}
            </kbd>
            <span class="text-gray-300">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  data: () => ({ visible: false }),
  computed: {
    integrations () {
      return [
        { key: 'c', label: 'Calendar' },
        { key: 'j', label: 'Jira' },
        { key: 'g', label: 'GitLab' }
      ]
    }
  },
  mounted () {
    this.$nuxt.$on('shortcut:integration-hint', this.setVisibility)
  },
  beforeDestroy () {
    this.$nuxt.$off('shortcut:integration-hint', this.setVisibility)
  },
  methods: {
    setVisibility (show) {
      this.visible = show
    }
  }
}
</script>

<style scoped>
.hint-fade-enter-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.hint-fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.hint-fade-enter,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
