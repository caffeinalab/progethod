<template>
  <div class="bg-page w-full h-full min-h-screen">
    <nav class="w-full mx-auto bg-card shadow fixed top-0 z-10">
      <div class="container px-6 justify-between h-16 flex items-center lg:items-stretch mx-auto">
        <div class="h-full flex items-center">
          <div class="mr-10 flex items-center">
            <img
              id="logo"
              class="logo-img"
              aria-label="Home"
              height="44"
              width="43"
              src="/progethod.svg"
            >
            <h3 class="text-base text-ink font-bold tracking-normal leading-tight ml-3 hidden lg:block">
              Progethod
            </h3>
          </div>

          <ul class="pr-12 xl:flex items-center h-full hidden navbar">
            <NuxtLink to="/" class="h-full flex items-center">
              <li class="text-ink-secondary hover:text-accent-fg cursor-pointer h-full flex items-center text-sm tracking-normal mx-5 capitalize">
                {{ $t('timesheet') }}
              </li>
            </NuxtLink>
            <NuxtLink to="/projects" class="h-full flex items-center">
              <li class="text-ink-secondary hover:text-accent-fg cursor-pointer h-full flex items-center text-sm tracking-normal mx-5 capitalize">
                {{ $t('projects') }}
              </li>
            </NuxtLink>
            <NuxtLink to="/presets" class="h-full flex items-center">
              <li class="text-ink-secondary hover:text-accent-fg cursor-pointer h-full flex items-center text-sm tracking-normal mx-5 capitalize">
                {{ $t('presets.nav') }}
              </li>
            </NuxtLink>
            <NuxtLink to="/ferie" class="h-full flex items-center">
              <li class="text-ink-secondary hover:text-accent-fg cursor-pointer h-full flex items-center text-sm tracking-normal mx-5 capitalize">
                {{ $t('calendar_page.nav') }}
              </li>
            </NuxtLink>
          </ul>
        </div>

        <div class="h-full xl:flex items-center justify-end hidden">
          <div class="w-full h-full flex items-center">
            <div class="h-full flex items-center border-r border-stroke-muted px-4" />
            <div class="w-full h-full flex">
              <div class="w-32 h-full flex items-center justify-center border-r border-stroke-muted cursor-pointer text-ink-secondary">
                <IconLoader
                  v-if="apiDataStore.isUpdating"
                  :size="28"
                  class="animate-spin"
                />
                <IconCircleCheck
                  v-if="!apiDataStore.isUpdating && !userStore.isTokenExpired"
                  :size="28"
                  class="text-success"
                  :stroke-width="1.5"
                />
                <IconCircleX
                  v-if="!apiDataStore.isUpdating && userStore.isTokenExpired"
                  :size="28"
                  class="text-danger"
                  :stroke-width="1.5"
                />
              </div>
              <div aria-haspopup="true" class="w-full flex items-center justify-end relative" @click.stop="showDropdown = !showDropdown">
                <ul v-show="showDropdown" class="p-2 w-60 border border-stroke-muted bg-card absolute rounded-lg z-40 right-0 top-full mt-2 shadow-lg">
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="showGuide = true"
                  >
                    <IconInfoCircle :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('guide_button') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="eventBus.emit('shortcut:show-help')"
                  >
                    <IconKeyboard :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('keyboard_shortcuts_button') }}</span>
                  </li>
                  <li class="border-t border-stroke-muted my-2" />
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="backup()"
                  >
                    <IconDatabaseExport :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('backup') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="restore()"
                  >
                    <IconDatabaseImport :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('restore') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="updateProjectsFromApi()"
                  >
                    <IconRefresh :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('update_projects') }}</span>
                  </li>
                  <li class="border-t border-stroke-muted my-2" />
                  <li class="py-2">
                    <span class="text-xs font-semibold text-ink-faint uppercase tracking-wider">{{ $t('theme_label') }}</span>
                    <div class="flex items-center gap-1 mt-1.5">
                      <button
                        v-for="option in themeOptions"
                        :key="option.value"
                        class="flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded transition-colors"
                        :class="preferencesStore.theme === option.value
                          ? 'bg-accent-soft text-accent-fg font-semibold'
                          : 'text-ink-muted hover:text-ink-secondary hover:bg-card-hover'"
                        @click.stop="preferencesStore.setTheme(option.value)"
                      >
                        <component :is="option.icon" :size="14" />
                        {{ option.label }}
                      </button>
                    </div>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal py-2 hover:text-accent-fg flex items-center justify-between focus:text-accent-fg focus:outline-none"
                    @click.stop="preferencesStore.setHighContrast(!preferencesStore.highContrast)"
                  >
                    <span>{{ $t('high_contrast') }}</span>
                    <span
                      class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                      :class="preferencesStore.highContrast ? 'bg-accent-hover' : 'bg-ink-disabled'"
                    >
                      <span
                        class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                        :class="preferencesStore.highContrast ? 'translate-x-3' : 'translate-x-0'"
                      />
                    </span>
                  </li>
                  <li class="border-t border-stroke-muted my-2" />
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal py-2 hover:text-accent-fg flex items-center justify-between focus:text-accent-fg focus:outline-none"
                    @click.stop="preferencesStore.setRequireSubmitConfirmation(!preferencesStore.isConfirmOnSubmitRequired)"
                  >
                    <span>{{ $t('require_confirm_on_submit_short') }}</span>
                    <span
                      class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                      :class="preferencesStore.isConfirmOnSubmitRequired ? 'bg-accent-hover' : 'bg-ink-disabled'"
                    >
                      <span
                        class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                        :class="preferencesStore.isConfirmOnSubmitRequired ? 'translate-x-3' : 'translate-x-0'"
                      />
                    </span>
                  </li>
                </ul>
                <img v-if="avatarUrl" class="rounded-full h-10 w-10 object-cover cursor-pointer" :src="avatarUrl" alt="User avatar">
                <span v-else class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent text-ink-inverse text-sm font-bold cursor-pointer select-none">{{ userInitials }}</span>
                <p class="text-ink text-sm ml-2 cursor-pointer">
                  {{ `${userStore.info.name} ${userStore.info.surname}` }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="visible xl:hidden flex items-center">
          <button
            aria-haspopup="true"
            aria-label="Main Menu"
            class="text-ink"
            @click="showMobileMenu = !showMobileMenu"
          >
            <IconMenu :size="28" :stroke-width="1.5" />
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="showMobileMenu" class="xl:hidden border-t border-stroke-muted bg-card shadow-lg">
        <ul class="p-4 space-y-2">
          <li><NuxtLink to="/" class="block py-2 text-ink-secondary hover:text-accent-fg capitalize" @click="showMobileMenu = false">{{ $t('timesheet') }}</NuxtLink></li>
          <li><NuxtLink to="/projects" class="block py-2 text-ink-secondary hover:text-accent-fg capitalize" @click="showMobileMenu = false">{{ $t('projects') }}</NuxtLink></li>
          <li><NuxtLink to="/presets" class="block py-2 text-ink-secondary hover:text-accent-fg capitalize" @click="showMobileMenu = false">{{ $t('presets.nav') }}</NuxtLink></li>
          <li><NuxtLink to="/ferie" class="block py-2 text-ink-secondary hover:text-accent-fg capitalize" @click="showMobileMenu = false">{{ $t('calendar_page.nav') }}</NuxtLink></li>
          <li class="border-t border-stroke-muted my-2" />
          <li class="flex items-center gap-3 py-2">
            <img v-if="avatarUrl" class="rounded-full h-10 w-10 object-cover" :src="avatarUrl" alt="User avatar">
            <span v-else class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent text-ink-inverse text-sm font-bold select-none">{{ userInitials }}</span>
            <span class="text-ink text-sm">{{ `${userStore.info.name} ${userStore.info.surname}` }}</span>
          </li>
          <li class="border-t border-stroke-muted my-2" />
          <li>
            <button class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg" @click="showGuide = true; showMobileMenu = false">
              <IconInfoCircle :size="20" :stroke-width="1.5" />
              <span>{{ $t('guide_button') }}</span>
            </button>
          </li>
          <li>
            <button class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg" @click="eventBus.emit('shortcut:show-help'); showMobileMenu = false">
              <IconKeyboard :size="20" :stroke-width="1.5" />
              <span>{{ $t('keyboard_shortcuts_button') }}</span>
            </button>
          </li>
          <li class="border-t border-stroke-muted my-2" />
          <li>
            <button class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg" @click="backup(); showMobileMenu = false">
              <IconDatabaseExport :size="20" :stroke-width="1.5" />
              <span>{{ $t('backup') }}</span>
            </button>
          </li>
          <li>
            <button class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg" @click="restore(); showMobileMenu = false">
              <IconDatabaseImport :size="20" :stroke-width="1.5" />
              <span>{{ $t('restore') }}</span>
            </button>
          </li>
          <li>
            <button class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg" @click="updateProjectsFromApi(); showMobileMenu = false">
              <IconRefresh :size="20" :stroke-width="1.5" />
              <span>{{ $t('update_projects') }}</span>
            </button>
          </li>
          <li class="border-t border-stroke-muted my-2" />
          <li class="py-2">
            <span class="text-xs font-semibold text-ink-faint uppercase tracking-wider">{{ $t('theme_label') }}</span>
            <div class="flex items-center gap-1 mt-1.5">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                class="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded transition-colors"
                :class="preferencesStore.theme === option.value
                  ? 'bg-accent-soft text-accent-fg font-semibold'
                  : 'text-ink-muted hover:text-ink-secondary hover:bg-card-hover'"
                @click.stop="preferencesStore.setTheme(option.value)"
              >
                <component :is="option.icon" :size="14" />
                {{ option.label }}
              </button>
            </div>
          </li>
          <li>
            <button
              class="w-full flex items-center justify-between py-2 text-ink-secondary hover:text-accent-fg"
              @click.stop="preferencesStore.setHighContrast(!preferencesStore.highContrast)"
            >
              <span>{{ $t('high_contrast') }}</span>
              <span
                class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                :class="preferencesStore.highContrast ? 'bg-accent-hover' : 'bg-ink-disabled'"
              >
                <span
                  class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                  :class="preferencesStore.highContrast ? 'translate-x-3' : 'translate-x-0'"
                />
              </span>
            </button>
          </li>
          <li>
            <button
              class="w-full flex items-center justify-between py-2 text-ink-secondary hover:text-accent-fg"
              @click.stop="preferencesStore.setRequireSubmitConfirmation(!preferencesStore.isConfirmOnSubmitRequired)"
            >
              <span>{{ $t('require_confirm_on_submit_short') }}</span>
              <span
                class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                :class="preferencesStore.isConfirmOnSubmitRequired ? 'bg-accent-hover' : 'bg-ink-disabled'"
              >
                <span
                  class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                  :class="preferencesStore.isConfirmOnSubmitRequired ? 'translate-x-3' : 'translate-x-0'"
                />
              </span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <slot />
    <DevAuthBar />
    <KeyboardShortcutsHelp />
    <IntegrationHint />
    <AppGuideModal v-model="showGuide" />
  </div>
</template>

<script setup lang="ts">
import {
  IconCircleCheck,
  IconCircleX,
  IconDatabaseExport,
  IconDatabaseImport,
  IconDeviceDesktop,
  IconInfoCircle,
  IconKeyboard,
  IconLoader,
  IconMenu,
  IconMoon,
  IconRefresh,
  IconSun,
} from '@tabler/icons-vue'
import { getBackupData, getBackupFile, triggerFileDownload, askForBackupFile, restoreBackup } from '~/utils/backupRestore'
import { updateApiData } from '~/utils/updateApiData'

const { t } = useI18n()
const userStore = useUserStore()
const apiDataStore = useApiDataStore()
const preferencesStore = usePreferencesStore()
const eventBus = useEventBus()

const showDropdown = ref(false)
const showGuide = ref(false)
const showMobileMenu = ref(false)

const avatarUrl = computed(() => userStore.profilePicUrl || userStore.info.pic || null)
const userInitials = computed(() => {
  const first = (userStore.info.name || '')[0] || ''
  const last = (userStore.info.surname || '')[0] || ''
  return (first + last).toUpperCase() || '?'
})

const themeOptions = computed(() => [
  { value: 'auto' as const, label: 'Auto', icon: IconDeviceDesktop },
  { value: 'light' as const, label: t('theme_light'), icon: IconSun },
  { value: 'dark' as const, label: t('theme_dark'), icon: IconMoon },
])

function backup() {
  triggerFileDownload(getBackupFile(getBackupData()))
}

async function restore() {
  const backupFile = await askForBackupFile()
  if (backupFile) {
    await restoreBackup(backupFile)
  }
}

async function updateProjectsFromApi() {
  await updateApiData()
}

function closeDropdown() {
  showDropdown.value = false
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style>
  @reference "~/assets/css/tailwind.css";
  .navbar > .router-link-exact-active {
    @apply border-b-2 border-accent text-accent-fg;
  }

  .toggle-track {
    width: 1.75rem;
    height: 1rem;
    padding: 0.125rem;
  }

  .toggle-knob {
    width: 0.75rem;
    height: 0.75rem;
  }

  .dark .logo-img {
    filter: brightness(2.5);
  }
</style>
