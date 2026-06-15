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
  safelist: [
    // Alert.vue — dynamically constructed via `bg-${color}-*`
    'bg-red-500',
    'bg-red-200',
    'text-red-500',
    'bg-yellow-500',
    'bg-yellow-200',
    'text-yellow-500',
    // LocationInput.vue — home (amber)
    'text-amber-700',
    'bg-amber-100',
    'dark:bg-amber-900',
    'dark:text-amber-300',
    'hover:text-amber-600',
    'dark:hover:text-amber-400',
    'hover:bg-amber-50',
    // LocationInput.vue — office (blue)
    'text-blue-700',
    'bg-blue-100',
    'dark:bg-blue-900',
    'dark:text-blue-300',
    'hover:text-blue-600',
    'dark:hover:text-blue-400',
    'hover:bg-blue-50',
    // MonthCalendar.vue
    'bg-green-200',
    'text-green-800',
    'border-green-300',
    'bg-amber-200',
    'text-amber-800',
    'border-amber-300',
    // DayInputItem.vue — tracked badge
    'bg-green-100',
    'text-green-700',
    'bg-amber-100',
    'text-amber-700',
    // AppGuideModal.vue
    'text-amber-500',
    'bg-amber-50',
    'border-amber-200'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
