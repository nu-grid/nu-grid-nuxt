import {
  addComponentsDir,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {
  /**
   * Prefix for NuGrid components
   * @default 'NuGrid'
   */
  prefix?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nu-grid/nuxt',
    configKey: 'nuGrid',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    prefix: 'NuGrid',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const runtimeDir = resolver.resolve('./runtime')

    // Add runtime aliases for types and utilities
    nuxt.options.alias['#nu-grid'] = runtimeDir
    nuxt.options.alias['#nu-grid/types'] = resolver.resolve('./runtime/types')
    nuxt.options.alias['#nu-grid/types/*'] = resolver.resolve('./runtime/types/*')
    nuxt.options.alias['#nu-grid/composables'] = resolver.resolve('./runtime/composables')
    nuxt.options.alias['#nu-grid/composables/*'] = resolver.resolve('./runtime/composables/*')
    nuxt.options.alias['#nu-grid/cell-types'] = resolver.resolve('./runtime/cell-types')
    nuxt.options.alias['#nu-grid/cell-types/*'] = resolver.resolve('./runtime/cell-types/*')
    nuxt.options.alias['#nu-grid/config'] = resolver.resolve('./runtime/config')
    nuxt.options.alias['#nu-grid/config/*'] = resolver.resolve('./runtime/config/*')
    nuxt.options.alias['#nu-grid/cells'] = resolver.resolve('./runtime/types/cells')

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Auto-import only PUBLIC composables (not _internal/)
    // These are the composables intended for end-user consumption
    addImports([
      {
        name: 'useNuGridCellEditor',
        from: resolver.resolve('runtime/composables/useNuGridCellEditor'),
      },
      {
        name: 'useNuGridCellTypeRegistry',
        from: resolver.resolve('runtime/composables/useNuGridCellTypeRegistry'),
      },
      {
        name: 'nuGridCellTypeRegistry',
        from: resolver.resolve('runtime/composables/useNuGridCellTypeRegistry'),
      },
    ])

    // Auto-register components
    addComponentsDir({
      path: resolver.resolve('runtime/components'),
      prefix: options.prefix,
    })

    // Auto-register cell-type components
    addComponentsDir({
      path: resolver.resolve('runtime/cell-types'),
      prefix: options.prefix,
      pathPrefix: false,
    })
  },
})
