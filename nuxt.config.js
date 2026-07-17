export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'progethod',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ],
    script: [
      {
        src: 'https://apis.google.com/js/api.js',
        async: true,
        defer: true
      },
      {
        src: 'https://accounts.google.com/gsi/client',
        async: true,
        defer: true
      }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '~/assets/css/theme.css',
    '~/assets/postcss/vue-tagsinput',
    '~/assets/postcss/checkbox'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/vuex-persist', ssr: false },
    { src: '~/plugins/axios', ssr: false },
    { src: '~/plugins/projects-sync.js', ssr: false },
    { src: '~/plugins/presets-sync.js', ssr: false },
    { src: '~/plugins/keyboard-shortcuts.js', ssr: false },
    { src: '~/plugins/theme.js', ssr: false },
    ...(process.env.NODE_ENV === 'development' ? [{ src: '~/plugins/dev-bypass-auth.js', ssr: false }] : [])
  ],

  router: {
    middleware: ['updateApi']
  },

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/tailwindcss',
    '@nuxtjs/date-fns'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    '@nuxtjs/i18n'
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: process.env.NODE_ENV === 'development' ? `${process.env.CF_PAGES_URL}/api/` : '/api/'
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en'
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    cache: true,
    parallel: true,
    hardSource: true,
    transpile: [
      'yocto-queue'
    ],
    extend (config, { isClient, loaders: { vue } }) {
      if (isClient) {
        vue.transformAssetUrls.video = ['src', 'poster']
      }
    }
  },

  i18n: {
    locales: [
      { code: 'it', iso: 'it-IT', file: 'it.json' }
    ],
    defaultLocale: 'it',
    langDir: '~/locales/',
    vueI18n: {
      fallbackLocale: 'it'
    }
  },
  dateFns: {
    locales: [
      'it'
    ],
    defaultLocale: 'it',
    fallbackLocale: 'it',
    methods: [
      'format', 'addDays', 'addWeeks', 'addMonths', 'startOfWeek', 'intervalToDuration'
    ]
  },
  tailwindcss: {},
  env: {
    apiBaseUrl: `${process.env.CF_PAGES_URL || 'http://localhost:3000'}/api/`,
    feUrl: `${process.env.CF_PAGES_URL || 'http://localhost:3000'}/`,
    feHost: (new URL(process.env.CF_PAGES_URL || 'http://localhost:3000')).host,
    loginHost: process.env.LOGIN_HOST,
    loginExtensionUrl: process.env.LOGIN_EXTENSION_URL,
    instructionVideoUrl: process.env.INSTRUCTION_VIDEO_URL,
    gCalApiKey: process.env.GCAL_API_KEY,
    gCalClientId: process.env.GCAL_CLIENT_ID,
    jiraClientId: process.env.JIRA_CLIENT_ID,
    gitlabClientId: process.env.GITLAB_CLIENT_ID
  }
}
