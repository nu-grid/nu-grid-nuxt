import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    '../src/module',
    'nuxt-component-meta',
    'nuxt-og-image',
    (_, nuxt) => {
      nuxt.hook('components:dirs', (dirs) => {
        dirs.unshift({
          path: resolve('./app/components/content/examples'),
          pathPrefix: false,
          prefix: '',
          global: true,
        })
      })
    },
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  content: {
    build: {
      markdown: {
        highlight: {
          langs: [
            'bash',
            'ts',
            'typescript',
            'diff',
            'vue',
            'json',
            'yml',
            'css',
            'mdc',
            'blade',
            'edge',
          ],
        },
      },
    },
  },

  mdc: {
    highlight: {
      noApiRoute: false,
    },
  },

  alias: {
    '#nu-grid': resolve('../src/runtime'),
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
      autoSubfolderIndex: false,
    },
  },

  vite: {
    optimizeDeps: {
      // prevents reloading page when navigating between components
      include: [
        '@internationalized/date',
        '@nuxt/content/utils',
        '@tanstack/table-core',
        '@tanstack/vue-table',
        '@tanstack/vue-virtual',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/integrations/useFuse',
        '@vueuse/shared',
        'colortranslator',
        'embla-carousel-auto-height',
        'embla-carousel-auto-scroll',
        'embla-carousel-autoplay',
        'embla-carousel-class-names',
        'embla-carousel-fade',
        'embla-carousel-vue',
        'embla-carousel-wheel-gestures',
        'json5',
        'motion-v',
        'ohash',
        'ohash/utils',
        'prettier',
        'reka-ui',
        'reka-ui/namespaced',
        'scule',
        'shiki',
        'shiki-stream/vue',
        'shiki-transformer-color-highlight',
        'shiki/engine-javascript.mjs',
        'tailwind-variants',
        'tailwindcss/colors',
        'ufo',
        'vaul-vue',
        'zod',
      ],
    },
  },

  componentMeta: {
    transformers: [
      (component, code) => {
        // Simplify ui in slot prop types: `leading(props: { ui: Button['ui'] })` -> `leading(props: { ui: object })`
        code = code.replace(/ui:[^}]+(?=\})/g, 'ui: object')

        return { component, code }
      },
    ],
    exclude: [
      '@nuxt/content',
      '@nuxt/icon',
      '@nuxt/image',
      '@nuxtjs/color-mode',
      '@nuxtjs/mdc',
      '@nuxtjs/plausible',
      'nuxt/dist',
      'nuxt-og-image',
      resolve('./app/components'),
    ],
    metaFields: {
      type: false,
      props: true,
      slots: 'no-schema',
      events: 'no-schema',
      exposed: false,
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },

  icon: {
    provider: 'iconify',
  },
})
