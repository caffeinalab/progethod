export default ({ store }) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  function resolveEffectiveTheme (theme) {
    if (theme === 'auto') {
      return mediaQuery.matches ? 'dark' : 'light'
    }
    return theme
  }

  function applyTheme () {
    const theme = store.getters['preferences/theme']
    const highContrast = store.getters['preferences/highContrast']
    const effective = resolveEffectiveTheme(theme)

    document.documentElement.classList.toggle('dark', effective === 'dark')
    document.documentElement.classList.toggle('high-contrast', highContrast)
  }

  applyTheme()

  mediaQuery.addEventListener('change', () => {
    if (store.getters['preferences/theme'] === 'auto') {
      applyTheme()
    }
  })

  store.subscribe((mutation) => {
    if (mutation.type === 'preferences/setTheme' || mutation.type === 'preferences/setHighContrast') {
      applyTheme()
    }
  })
}
