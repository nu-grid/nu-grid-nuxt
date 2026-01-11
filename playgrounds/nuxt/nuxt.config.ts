// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@vueuse/nuxt', '../../src/module'],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  alias: {
    '#nu-grid': '../../src/runtime',
  },

  routeRules: {
    '/api/**': {
      cors: true,
    },
  },

  compatibilityDate: '2024-07-11',

  vite: {
    optimizeDeps: {
      include: [
        '@internationalized/date',
        '@nuxt/ui/runtime/utils/tv.js',
        '@nuxt/ui/utils/tv',
        '@tanstack/table-core',
        '@tanstack/vue-table',
        '@tanstack/vue-virtual',
        '@unovis/vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'date-fns',
        'reka-ui',
        'tailwind-merge',
        'zod',
      ],
    },
  },
})
