import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const preferencesStore = usePreferencesStore()
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  function resolveEffectiveTheme(theme: string): string {
    if (theme === 'auto') {
      return mediaQuery.matches ? 'dark' : 'light'
    }
    return theme
  }

  function applyTheme() {
    const effective = resolveEffectiveTheme(preferencesStore.theme)
    const html = document.documentElement
    html.classList.toggle('dark', effective === 'dark')
    html.classList.toggle('high-contrast', preferencesStore.highContrast)
  }

  applyTheme()

  mediaQuery.addEventListener('change', () => {
    if (preferencesStore.theme === 'auto') {
      applyTheme()
    }
  })

  watch(
    () => [preferencesStore.theme, preferencesStore.highContrast],
    applyTheme,
  )
})
