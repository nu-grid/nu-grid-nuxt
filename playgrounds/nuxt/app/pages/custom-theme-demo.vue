<script setup lang="ts">
import type { NuGridColumn } from '#nu-grid/types'
import { createNuGridTheme, getAllThemes, registerTheme } from '#nu-grid/themes'

// Sample data
interface Person {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  joinDate: string
}

const data = ref<Person[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Engineer',
    status: 'active',
    joinDate: '2023-01-15',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Designer',
    status: 'active',
    joinDate: '2023-03-22',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    role: 'Manager',
    status: 'inactive',
    joinDate: '2022-11-08',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Engineer',
    status: 'active',
    joinDate: '2023-06-01',
  },
  {
    id: 5,
    name: 'Eve Davis',
    email: 'eve@example.com',
    role: 'Product Manager',
    status: 'active',
    joinDate: '2023-02-14',
  },
])

const columns: NuGridColumn<Person>[] = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role', enableSorting: true },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as string
      return status === 'active' ? '✓ Active' : '✗ Inactive'
    },
  },
  { accessorKey: 'joinDate', header: 'Join Date', enableSorting: true },
]

// Register custom themes
const oceanTheme = createNuGridTheme({
  name: 'ocean',
  displayName: 'Ocean',
  description: 'Ocean-inspired theme with cyan accents',
  baseTheme: 'compact',
  slots: {
    base: 'flex flex-col bg-cyan-50 dark:bg-cyan-950',
    th: 'flex shrink-0 items-stretch overflow-hidden p-0! group bg-cyan-100 dark:bg-cyan-900 border-r border-cyan-300 dark:border-cyan-600 last:border-r-0 text-left rtl:text-right text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide',
    td: 'flex shrink-0 items-center overflow-hidden border-r border-cyan-300/50 dark:border-cyan-600/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-sm text-cyan-900 dark:text-white outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-cyan-300 dark:border-cyan-600 hover:bg-cyan-100 dark:hover:bg-cyan-800 outline-none! focus-visible:outline-none!',
    headerContainer: 'flex items-stretch w-full h-full bg-cyan-100 dark:bg-cyan-900',
  },
  variants: {
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_rgb(6_182_212),inset_-1px_0_0_0_rgb(6_182_212),inset_0_1px_0_0_rgb(6_182_212),inset_0_-1px_0_0_rgb(6_182_212)]',
      },
    },
    focusRow: {
      true: {
        td: 'bg-cyan-500/12 dark:bg-cyan-500/25',
      },
    },
  },
})

const purpleTheme = createNuGridTheme({
  name: 'purple',
  displayName: 'Purple',
  description: 'Purple-themed grid with modern aesthetics',
  baseTheme: 'compact',
  slots: {
    base: 'flex flex-col bg-purple-50 dark:bg-purple-950',
    th: 'flex shrink-0 items-stretch overflow-hidden p-0! group bg-purple-100 dark:bg-purple-900 border-r border-purple-300 dark:border-purple-600 last:border-r-0 text-left rtl:text-right text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide',
    td: 'flex shrink-0 items-center overflow-hidden border-r border-purple-300/50 dark:border-purple-600/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-sm text-purple-900 dark:text-white outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-purple-300 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800 outline-none! focus-visible:outline-none!',
    headerContainer: 'flex items-stretch w-full h-full bg-purple-100 dark:bg-purple-900',
  },
  variants: {
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_rgb(168_85_247),inset_-1px_0_0_0_rgb(168_85_247),inset_0_1px_0_0_rgb(168_85_247),inset_0_-1px_0_0_rgb(168_85_247)]',
      },
    },
    focusRow: {
      true: {
        td: 'bg-purple-500/12 dark:bg-purple-500/25',
      },
    },
  },
})

const emeraldTheme = createNuGridTheme({
  name: 'emerald',
  displayName: 'Emerald',
  description: 'Fresh emerald green theme',
  baseTheme: 'compact',
  slots: {
    base: 'flex flex-col bg-emerald-50 dark:bg-emerald-950',
    th: 'flex shrink-0 items-stretch overflow-hidden p-0! group bg-emerald-100 dark:bg-emerald-900 border-r border-emerald-300 dark:border-emerald-600 last:border-r-0 text-left rtl:text-right text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide',
    td: 'flex shrink-0 items-center overflow-hidden border-r border-emerald-300/50 dark:border-emerald-600/50 last:border-r-0 px-2 py-1 whitespace-nowrap text-sm text-emerald-900 dark:text-white outline-none! focus-visible:outline-none!',
    tr: 'flex border-b border-emerald-300 dark:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-800 outline-none! focus-visible:outline-none!',
    headerContainer: 'flex items-stretch w-full h-full bg-emerald-100 dark:bg-emerald-900',
  },
  variants: {
    focusCell: {
      true: {
        td: 'z-1 shadow-[inset_1px_0_0_0_rgb(16_185_129),inset_-1px_0_0_0_rgb(16_185_129),inset_0_1px_0_0_rgb(16_185_129),inset_0_-1px_0_0_rgb(16_185_129)]',
      },
    },
    focusRow: {
      true: {
        td: 'bg-emerald-500/12 dark:bg-emerald-500/25',
      },
    },
  },
})

