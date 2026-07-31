<template>
  <div class="bg-page w-full h-full min-h-screen">
    <nav class="w-full mx-auto bg-card shadow fixed top-0 z-10">
      <div class="container px-6 justify-between h-16 flex items-center lg:items-stretch mx-auto">
        <div class="h-full flex items-center">
          <div class="mr-8 flex items-center">
            <LogoBrand id="logo" :size="40" aria-label="Home" />
          </div>

          <ul ref="navbarRef" class="pr-12 xl:flex items-center h-full hidden navbar relative">
            <li
              v-for="item in navItems"
              :key="item.to"
              class="h-full flex items-center"
            >
              <NuxtLink
                :to="item.to"
                class="nav-link h-full flex items-center text-sm tracking-normal mx-5 capitalize text-ink-secondary hover:text-accent-fg transition-colors duration-200"
                :class="{ 'nav-link-active text-accent-fg': isNavActive(item) }"
              >
                {{ $t(item.labelKey) }}
              </NuxtLink>
            </li>
            <span
              class="nav-indicator absolute bottom-0 left-0 h-0.5 bg-accent rounded-full pointer-events-none"
              :class="{ 'nav-indicator--animate': indicatorReady }"
              :style="indicatorStyle"
              aria-hidden="true"
            />
          </ul>
        </div>

        <div class="h-full xl:flex items-stretch justify-end hidden">
          <div class="h-full flex items-stretch border-l border-stroke-muted">
            <BusinessUnitFilter variant="nav" />
            <div class="relative h-full shrink-0 border-r border-stroke-muted">
              <button
                type="button"
                class="w-16 h-full flex items-center justify-center text-ink-secondary cursor-pointer hover:bg-card-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                :aria-expanded="showStatusDropdown"
                aria-haspopup="true"
                :title="sessionStatusTitle"
                :aria-label="sessionStatusTitle"
                @click.stop="toggleStatusDropdown"
              >
                <IconLoader
                  v-if="apiDataStore.isUpdating"
                  :size="20"
                  class="animate-spin"
                />
                <span
                  v-else
                  class="relative inline-flex items-center justify-center"
                >
                  <IconKey
                    :size="20"
                    :stroke-width="1.5"
                    :class="userStore.isTokenExpired ? 'text-danger' : 'text-ink-secondary'"
                  />
                  <span
                    class="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full border-2 border-card"
                    :class="userStore.isTokenExpired ? 'bg-danger' : 'bg-success'"
                    aria-hidden="true"
                  />
                </span>
              </button>
              <Transition name="profile-menu">
                <ul
                  v-if="showStatusDropdown"
                  class="profile-menu p-2 w-60 border border-stroke-muted bg-card absolute rounded-lg z-40 right-0 top-full mt-2 shadow-lg"
                  @click.stop
                >
                  <li
                    v-if="userStore.canMakeRequests"
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
                    :class="{ 'text-success hover:text-success': tokenCopied }"
                    @click="copyAuthToken()"
                  >
                    <IconCheck v-if="tokenCopied" :size="20" :stroke-width="1.5" />
                    <IconKey v-else :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ tokenCopied ? $t('auth_token_copied') : $t('copy_auth_token') }}</span>
                  </li>
                  <li
                    v-else
                    class="px-1 py-2 select-none"
                    role="status"
                  >
                    <p class="text-sm font-semibold text-danger">{{ $t('session_expired') }}</p>
                    <p class="text-xs text-ink-muted mt-1 leading-snug">{{ $t('session_expired_hint') }}</p>
                  </li>
                </ul>
              </Transition>
            </div>
            <div
              aria-haspopup="true"
              class="relative h-full shrink-0 flex items-center gap-2 px-4 cursor-pointer hover:bg-card-hover transition-colors"
              @click.stop="toggleProfileDropdown"
            >
              <Transition name="profile-menu">
                <ul
                  v-if="showDropdown"
                  class="profile-menu p-2 w-60 border border-stroke-muted bg-card absolute rounded-lg z-40 right-0 top-full mt-2 shadow-lg"
                >
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="showGuide = true"
                  >
                    <IconInfoCircle :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('guide_button') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="eventBus.emit('shortcut:show-help')"
                  >
                    <IconKeyboard :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('keyboard_shortcuts_button') }}</span>
                  </li>
                  <li class="border-t border-stroke-muted my-2" />
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="backup()"
                  >
                    <IconDatabaseExport :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ $t('backup') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    :class="{ 'opacity-50 pointer-events-none': isRestoring }"
                    @click="restore()"
                  >
                    <IconLoader v-if="isRestoring" :size="20" class="animate-spin" />
                    <IconDatabaseImport v-else :size="20" :stroke-width="1.5" />
                    <span class="ml-2">{{ isRestoring ? $t('restore_loading') : $t('restore') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
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
                        class="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        :class="preferencesStore.theme === option.value
                          ? 'bg-accent text-ink-inverse font-semibold'
                          : 'text-ink-muted hover:text-ink-secondary hover:bg-card-hover'"
                        @click.stop="preferencesStore.setTheme(option.value)"
                      >
                        <component :is="option.icon" :size="14" />
                        {{ option.label }}
                      </button>
                    </div>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal py-2 hover:text-accent-fg flex items-center justify-between focus:text-accent-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
                    @click.stop="preferencesStore.setHighContrast(!preferencesStore.highContrast)"
                  >
                    <span>{{ $t('high_contrast') }}</span>
                    <ToggleSwitch :model-value="preferencesStore.highContrast" />
                  </li>
                  <!-- A/B week layouts — temporary; remove with components/ab-week-layouts/ -->
                  <li class="py-2">
                    <span class="text-xs font-semibold text-ink-faint uppercase tracking-wider">{{ $t('week_layout_label') }}</span>
                    <div class="grid grid-cols-2 gap-1 mt-1.5">
                      <button
                        v-for="option in weekLayoutOptions"
                        :key="option.value"
                        type="button"
                        class="flex items-center justify-center py-1.5 text-xs rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        :class="preferencesStore.weekLayout === option.value
                          ? 'bg-accent text-ink-inverse font-semibold'
                          : 'text-ink-muted hover:text-ink-secondary hover:bg-card-hover'"
                        @click.stop="preferencesStore.setWeekLayout(option.value)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </li>
                  <li class="border-t border-stroke-muted my-2" />
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-normal tracking-normal py-2 hover:text-accent-fg flex items-center justify-between focus:text-accent-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
                    @click.stop="preferencesStore.setRequireSubmitConfirmation(!preferencesStore.isConfirmOnSubmitRequired)"
                  >
                    <span>{{ $t('require_confirm_on_submit_short') }}</span>
                    <ToggleSwitch :model-value="preferencesStore.isConfirmOnSubmitRequired" />
                  </li>
                </ul>
              </Transition>
              <img v-if="avatarUrl" class="rounded-full h-10 w-10 object-cover" :src="avatarUrl" alt="User avatar">
              <span v-else class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent text-ink-inverse text-sm font-bold select-none">{{ userInitials }}</span>
              <p class="text-ink text-sm whitespace-nowrap">
                {{ `${userStore.info.name} ${userStore.info.surname}` }}
              </p>
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
          <li v-for="item in navItems" :key="`mobile-${item.to}`">
            <NuxtLink
              :to="item.to"
              class="block py-2 capitalize transition-colors duration-200"
              :class="isNavActive(item) ? 'text-accent-fg font-semibold' : 'text-ink-secondary hover:text-accent-fg'"
              @click="showMobileMenu = false"
            >
              {{ $t(item.labelKey) }}
            </NuxtLink>
          </li>
          <li class="border-t border-stroke-muted my-2" />
          <li class="flex items-center gap-3 py-2">
            <img v-if="avatarUrl" class="rounded-full h-10 w-10 object-cover" :src="avatarUrl" alt="User avatar">
            <span v-else class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent text-ink-inverse text-sm font-bold select-none">{{ userInitials }}</span>
            <span class="text-ink text-sm">{{ `${userStore.info.name} ${userStore.info.surname}` }}</span>
          </li>
          <li v-if="userStore.businessUnitsEnabled" class="border-t border-stroke-muted my-2" />
          <li v-if="userStore.businessUnitsEnabled">
            <BusinessUnitFilter variant="menu" />
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
            <button
              class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg"
              :disabled="isRestoring"
              :class="{ 'opacity-50 cursor-not-allowed': isRestoring }"
              @click="restore(); showMobileMenu = false"
            >
              <IconLoader v-if="isRestoring" :size="20" class="animate-spin" />
              <IconDatabaseImport v-else :size="20" :stroke-width="1.5" />
              <span>{{ isRestoring ? $t('restore_loading') : $t('restore') }}</span>
            </button>
          </li>
          <li>
            <button class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg" @click="updateProjectsFromApi(); showMobileMenu = false">
              <IconRefresh :size="20" :stroke-width="1.5" />
              <span>{{ $t('update_projects') }}</span>
            </button>
          </li>
          <li v-if="userStore.canMakeRequests">
            <button
              class="w-full flex items-center gap-2 py-2 text-ink-secondary hover:text-accent-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
              :class="{ 'text-success hover:text-success': tokenCopied }"
              @click="copyAuthToken()"
            >
              <IconCheck v-if="tokenCopied" :size="20" :stroke-width="1.5" />
              <IconKey v-else :size="20" :stroke-width="1.5" />
              <span>{{ tokenCopied ? $t('auth_token_copied') : $t('copy_auth_token') }}</span>
            </button>
          </li>
          <li
            v-else
            class="py-2 select-none"
            role="status"
          >
            <p class="text-sm font-semibold text-danger">{{ $t('session_expired') }}</p>
            <p class="text-xs text-ink-muted mt-1 leading-snug">{{ $t('session_expired_hint') }}</p>
          </li>
          <li class="border-t border-stroke-muted my-2" />
          <li class="py-2">
            <span class="text-xs font-semibold text-ink-faint uppercase tracking-wider">{{ $t('theme_label') }}</span>
            <div class="flex items-center gap-1 mt-1.5">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                class="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                :class="preferencesStore.theme === option.value
                  ? 'bg-accent text-ink-inverse font-semibold'
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
              <ToggleSwitch :model-value="preferencesStore.highContrast" />
            </button>
          </li>
          <!-- A/B week layouts — temporary; remove with components/ab-week-layouts/ -->
          <li class="py-2">
            <span class="text-xs font-semibold text-ink-faint uppercase tracking-wider">{{ $t('week_layout_label') }}</span>
            <div class="grid grid-cols-2 gap-1 mt-1.5">
              <button
                v-for="option in weekLayoutOptions"
                :key="option.value"
                type="button"
                class="flex items-center justify-center py-1.5 text-xs rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                :class="preferencesStore.weekLayout === option.value
                  ? 'bg-accent text-ink-inverse font-semibold'
                  : 'text-ink-muted hover:text-ink-secondary hover:bg-card-hover'"
                @click.stop="preferencesStore.setWeekLayout(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </li>
          <li>
            <button
              class="w-full flex items-center justify-between py-2 text-ink-secondary hover:text-accent-fg"
              @click.stop="preferencesStore.setRequireSubmitConfirmation(!preferencesStore.isConfirmOnSubmitRequired)"
            >
              <span>{{ $t('require_confirm_on_submit_short') }}</span>
              <ToggleSwitch :model-value="preferencesStore.isConfirmOnSubmitRequired" />
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

    <div
      v-if="isRestoring"
      class="fixed inset-0 z-50 flex items-center justify-center bg-page/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <LoadingState :message="$t('restore_loading')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconCheck,
  IconDatabaseExport,
  IconDatabaseImport,
  IconDeviceDesktop,
  IconInfoCircle,
  IconKey,
  IconKeyboard,
  IconLoader,
  IconMenu,
  IconMoon,
  IconRefresh,
  IconSun,
} from '@tabler/icons-vue'
import { getBackupData, getBackupFile, triggerFileDownload, askForBackupFile, restoreBackup } from '~/utils/backupRestore'
import { copyToClipboard } from '~/utils/clipboard'
import { updateApiData } from '~/utils/updateApiData'
import { WEEK_LAYOUT_KEYS, type WeekLayoutKey } from '~/components/ab-week-layouts/types'

const { t } = useI18n()
const route = useRoute()
const userStore = useUserStore()
const apiDataStore = useApiDataStore()
const preferencesStore = usePreferencesStore()
const eventBus = useEventBus()

const showDropdown = ref(false)
const showStatusDropdown = ref(false)
const showGuide = ref(false)
const showMobileMenu = ref(false)
const isRestoring = ref(false)
const tokenCopied = ref(false)
let tokenCopiedTimeout: ReturnType<typeof setTimeout> | null = null

type NavItem = {
  to: string
  labelKey: string
  match: (path: string) => boolean
}

const navItems: NavItem[] = [
  { to: '/', labelKey: 'timesheet', match: path => path === '/' },
  { to: '/projects', labelKey: 'projects', match: path => path.startsWith('/projects') },
  { to: '/presets', labelKey: 'presets.nav', match: path => path.startsWith('/presets') },
  { to: '/ferie', labelKey: 'calendar_page.nav', match: path => path.startsWith('/ferie') },
]

function isNavActive(item: NavItem) {
  return item.match(route.path)
}

const navbarRef = ref<HTMLElement | null>(null)
const indicatorReady = ref(false)
const indicatorStyle = ref<Record<string, string>>({
  width: '0px',
  transform: 'translateX(0)',
  opacity: '0',
})

let navbarResizeObserver: ResizeObserver | null = null

function updateNavIndicator() {
  const navbar = navbarRef.value
  if (!navbar) return

  const activeLink = navbar.querySelector('.nav-link-active') as HTMLElement | null
  if (!activeLink) {
    indicatorStyle.value = {
      width: '0px',
      transform: 'translateX(0)',
      opacity: '0',
    }
    return
  }

  const navbarRect = navbar.getBoundingClientRect()
  const linkRect = activeLink.getBoundingClientRect()
  indicatorStyle.value = {
    width: `${linkRect.width}px`,
    transform: `translateX(${linkRect.left - navbarRect.left}px)`,
    opacity: '1',
  }
}

function scheduleNavIndicatorUpdate() {
  nextTick(() => {
    updateNavIndicator()
    if (!indicatorReady.value) {
      requestAnimationFrame(() => {
        indicatorReady.value = true
      })
    }
  })
}

watch(() => route.path, scheduleNavIndicatorUpdate)

const avatarUrl = computed(() => userStore.profilePicUrl || userStore.info.pic || null)
const userInitials = computed(() => {
  const first = (userStore.info.name || '')[0] || ''
  const last = (userStore.info.surname || '')[0] || ''
  return (first + last).toUpperCase() || '?'
})

const sessionStatusTitle = computed(() => {
  if (apiDataStore.isUpdating) return t('session_updating')
  if (userStore.isTokenExpired) return t('session_expired')
  return t('session_active')
})

const themeOptions = computed(() => [
  { value: 'auto' as const, label: 'Auto', icon: IconDeviceDesktop },
  { value: 'light' as const, label: t('theme_light'), icon: IconSun },
  { value: 'dark' as const, label: t('theme_dark'), icon: IconMoon },
])

// A/B week layouts — temporary; remove with components/ab-week-layouts/
const weekLayoutOptions = computed(() =>
  WEEK_LAYOUT_KEYS.map(key => ({
    value: key as WeekLayoutKey,
    label: t(`week_layout_${key}`),
  })),
)

function backup() {
  triggerFileDownload(getBackupFile(getBackupData()))
}

async function restore() {
  if (isRestoring.value) { return }

  const backupFile = await askForBackupFile()
  if (!backupFile) { return }

  isRestoring.value = true
  showDropdown.value = false
  // Let the overlay paint before parse/hydrate work on the main thread.
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  try {
    await restoreBackup(backupFile)
  } catch (error) {
    console.error('Failed to restore backup:', error)
  } finally {
    isRestoring.value = false
  }
}

async function updateProjectsFromApi() {
  await updateApiData()
}

async function copyAuthToken() {
  const token = userStore.authToken
  if (!token || !userStore.canMakeRequests) return

  await copyToClipboard(token)
  tokenCopied.value = true
  if (tokenCopiedTimeout) clearTimeout(tokenCopiedTimeout)
  tokenCopiedTimeout = setTimeout(() => {
    tokenCopied.value = false
    tokenCopiedTimeout = null
  }, 1500)
}

function toggleStatusDropdown() {
  const willOpen = !showStatusDropdown.value
  showStatusDropdown.value = willOpen
  showDropdown.value = false
  if (willOpen) eventBus.emit('nav-menu:open', 'status')
}

function toggleProfileDropdown() {
  const willOpen = !showDropdown.value
  showDropdown.value = willOpen
  showStatusDropdown.value = false
  if (willOpen) eventBus.emit('nav-menu:open', 'profile')
}

function closeDropdowns() {
  showDropdown.value = false
  showStatusDropdown.value = false
}

function onNavMenuOpen(source: 'status' | 'bu' | 'profile') {
  if (source !== 'status') showStatusDropdown.value = false
  if (source !== 'profile') showDropdown.value = false
}

onMounted(() => {
  document.addEventListener('click', closeDropdowns)
  eventBus.on('nav-menu:open', onNavMenuOpen)
  scheduleNavIndicatorUpdate()
  window.addEventListener('resize', updateNavIndicator)

  if (navbarRef.value && typeof ResizeObserver !== 'undefined') {
    navbarResizeObserver = new ResizeObserver(() => updateNavIndicator())
    navbarResizeObserver.observe(navbarRef.value)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdowns)
  eventBus.off('nav-menu:open', onNavMenuOpen)
  window.removeEventListener('resize', updateNavIndicator)
  navbarResizeObserver?.disconnect()
  navbarResizeObserver = null
  if (tokenCopiedTimeout) clearTimeout(tokenCopiedTimeout)
})
</script>

<style>
  @reference "~/assets/css/tailwind.css";

  .nav-indicator {
    will-change: transform, width;
  }

  .nav-indicator--animate {
    transition:
      transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
      width 0.28s cubic-bezier(0.32, 0.72, 0, 1),
      opacity 0.2s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-indicator--animate {
      transition: none;
    }
  }

  .profile-menu {
    transform-origin: top right;
  }

  .profile-menu-enter-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .profile-menu-leave-active {
    transition: opacity 0.1s ease, transform 0.1s ease;
  }

  .profile-menu-enter-from,
  .profile-menu-leave-to {
    opacity: 0;
    transform: translateY(-4px) scale(0.96);
  }

  @media (prefers-reduced-motion: reduce) {
    .profile-menu-enter-active,
    .profile-menu-leave-active {
      transition: none;
    }
  }
</style>
