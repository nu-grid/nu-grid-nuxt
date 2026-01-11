---
seo:
  title: NuGrid - Data Grid for Nuxt
  description: A powerful data grid component for Nuxt with virtualization, cell editing, and TanStack Table integration.
---

::u-page-hero{class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950 -mt-16 pt-4 sm:pt-6"}
---
orientation: horizontal
---
#top
:hero-background

#title
Build Powerful [Data Grids]{.text-primary}.

#description
NuGrid is a feature-rich data grid component for Nuxt. Built on TanStack Table with Nuxt UI integration, it provides virtualization, inline editing, row grouping, and more.

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/nu-grid/nu-grid-nuxt
  target: _blank
  ---
  View on GitHub
  :::

#default
  ::client-only
  :::prose-pre{filename="app.vue"}
  ```vue
  <script setup lang="ts">
  import type { NuGridColumn } from '#nu-grid/types'

  const data = ref([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ])

  const columns: NuGridColumn<User>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
  ]
  </script>

  <template>
    <NuGrid :data="data" :columns="columns" />
  </template>
  ```
  :::
  ::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Core Features

#links
  :::u-button
  ---
  color: neutral
  size: lg
  to: /getting-started/installation
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  Get Started
  :::

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  ---
  #title
  High Performance

  #description
  Built-in virtualization for smooth rendering of thousands of rows with minimal memory footprint.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-pencil
  ---
  #title
  Inline Editing

  #description
  Edit cells directly in the grid with support for validation, custom editors, and keyboard navigation.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  Row Grouping

  #description
  Group data by one or more columns with expandable groups and aggregate functions.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-keyboard
  ---
  #title
  Keyboard Navigation

  #description
  Full keyboard support including Excel-like navigation, editing triggers, and shortcuts.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-palette
  ---
  #title
  Theming

  #description
  Fully customizable themes with built-in support for Nuxt UI's design system and dark mode.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-table
  ---
  #title
  TanStack Table

  #description
  Built on TanStack Table for powerful sorting, filtering, pagination, and column management.
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Everything You Need

#features
  :::u-page-feature
  ---
  icon: i-lucide-mouse-pointer-click
  ---
  #title
  Row Selection

  #description
  Single and multi-row selection with checkbox support and keyboard shortcuts.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-book-open
  ---
  #title
  Pagination

  #description
  Client-side pagination with configurable page sizes and auto page size calculation.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-move
  ---
  #title
  Column Resizing

  #description
  Drag to resize columns with auto-sizing and fit-to-content options.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Validation

  #description
  Schema-based validation with Zod, Valibot, or Yup. Cross-field validation support.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-file-spreadsheet
  ---
  #title
  Excel Export

  #description
  Export data to Excel with formatting, filtered data, and selected rows support.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-save
  ---
  #title
  State Persistence

  #description
  Automatically save and restore grid state including column sizes, sorting, and filters.
  :::
::

::u-page-section{class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900"}
  :::u-page-c-t-a
  ---
  links:
    - label: Get Started
      to: '/getting-started'
      trailingIcon: i-lucide-arrow-right
    - label: View on GitHub
      to: 'https://github.com/nu-grid/nuxt'
      target: _blank
      variant: subtle
      icon: i-simple-icons-github
  title: Ready to build powerful data grids?
  description: NuGrid provides everything you need to display, edit, and manage tabular data in your Nuxt applications.
  class: dark:bg-neutral-950
  ---

  :stars-bg
  :::
::
