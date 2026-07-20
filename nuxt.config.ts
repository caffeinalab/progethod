import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  ssr: false,

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap' },
      ],
      script: [
        { src: 'https://apis.google.com/js/api.js', async: true, defer: true },
        { src: 'https://accounts.google.com/gsi/client', async: true, defer: true },
      ],
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
  ],

  css: [
    '~/assets/css/tailwind.css',
    '~/assets/css/theme.css',
    '~/assets/postcss/vue-tagsinput.pcss',
    '~/assets/postcss/checkbox.pcss',
  ],

  i18n: {
    locales: [
      { code: 'it', file: 'it.json' },
    ],
    defaultLocale: 'it',
    lazy: true,
    langDir: '../locales/',
    bundle: {
      strictMessage: false,
      dropMessageCompiler: false,
      optimizeTranslationDirective: false,
    },
    compilation: {
      strictMessage: false,
    },
  },

  pwa: {
    manifest: {
      lang: 'it',
      name: 'Progethod',
      short_name: 'Progethod',
    },
    workbox: {
      navigateFallback: '/200.html',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      skipWaiting: true,
      clientsClaim: true,
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.CF_PAGES_URL
        ? `${process.env.CF_PAGES_URL}/api/`
        : 'http://localhost:3000/api/',
      feUrl: process.env.CF_PAGES_URL || 'http://localhost:3000/',
      feHost: (() => {
        try { return new URL(process.env.CF_PAGES_URL || 'http://localhost:3000').host }
        catch { return 'localhost:3000' }
      })(),
      loginHost: process.env.LOGIN_HOST || '',
      loginExtensionUrl: process.env.LOGIN_EXTENSION_URL || '',
      instructionVideoUrl: process.env.INSTRUCTION_VIDEO_URL || '',
      gCalApiKey: process.env.GCAL_API_KEY || '',
      gCalClientId: process.env.GCAL_CLIENT_ID || '',
      jiraClientId: process.env.JIRA_CLIENT_ID || '',
      gitlabClientId: process.env.GITLAB_CLIENT_ID || '',
    },
  },

  nitro: {
    preset: 'static',
  },

  devServer: {
    port: 3000,
  },

  sourcemap: { client: true },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['date-fns', 'mitt', 'uuid', 'short-unique-id'],
    },
    server: {
      proxy: {
        '/api/': {
          target: 'http://localhost:8788',
          changeOrigin: true,
        },
      },
    },
  },

  compatibilityDate: '2025-07-15',
})
