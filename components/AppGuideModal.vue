<template>
  <PanelModal
    :model-value="modelValue"
    max-width-class="max-w-lg"
    max-height-class="max-h-[85vh]"
    header-class="p-6 pb-0"
    body-class="p-6 space-y-6"
    overlay-scroll
    show-scroll-hint
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <img class="logo-img" src="/progethod.svg" width="28" height="28" alt="Progethod">
        <h2 class="text-lg font-bold text-ink">Progethod</h2>
        <span class="text-xs text-ink-faint font-mono">v2.0</span>
      </div>
    </template>

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
  </PanelModal>
</template>

<script setup>
import {
  IconBookmark, IconCalendarTime, IconAlertTriangle,
  IconSend, IconKeyboard, IconDatabaseExport, IconTag,
  IconPlug, IconMapPin, IconPalette,
} from '@tabler/icons-vue'

defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>
