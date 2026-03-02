<script setup lang="ts">
const features = [
  {
    title: 'Cell Types',
    description:
      'Rich cell types including text, number, date, select, checkbox, and custom renderers',
    icon: 'i-lucide-square-stack',
    to: '/cell-data-types-demo',
  },
  {
    title: 'Row Management',
    description: 'Add, delete, select, and focus rows with full keyboard navigation',
    icon: 'i-lucide-rows-4',
    to: '/row-selection-demo',
  },
  {
    title: 'Column Features',
    description: 'Resizable columns, sorting, grouping, and column menus',
    icon: 'i-lucide-columns-3',
    to: '/column-menu-demo',
  },
  {
    title: 'Theming',
    description: 'Customizable themes with compact mode and custom color schemes',
    icon: 'i-lucide-palette',
    to: '/custom-theme-demo',
  },
  {
    title: 'Excel Export',
    description: 'Export grid data to Excel with formatting and grouped data support',
    icon: 'i-lucide-file-spreadsheet',
    to: '/excel-export-demo',
  },
  {
    title: 'Full Demo',
    description: 'Complete demo showcasing all NuGrid features together',
    icon: 'i-lucide-component',
    to: '/full-demo',
  },
]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="NuGrid Playground">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-8 p-6">
        <div class="space-y-4 text-center">
          <h1 class="text-3xl font-bold">Welcome to NuGrid</h1>
          <p class="text-muted mx-auto max-w-2xl text-lg">
            A powerful data grid component for Nuxt with virtualization, cell editing, and TanStack
            Table integration.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <UCard
            v-for="feature in features"
            :key="feature.title"
            :to="feature.to"
            class="hover:ring-primary cursor-pointer transition-all hover:ring-2"
          >
            <div class="flex items-start gap-4">
              <div class="bg-primary/10 rounded-lg p-2">
                <UIcon :name="feature.icon" class="text-primary size-6" />
              </div>
              <div class="space-y-1">
                <h3 class="font-semibold">{{ feature.title }}</h3>
                <p class="text-muted text-sm">{{ feature.description }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <div class="text-center">
          <p class="text-muted text-sm">
            Explore the sidebar navigation for all available demos and features.
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
