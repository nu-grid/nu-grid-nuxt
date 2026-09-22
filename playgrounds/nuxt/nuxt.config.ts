// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@vueuse/nuxt', '@nuxt/eslint', '../../src/module'],

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
        '@tanstack/vue-virtual',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'reka-ui',
        'tailwind-merge',
        'zod',
      ],
    },
  },
})