// Register the custom themes
registerTheme(oceanTheme)
registerTheme(purpleTheme)
registerTheme(emeraldTheme)

// Theme selection
const selectedTheme = ref<string>('default')

// Get all available themes
const availableThemes = computed(() => {
  return getAllThemes().map((theme) => ({
    value: theme.name,
    label: theme.displayName || theme.name,
  }))
})

const exampleCode = `// app.config.ts
export default defineAppConfig({
  nuGrid: {
    themes: [{
      name: 'ocean',
      displayName: 'Ocean Blue',
      baseTheme: 'compact',
      slots: {
        base: 'flex flex-col bg-cyan-50 dark:bg-cyan-950',
        th: '... bg-cyan-100 dark:bg-cyan-900',
      }
    }]
  }
})

// Usage
<NuGrid theme="ocean" :data="data" :columns="columns" />`
</script>

<template>
  <DemoLayout id="custom-theme-demo" title="Custom Themes Demo" info-label="Creating Custom Themes">
    <!-- Status Indicators -->
    <template #status>
      <DemoStatusItem label="Active Theme" :value="selectedTheme" />
      <DemoStatusItem label="Total Themes" :value="availableThemes.length" />
      <DemoStatusItem label="Rows" :value="data.length" />
    </template>

    <!-- Controls -->
    <template #controls>
      <DemoControlGroup label="Select Theme">
        <div class="grid grid-cols-2 gap-1 md:grid-cols-3">
          <UButton
            v-for="theme in availableThemes"
            :key="theme.value"
            :color="selectedTheme === theme.value ? 'primary' : 'neutral'"
            :variant="selectedTheme === theme.value ? 'solid' : 'outline'"
            icon="i-lucide-palette"
            size="xs"
            @click="selectedTheme = theme.value"
          >
            {{ theme.label }}
          </UButton>
        </div>
      </DemoControlGroup>
    </template>

    <!-- Info Content -->
    <template #info>
      <p class="mb-3 text-sm text-muted">
        NuGrid features an extensible theme system that allows you to create custom themes using
        pure Tailwind CSS classes. This demo shows:
      </p>
      <ul class="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
        <li><strong>Built-in themes:</strong> Default and Compact themes included</li>
        <li><strong>Custom themes:</strong> Ocean, Purple, and Emerald examples</li>
        <li><strong>Theme extension:</strong> Build on existing themes with baseTheme</li>
        <li><strong>Pure Tailwind:</strong> No CSS variables - just Tailwind classes</li>
        <li><strong>Dark mode:</strong> Full dark mode support via dark: prefix</li>
      </ul>
      <div class="rounded bg-default/50 p-2 text-sm text-muted">
        <strong>Three ways to register:</strong>
        <code class="ml-1 text-xs">app.config.ts</code>, <code class="ml-1 text-xs">plugins</code>,
        or
        <code class="ml-1 text-xs">theme files</code>
      </div>
    </template>

    <!-- Grid -->
    <NuGrid
      :key="selectedTheme"
      :theme="selectedTheme"
      :data="data"
      :columns="columns"
      :focus="{ retain: true }"
      class="max-h-[400px] rounded border border-default"
    />

    <!-- Theme Cards -->
    <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-lg border border-default p-4">
        <h3 class="mb-2 font-semibold">Default Theme</h3>
        <p class="text-sm text-muted">
          Uses your app's primary color with comfortable spacing. Best for general-purpose grids.
        </p>
      </div>
      <div class="rounded-lg border border-default p-4">
        <h3 class="mb-2 font-semibold">Compact Theme</h3>
        <p class="text-sm text-muted">
          Blue accent with tighter spacing. Ideal for data-dense applications and dashboards.
        </p>
      </div>
      <div class="rounded-lg border border-default p-4">
        <h3 class="mb-2 font-semibold">Custom Themes</h3>
        <p class="text-sm text-muted">
          Create your own themes by extending built-ins or starting from scratch with Tailwind.
        </p>
      </div>
    </div>

    <!-- Code Example -->
    <template #code>
      <DemoCodeBlock title="Creating a Custom Theme:" :code="exampleCode" />
      <div class="mt-4 rounded-lg bg-default/50 p-4">
        <p class="text-sm text-muted">
          📖 See THEME_GUIDE.md for complete documentation on creating custom themes.
        </p>
      </div>
    </template>
  </DemoLayout>
</template>

<style scoped>
code {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
