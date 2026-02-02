<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const open = ref(false)

const links = [
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/',
    onSelect: () => {
      open.value = false
    },
  },
  {
    label: 'Cells & Editors',
    icon: 'i-lucide-square-stack',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Cell Data Types',
        icon: 'i-lucide-database',
        to: '/cell-data-types-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Data Type Inference',
        icon: 'i-lucide-sparkles',
        to: '/data-type-inference-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Cell Slots',
        icon: 'i-lucide-layout-template',
        to: '/cell-slots-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Long Text',
        icon: 'i-lucide-text',
        to: '/long-text-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Lookup Cell Type',
        icon: 'i-lucide-list',
        to: '/lookup-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Lazy Cell',
        icon: 'i-lucide-image',
        to: '/lazy-cell-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Validation',
        icon: 'i-lucide-shield-check',
        to: '/validation-zod-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Tooltip',
        icon: 'i-lucide-message-square',
        to: '/tooltip-demo',
        onSelect: () => {
          open.value = false
        },
      },
    ],
  },
  {
    label: 'Rows & Data',
    icon: 'i-lucide-rows-4',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Add New Row',
        icon: 'i-lucide-plus',
        to: '/add-row-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Add Row (Grouped)',
        icon: 'i-lucide-plus-square',
        to: '/add-row-grouped-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Monday-style Add Row',
        icon: 'i-lucide-layout-panel-top',
        to: '/monday-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Row Selection',
        icon: 'i-lucide-square-check',
        to: '/row-selection-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Focused Row',
        icon: 'i-lucide-focus',
        to: '/focused-row-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Row Slot',
        icon: 'i-lucide-layout-template',
        to: '/row-slot-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Paging',
        icon: 'i-lucide-book-open',
        to: '/paging-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Search',
        icon: 'i-lucide-search',
        to: '/search-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Search External',
        icon: 'i-lucide-search-code',
        to: '/search-external-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Group Paging',
        icon: 'i-lucide-layers',
        to: '/group-paging-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Action Menu',
        icon: 'i-lucide-ellipsis-vertical',
        to: '/action-menu-demo',
        onSelect: () => {
          open.value = false
        },
      },
    ],
  },
  {
    label: 'Layout & Columns',
    icon: 'i-lucide-layout-grid',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Container Height',
        icon: 'i-lucide-ruler',
        to: '/container-height-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'AutoSizing',
        icon: 'i-lucide-maximize',
        to: '/autosizing-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Multi-Row Layout',
        icon: 'i-lucide-rows-3',
        to: '/multi-row-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Column Menu',
        icon: 'i-lucide-more-vertical',
        to: '/column-menu-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Header Sort Button',
        icon: 'i-lucide-arrow-up-down',
        to: '/header-sort-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Nested Groups (3-Tier)',
        icon: 'i-lucide-layers',
        to: '/nested-groups-demo',
        onSelect: () => {
          open.value = false
        },
      },
    ],
  },
  {
    label: 'Import/Export & State',
    icon: 'i-lucide-arrow-left-right',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Excel Export',
        icon: 'i-lucide-file-spreadsheet',
        to: '/excel-export-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Excel Export (Grouped)',
        icon: 'i-lucide-file-spreadsheet',
        to: '/excel-export-grouped-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'State Persistence',
        icon: 'i-lucide-database',
        to: '/state-persistence-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Grid-to-Grid',
        icon: 'i-lucide-arrow-left-right',
        to: '/grid-to-grid',
        onSelect: () => {
          open.value = false
        },
      },
    ],
  },
  {
    label: 'Theming & Animation',
    icon: 'i-lucide-palette',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Compact Theme',
        icon: 'i-lucide-table-2',
        to: '/compact-theme-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Custom Themes',
        icon: 'i-lucide-palette',
        to: '/custom-theme-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Row Animation',
        icon: 'i-lucide-sparkles',
        to: '/animation-demo',
        onSelect: () => {
          open.value = false
        },
      },
    ],
  },
  {
    label: 'Full Demos',
    icon: 'i-lucide-component',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Full Demo',
        to: '/full-demo',
        exact: true,
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Full Demo Group',
        to: '/full-demo-group',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Full Demo Split Group',
        to: '/full-demo-splitgroup',
        onSelect: () => {
          open.value = false
        },
      },
    ],
  },
  {
    label: 'Developer Tools',
    icon: 'i-lucide-wrench',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Events Demo',
        icon: 'i-lucide-radio',
        to: '/events-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Plugin Examples',
        icon: 'i-lucide-puzzle',
        to: '/plugin-examples-demo',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Playwright Demo',
        icon: 'i-lucide-test-tube',
        to: '/playwright-demo',
        onSelect: () => {
          open.value = false
        },
      },
    ],
  },
] satisfies NavigationMenuItem[]

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links,
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nu-grid/nu-grid-nuxt/blob/main/playgrounds/nuxt/app/pages${
          route.path === '/' ? '/index' : route.path
        }.vue`,
        target: '_blank',
      },
    ],
  },
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
    >
      <template #header="{ collapsed }">
        <AppLogo :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
