import {
  addComponentsDir,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
  useLogger,
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

    // NuGrid's classes and row-animation keyframes must be inside the app's Tailwind entry, and
    // Tailwind skips node_modules when it scans for classes. Nuxt UI's stylesheet (`@import "@nuxt/ui"`)
    // pulls in its generated `ui.css` template, where it lists its own `@source`s; importing our
    // stylesheet from there puts NuGrid in whichever file is the Tailwind entry, including a design
    // system's own (e.g. a layer that owns the only entry), with nothing for the app to add.
    // Found after every module has set up, since Nuxt UI may register it after this module runs.
    const cssEntry = resolver.resolve('./runtime/index.css')
    nuxt.hook('modules:done', () => {
      const template = nuxt.options.build.templates.find((t) => t.filename === 'ui.css')
      if (!template?.getContents) {
        useLogger('nu-grid').warn(
          "Could not find Nuxt UI's ui.css template to register NuGrid's styles. Add `@import \"@nu-grid/nuxt/css\";` to your main Tailwind stylesheet, or grids will render partly unstyled.",
        )
        return
      }
      const original = template.getContents
      template.getContents = async (data) =>
        `@import ${JSON.stringify(cssEntry)};\n${await original(data)}`
    })

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
