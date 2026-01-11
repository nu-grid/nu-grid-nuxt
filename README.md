<p align="center">
  <img src="nu-grid-logo.svg" alt="NuGrid Logo" width="400" />
</p>

<h1 align="center">NuGrid</h1>

<p align="center">
  <a href="https://npmjs.com/package/@nu-grid/nuxt"><img src="https://img.shields.io/npm/v/@nu-grid/nuxt/latest.svg?style=flat&colorA=020420&colorB=00DC82" alt="npm version"></a>
  <a href="https://npm.chart.dev/@nu-grid/nuxt"><img src="https://img.shields.io/npm/dm/@nu-grid/nuxt.svg?style=flat&colorA=020420&colorB=00DC82" alt="npm downloads"></a>
  <a href="https://npmjs.com/package/@nu-grid/nuxt"><img src="https://img.shields.io/npm/l/@nu-grid/nuxt.svg?style=flat&colorA=020420&colorB=00DC82" alt="License"></a>
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js" alt="Nuxt"></a>
</p>

A powerful, feature-rich data grid component for Nuxt applications with virtualization, inline editing, and TanStack Table integration.

- [Release Notes](/CHANGELOG.md)
- [Demos](https://www.nug-rid.dev/demos)
- [Documentation](https://www.nu-grid.dev)

## Features

- **High Performance** - Virtualized rendering handles thousands of rows smoothly
- **Inline Editing** - Edit cells directly with built-in validation support
- **Row Grouping** - Group data by columns with expandable/collapsible groups
- **Keyboard Navigation** - Excel-like navigation and editing experience
- **Theming** - Full customization with Nuxt UI design system integration
- **TanStack Table** - Built on TanStack Table for sorting, filtering, and pagination

### Built-in Cell Types

- Text & Textarea
- Number & Currency
- Date (with date picker)
- Boolean (checkbox)
- Selection (dropdown)
- Rating (star rating)
- Lookup (autocomplete/search)
- Action Menu

### Additional Capabilities

- Column resizing, pinning, and reordering
- Row selection (single and multi-select)
- Excel export
- State persistence (save/restore column widths, sorting, filters)
- Custom cell type support
- Comprehensive event system

## Installation

```bash
# Using pnpm
pnpm add @nu-grid/nuxt @nuxt/ui @vueuse/nuxt

# Using npm
npm install @nu-grid/nuxt @nuxt/ui @vueuse/nuxt

# Using yarn
yarn add @nu-grid/nuxt @nuxt/ui @vueuse/nuxt
```

Add `@nu-grid/nuxt` to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nu-grid/nuxt'],
})
```

### CSS Setup

NuGrid requires its CSS to be imported in your application's main stylesheet. This ensures Tailwind scans the component classes for proper theming and focus styling.

Add the following to your `main.css` (or equivalent):

```css
@import "tailwindcss";
@import "@nuxt/ui";
@import "@nu-grid/nuxt/css";
```

## Quick Start

```vue
<script setup lang="ts">
import type { NuGridColumn } from '@nu-grid/nuxt/types'

interface Person {
  id: number
  name: string
  email: string
  age: number
}

const columns: NuGridColumn<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'age', header: 'Age', cellType: 'number' }
]

const data = ref<Person[]>([
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 32 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 28 },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', age: 45 }
])
</script>

<template>
  <NuGrid :columns="columns" :data="data" />
</template>
```

### Enabling Editing

```vue
<script setup lang="ts">
const columns: NuGridColumn<Person>[] = [
  { accessorKey: 'name', header: 'Name', editable: true },
  { accessorKey: 'email', header: 'Email', editable: true },
  {
    accessorKey: 'age',
    header: 'Age',
    cellType: 'number',
    editable: true
  }
]
</script>

<template>
  <NuGrid
    :columns="columns"
    :data="data"
    editable
    @cell-value-changed="handleChange"
  />
</template>
```

### With Virtualization

For large datasets, enable virtualization for optimal performance:

```vue
<template>
  <NuGrid
    :columns="columns"
    :data="largeDataset"
    virtualized
    :row-height="40"
    style="height: 600px"
  />
</template>
```

### Row Grouping

```vue
<template>
  <NuGridGroup
    :columns="columns"
    :data="data"
    :group-by="['department', 'status']"
  />
</template>
```

## Props

| Prop           | Type                                | Default       | Description                |
| -------------- | ----------------------------------- | ------------- | -------------------------- |
| `columns`      | `NuGridColumn<T>[]`                 | required      | Column definitions         |
| `data`         | `T[]`                               | required      | Row data array             |
| `editable`     | `boolean`                           | `false`       | Enable inline editing      |
| `virtualized`  | `boolean`                           | `false`       | Enable virtualization      |
| `rowHeight`    | `number`                            | `40`          | Row height in pixels       |
| `rowSelection` | `boolean \| 'single' \| 'multiple'` | `false`       | Enable row selection       |
| `theme`        | `NuGridTheme`                       | default theme | Custom theme configuration |

## Events

| Event                   | Payload                               | Description             |
| ----------------------- | ------------------------------------- | ----------------------- |
| `cell-click`            | `{ row, column, value }`              | Cell was clicked        |
| `cell-double-click`     | `{ row, column, value }`              | Cell was double-clicked |
| `cell-value-changed`    | `{ row, column, oldValue, newValue }` | Cell value was edited   |
| `row-selection-changed` | `{ selectedRows }`                    | Row selection changed   |
| `validation-error`      | `{ row, column, error }`              | Validation failed       |

See [EVENTS.md](/EVENTS.md) for a complete event reference.

## Development

```bash
# Install dependencies
pnpm install

# Generate type stubs and prepare
pnpm run dev:prepare

# Start development server with playground
pnpm run dev

# Start documentation site
pnpm run docs

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run E2E tests
pnpm run test:e2e

# Type check
pnpm run test:types

# Lint
pnpm run lint

# Format
pnpm run format

# Build for production
pnpm run prepack

# Release
pnpm run release
```

## Project Structure

```
src/
├── module.ts              # Nuxt module entry
└── runtime/
    ├── components/        # Vue components
    ├── composables/       # Vue composables
    ├── cell-types/        # Built-in cell types
    ├── types/             # TypeScript definitions
    └── themes/            # Theme configurations

docs/                      # Documentation site
playgrounds/nuxt/          # Development playground
test/                      # Unit tests
e2e/                       # End-to-end tests
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](./LICENSE.md)
