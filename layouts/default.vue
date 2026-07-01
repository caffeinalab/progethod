<template>
  <div class="bg-page w-full h-full min-h-screen">
    <!-- Navigation starts -->
    <nav class="w-full mx-auto bg-card shadow fixed top-0 z-10">
      <div class="container px-6 justify-between h-16 flex items-center lg:items-stretch mx-auto">
        <div class="h-full flex items-center">
          <div class="mr-10 flex items-center">
            <img
              id="logo"
              class="logo-img"
              aria-label="Home"
              enable-background="new 0 0 300 300"
              height="44"
              viewBox="0 0 300 300"
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
          </ul>
        </div>

        <div class="h-full xl:flex items-center justify-end hidden">
          <div class="w-full h-full flex items-center">
            <div class="w-full pr-12 h-full flex items-center border-r border-stroke-muted">
              <div class="invisible relative w-full">
                <div class="text-ink-muted absolute ml-3 inset-0 m-auto w-4 h-4">
                  <search-icon
                    class="icon icon-tabler icon-tabler-search"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </div>
                <input class="border border-stroke-muted focus:outline-none focus:border-accent w-56 rounded text-sm text-ink-muted bg-card-hover pl-8 py-2" type="text" placeholder="Search">
              </div>
            </div>
            <div class="w-full h-full flex">
              <div class="w-32 h-full flex items-center justify-center border-r border-stroke-muted cursor-pointer text-ink-secondary">
                <loader-icon
                  v-if="isUpdating"
                  width="28"
                  height="28"
                  class="animate-spin"
                />
                <circle-check-icon
                  v-if="!isUpdating && !isTokenExpired"
                  width="28"
                  height="28"
                  class="text-success"
                  stroke-width="1.5"
                />
                <circle-x-icon
                  v-if="!isUpdating && isTokenExpired"
                  width="28"
                  height="28"
                  class="text-danger"
                  stroke-width="1.5"
                />
              </div>
              <div aria-haspopup="true" class="w-full flex items-center justify-end relative" @click.stop="dropdownHandler($event)">
                <ul v-show="showDropdown" class="p-2 w-60 border border-stroke-muted bg-card absolute rounded z-40 right-0 top-full mt-2 shadow-lg">
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="showGuide = true"
                  >
                    <info-circle-icon width="20" height="20" stroke-width="1.5" />
                    <span class="ml-2">{{ $t('guide_button') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="$nuxt.$emit('shortcut:show-help')"
                  >
                    <keyboard-icon width="20" height="20" stroke-width="1.5" />
                    <span class="ml-2">{{ $t('keyboard_shortcuts_button') }}</span>
                  </li>
                  <li class="border-t border-stroke-muted my-2" />
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="backup()"
                  >
                    <database-export-icon width="20" height="20" stroke-width="1.5" />
                    <span class="ml-2">{{ $t('backup') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="restore()"
                  >
                    <database-import-icon width="20" height="20" stroke-width="1.5" />
                    <span class="ml-2">{{ $t('restore') }}</span>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none"
                    @click="updateProjects()"
                  >
                    <refresh-icon width="20" height="20" stroke-width="1.5" />
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
                        :class="currentTheme === option.value
                          ? 'bg-accent-soft text-accent-fg font-semibold'
                          : 'text-ink-muted hover:text-ink-secondary hover:bg-card-hover'"
                        @click.stop="setTheme(option.value)"
                      >
                        <component :is="option.icon" width="14" height="14" />
                        {{ option.label }}
                      </button>
                    </div>
                  </li>
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal py-2 hover:text-accent-fg flex items-center justify-between focus:text-accent-fg focus:outline-none"
                    @click.stop="toggleHighContrast"
                  >
                    <span>{{ $t('high_contrast') }}</span>
                    <span
                      class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                      :class="highContrast ? 'bg-accent-hover' : 'bg-ink-disabled'"
                    >
                      <span
                        class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                        :class="highContrast ? 'translate-x-3' : 'translate-x-0'"
                      />
                    </span>
                  </li>
                  <li class="border-t border-stroke-muted my-2" />
                  <li
                    class="cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal py-2 hover:text-accent-fg flex items-center justify-between focus:text-accent-fg focus:outline-none"
                    @click.stop="toggleConfirmOnSubmit"
                  >
                    <span>{{ $t('require_confirm_on_submit_short') }}</span>
                    <span
                      class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                      :class="isConfirmOnSubmitRequired ? 'bg-accent-hover' : 'bg-ink-disabled'"
                    >
                      <span
                        class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                        :class="isConfirmOnSubmitRequired ? 'translate-x-3' : 'translate-x-0'"
                      />
                    </span>
                  </li>
                </ul>
                <img v-if="userInfo.pic" class="rounded h-10 w-10 object-cover cursor-pointer" :src="userInfo.pic" alt="User avatar">
                <span v-else class="inline-flex items-center justify-center h-10 w-10 rounded bg-accent text-ink-inverse text-sm font-bold cursor-pointer select-none">{{ userInitials }}</span>
                <p class="text-ink text-sm ml-2 cursor-pointer">
                  {{ `${userInfo.name} ${userInfo.surname}` }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="visible xl:hidden flex items-center">
          <ul class="z-40 p-2 border-r border-stroke-muted bg-card absolute rounded top-0 left-0 right-0 shadow mt-16 md:mt-16 hidden">
            <NuxtLink to="/" class="h-full flex items-center">
              <li class="flex xl:hidden cursor-pointer text-ink-secondary text-base leading-3 tracking-normal mt-2 py-3 hover:text-accent-fg focus:text-accent-fg focus:outline-none capitalize">
                <div class="flex items-center">
                  <span class="leading-6 ml-2 font-bold"> {{ $t('timesheet') }} </span>
                </div>
              </li>
            </NuxtLink>
            <NuxtLink to="/projects" class="h-full flex items-center">
              <li class="flex xl:hidden cursor-pointer text-ink-secondary text-base leading-3 tracking-normal mt-2 py-3 hover:text-accent-fg focus:text-accent-fg focus:outline-none capitalize">
                <div class="flex items-center">
                  <span class="leading-6 ml-2 font-bold"> {{ $t('projects') }} </span>
                </div>
              </li>
            </NuxtLink>
            <NuxtLink to="/presets" class="h-full flex items-center">
              <li class="flex xl:hidden cursor-pointer text-ink-secondary text-base leading-3 tracking-normal mt-2 py-3 hover:text-accent-fg focus:text-accent-fg focus:outline-none capitalize">
                <div class="flex items-center">
                  <span class="leading-6 ml-2 font-bold"> {{ $t('presets.nav') }} </span>
                </div>
              </li>
            </NuxtLink>
            <li>
              <hr class="border-b border-stroke w-full">
            </li>
            <li class="ml-2 cursor-pointer text-ink-secondary text-sm leading-3 tracking-normal mt-2 py-2 hover:text-accent-fg flex items-center focus:text-accent-fg focus:outline-none">
              <div class="flex items-center">
                <div class="w-12 cursor-pointer flex text-sm border-2 border-transparent rounded focus:outline-none focus:border-white transition duration-150 ease-in-out">
                  <img v-if="userInfo.pic" class="rounded h-10 w-10 object-cover" :src="userInfo.pic" alt="User avatar">
                  <span v-else class="inline-flex items-center justify-center h-10 w-10 rounded bg-accent text-ink-inverse text-sm font-bold select-none">{{ userInitials }}</span>
                </div>
                <p class="leading-6 text-base ml-1 cursor-pointer">
                  {{ `${userInfo.name} ${userInfo.surname}` }}
                </p>
                <div class="sm:ml-2 text-ink-inverse relative">
                  <chevron-down-icon
                    class="icon icon-tabler icon-tabler-chevron-down cursor-pointer"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </div>
              </div>
            </li>
            <li class="ml-2 text-ink-disabled text-base leading-3 tracking-normal py-2 focus:outline-none">
              <div class="flex items-center">
                <user-icon
                  class="icon icon-tabler icon-tabler-user"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <span class="leading-6 ml-2">Profile</span>
              </div>
            </li>
            <li
              class="ml-2 cursor-pointer text-ink-secondary text-base leading-3 tracking-normal py-2 hover:text-accent-fg focus:text-accent-fg focus:outline-none"
              @click="showGuide = true"
            >
              <div class="flex items-center">
                <info-circle-icon width="24" height="24" stroke-width="1.5" />
                <span class="leading-6 ml-2">{{ $t('guide_button') }}</span>
              </div>
            </li>
            <li
              class="ml-2 cursor-pointer text-ink-secondary text-base leading-3 tracking-normal py-2 hover:text-accent-fg focus:text-accent-fg focus:outline-none"
              @click="$nuxt.$emit('shortcut:show-help')"
            >
              <div class="flex items-center">
                <keyboard-icon width="24" height="24" stroke-width="1.5" />
                <span class="leading-6 ml-2">{{ $t('keyboard_shortcuts_button') }}</span>
              </div>
            </li>
            <li class="border-t border-stroke-muted my-2 ml-2" />
            <li
              class="ml-2 cursor-pointer text-ink-secondary text-base leading-3 tracking-normal py-2 hover:text-accent-fg focus:text-accent-fg focus:outline-none"
              @click="backup()"
            >
              <div class="flex items-center">
                <database-export-icon width="24" height="24" stroke-width="1.5" />
                <span class="leading-6 ml-2">{{ $t('backup') }}</span>
              </div>
            </li>
            <li
              class="ml-2 cursor-pointer text-ink-secondary text-base leading-3 tracking-normal py-2 hover:text-accent-fg focus:text-accent-fg focus:outline-none"
              @click="restore()"
            >
              <div class="flex items-center">
                <database-import-icon width="24" height="24" stroke-width="1.5" />
                <span class="leading-6 ml-2">{{ $t('restore') }}</span>
              </div>
            </li>
            <li
              class="ml-2 cursor-pointer text-ink-secondary text-base leading-3 tracking-normal py-2 hover:text-accent-fg focus:text-accent-fg focus:outline-none"
              @click="updateProjects()"
            >
              <div class="flex items-center">
                <refresh-icon width="24" height="24" stroke-width="1.5" />
                <span class="leading-6 ml-2">{{ $t('update_projects') }}</span>
              </div>
            </li>
            <li class="border-t border-stroke-muted my-2 ml-2" />
            <li class="ml-2 mr-2 py-2">
              <span class="text-xs font-semibold text-ink-faint uppercase tracking-wider">{{ $t('theme_label') }}</span>
              <div class="flex items-center gap-1 mt-1.5">
                <button
                  v-for="option in themeOptions"
                  :key="'m-' + option.value"
                  class="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
                  :class="currentTheme === option.value
                    ? 'bg-accent-soft text-accent-fg font-semibold'
                    : 'text-ink-muted hover:text-ink-secondary hover:bg-card-hover'"
                  @click.stop="setTheme(option.value)"
                >
                  <component :is="option.icon" width="14" height="14" />
                  {{ option.label }}
                </button>
              </div>
            </li>
            <li
              class="ml-2 mr-2 cursor-pointer text-ink-secondary text-base leading-3 tracking-normal py-2 hover:text-accent-fg focus:text-accent-fg focus:outline-none"
              @click.stop="toggleHighContrast"
            >
              <div class="flex items-center justify-between">
                <span class="leading-6">{{ $t('high_contrast') }}</span>
                <span
                  class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                  :class="highContrast ? 'bg-accent-hover' : 'bg-ink-disabled'"
                >
                  <span
                    class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                    :class="highContrast ? 'translate-x-3' : 'translate-x-0'"
                  />
                </span>
              </div>
            </li>
            <li
              class="ml-2 mr-2 cursor-pointer text-ink-secondary text-base leading-3 tracking-normal py-2 hover:text-accent-fg focus:text-accent-fg focus:outline-none"
              @click.stop="toggleConfirmOnSubmit"
            >
              <div class="flex items-center justify-between">
                <span class="leading-6">{{ $t('require_confirm_on_submit_short') }}</span>
                <span
                  class="toggle-track relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200"
                  :class="isConfirmOnSubmitRequired ? 'bg-accent-hover' : 'bg-ink-disabled'"
                >
                  <span
                    class="toggle-knob inline-block rounded-full bg-card shadow transform transition-transform duration-200"
                    :class="isConfirmOnSubmitRequired ? 'translate-x-3' : 'translate-x-0'"
                  />
                </span>
              </div>
            </li>
          </ul>

          <menu-icon
            aria-haspopup="true"
            aria-label="Main Menu"
            class="show-m-menu icon icon-tabler icon-tabler-menu text-ink"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            @click="MenuHandler($event, true)"
          />
          <div class="hidden close-m-menu text-ink" @click="MenuHandler($event, false)">
            <svg
              aria-label="Close"
              :xmlns="xmlns"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>
      </div>
    </nav>
    <!-- Navigation ends -->
    <Nuxt />
    <keyboard-shortcuts-help />
    <integration-hint />
    <app-guide-modal v-model="showGuide" />
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  DatabaseExportIcon,
  DatabaseImportIcon,
  DeviceDesktopIcon,
  InfoCircleIcon,
  KeyboardIcon,
  MenuIcon,
  MoonIcon,
  LoaderIcon,
  RefreshIcon,
  SearchIcon,
  SunIcon,
  UserIcon
} from 'vue-tabler-icons'
import { getBackupData, getBackupFile, triggerFileDownload, askForBackupFile, restoreBackup } from '~/utils/backupRestore'
import { updateApiData } from '~/utils/updateApiData'

export default {
  components: {
    ChevronDownIcon,
    CircleCheckIcon,
    CircleXIcon,
    DatabaseExportIcon,
    DatabaseImportIcon,
    DeviceDesktopIcon,
    InfoCircleIcon,
    KeyboardIcon,
    LoaderIcon,
    MenuIcon,
    MoonIcon,
    RefreshIcon,
    SearchIcon,
    SunIcon,
    UserIcon
  },
  data () {
    return {
      xmlns: 'http://www.w3.org/2000/svg',
      xlink: 'http://www.w3.org/1999/xlink',
      showDropdown: false,
      showGuide: false
    }
  },
  computed: {
    ...mapGetters({
      userInfo: 'user/info',
      isUpdating: 'apiData/isUpdating',
      isTokenExpired: 'user/isTokenExpired',
      isConfirmOnSubmitRequired: 'preferences/isConfirmOnSubmitRequired',
      currentTheme: 'preferences/theme',
      highContrast: 'preferences/highContrast'
    }),
    userInitials () {
      const first = (this.userInfo.name || '')[0] || ''
      const last = (this.userInfo.surname || '')[0] || ''
      return (first + last).toUpperCase() || '?'
    },
    themeOptions () {
      return [
        { value: 'auto', label: 'Auto', icon: 'DeviceDesktopIcon' },
        { value: 'light', label: this.$t('theme_light'), icon: 'SunIcon' },
        { value: 'dark', label: this.$t('theme_dark'), icon: 'MoonIcon' }
      ]
    }
  },
  mounted () {
    document.addEventListener('click', this.closeDropdown)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.closeDropdown)
  },
  methods: {
    dropdownHandler () {
      this.showDropdown = !this.showDropdown
    },
    closeDropdown () {
      this.showDropdown = false
    },
    MenuHandler (el, val) {
      const MainList = el.currentTarget.parentElement.getElementsByTagName('ul')[0]
      const closeIcon = el.currentTarget.parentElement.getElementsByClassName('close-m-menu')[0]
      const showIcon = el.currentTarget.parentElement.getElementsByClassName('show-m-menu')[0]
      if (val) {
        MainList.classList.remove('hidden')
        el.currentTarget.classList.add('hidden')
        closeIcon.classList.remove('hidden')
      } else {
        showIcon.classList.remove('hidden')
        MainList.classList.add('hidden')
        el.currentTarget.classList.add('hidden')
      }
    },
    backup () {
      triggerFileDownload(getBackupFile(getBackupData(this.$store)))
    },
    async restore () {
      const backupFile = await askForBackupFile()
      if (backupFile) {
        await restoreBackup(backupFile, this.$store)
      }
    },
    async updateProjects () {
      await updateApiData(this.$axios, this.$store)
    },
    toggleConfirmOnSubmit () {
      this.setRequireSubmitConfirmation(!this.isConfirmOnSubmitRequired)
    },
    toggleHighContrast () {
      this.setHighContrastMutation(!this.highContrast)
    },
    ...mapMutations({
      setRequireSubmitConfirmation: 'preferences/setRequireSubmitConfirmation',
      setTheme: 'preferences/setTheme',
      setHighContrastMutation: 'preferences/setHighContrast'
    })
  }
}
</script>

<style lang="postcss">
  .navbar > .nuxt-link-exact-active {
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
