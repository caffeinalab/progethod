<template>
  <transition name="fade">
    <div v-if="value" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="close">
      <div class="absolute inset-0 bg-black bg-opacity-40" @click="close" />
      <div class="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between p-6 pb-0">
          <div class="flex items-center gap-2">
            <img src="/progethod.svg" width="28" height="28" alt="Progethod">
            <h2 class="text-lg font-bold text-gray-800">
              Progethod
            </h2>
            <span class="text-xs text-gray-400 font-mono">v1.0</span>
          </div>
          <button class="text-gray-400 hover:text-gray-600 p-1" @click="close">
            <x-icon size="20" />
          </button>
        </div>

        <div class="overflow-y-auto p-6 space-y-6">
          <!-- Intro -->
          <p class="text-sm text-gray-600">
            {{ $t('guide.intro') }}
          </p>

          <!-- Local Projects -->
          <section>
            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <bookmark-icon size="16" class="text-indigo-500" />
              {{ $t('guide.local_projects_title') }}
            </h3>
            <p class="text-sm text-gray-600 mb-2">
              {{ $t('guide.local_projects_desc') }}
            </p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>{{ $t('guide.local_projects_1') }}</li>
              <li>{{ $t('guide.local_projects_2') }}</li>
              <li>{{ $t('guide.local_projects_3') }}</li>
              <li>{{ $t('guide.local_projects_4') }}</li>
            </ul>
          </section>

          <!-- Magic Tags -->
          <section>
            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <calendar-time-icon size="16" class="text-indigo-500" />
              {{ $t('guide.magic_tags_title') }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ $t('guide.magic_tags_desc') }}
            </p>
          </section>

          <!-- Wethod conversion -->
          <section>
            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <alert-triangle-icon size="16" class="text-amber-500" />
              {{ $t('guide.wethod_conversion_title') }}
            </h3>
            <p class="text-sm text-gray-600 mb-2">
              {{ $t('guide.wethod_conversion_desc') }}
            </p>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
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
            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <send-icon size="16" class="text-indigo-500" />
              {{ $t('guide.submission_title') }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ $t('guide.submission_desc') }}
            </p>
          </section>

          <!-- Keyboard shortcuts -->
          <section>
            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <keyboard-icon size="16" class="text-indigo-500" />
              {{ $t('guide.keyboard_title') }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ $t('guide.keyboard_desc') }}
            </p>
          </section>

          <!-- Backup -->
          <section>
            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <database-export-icon size="16" class="text-indigo-500" />
              {{ $t('guide.backup_title') }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ $t('guide.backup_desc') }}
            </p>
          </section>

          <!-- Support -->
          <div class="border-t border-gray-200 pt-4">
            <p class="text-xs text-gray-400 text-center">
              {{ $t('guide.support') }}
              <a href="mailto:devops@caffeina.com" class="text-indigo-500 hover:underline">devops@caffeina.com</a>
            </p>
          </div>
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
  DatabaseExportIcon
} from 'vue-tabler-icons'

export default {
  components: {
    XIcon,
    BookmarkIcon,
    CalendarTimeIcon,
    AlertTriangleIcon,
    SendIcon,
    KeyboardIcon,
    DatabaseExportIcon
  },
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    close () {
      this.$emit('input', false)
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
