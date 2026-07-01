/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.js'
  ],
  safelist: [],
  theme: {
    extend: {
      colors: {
        page: 'var(--color-page)',
        card: {
          DEFAULT: 'var(--color-card)',
          dim: 'var(--color-card-dim)',
          hover: 'var(--color-card-hover)'
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          secondary: 'var(--color-ink-secondary)',
          muted: 'var(--color-ink-muted)',
          faint: 'var(--color-ink-faint)',
          disabled: 'var(--color-ink-disabled)',
          inverse: 'var(--color-ink-inverse)'
        },
        stroke: {
          DEFAULT: 'var(--color-stroke)',
          muted: 'var(--color-stroke-muted)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          soft: 'var(--color-accent-soft)',
          fg: 'var(--color-accent-fg)'
        },
        'focus-ring': 'var(--color-focus-ring)',
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
          text: 'var(--color-success-text)'
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
          text: 'var(--color-warning-text)'
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft: 'var(--color-danger-soft)',
          text: 'var(--color-danger-text)'
        }
      }
    }
  },
  plugins: []
}
